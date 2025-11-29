#!/bin/bash

# Vibe LTP Git-Based Development Deployment Script
# Deploys the project to a remote server using git pull and starts pnpm dev in background

set -euo pipefail

# ============================================
# Configuration
# ============================================

# Git repository (hardcoded)
GIT_REPO="https://github.com/ztpublic/vibe-ltp"
BRANCH="${BRANCH:-main}"

# Remote server settings (override via environment variables)
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:-your.server.com}"
REMOTE_DIR="${REMOTE_DIR:-~/apps/vibe-ltp-dev}"
SSH_PORT="${SSH_PORT:-22}"

# Server port settings
FRONTEND_PORT="${FRONTEND_PORT:-8810}"
BACKEND_PORT="${BACKEND_PORT:-8811}"

# Optional flags
DRY_RUN="${DRY_RUN:-0}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"
FORCE_INSTALL="${FORCE_INSTALL:-0}"

# OpenRouter API Key
OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}"

# ============================================
# Helper Functions
# ============================================

print_usage() {
  cat <<EOF
Usage: $0 [OPTIONS] [OPENROUTER_API_KEY]

Git-based deploy: Clone or pull repo on remote server and start dev server.

Arguments:
  OPENROUTER_API_KEY  OpenRouter API key (optional, can also set via env var)

Environment Variables:
  BRANCH              Git branch to deploy (default: main)
  REMOTE_USER         SSH username (default: youruser)
  REMOTE_HOST         Remote server hostname (default: your.server.com)
  REMOTE_DIR          Remote deployment directory (default: ~/apps/vibe-ltp-dev)
  SSH_PORT            SSH port (default: 22)
  FRONTEND_PORT       Frontend server port (default: 3000)
  BACKEND_PORT        Backend server port (default: 4000)
  OPENROUTER_API_KEY  OpenRouter API key (can also pass as argument)
  SKIP_INSTALL        Skip pnpm install step (default: 0)
  FORCE_INSTALL       Always run pnpm install (default: 0)
  DRY_RUN             Print commands instead of executing (default: 0)

Options:
  -h, --help          Show this help message
  --stop              Stop the remote development server

Examples:
  # Deploy with OpenRouter API key as argument
  REMOTE_USER=myuser REMOTE_HOST=example.com $0 sk-or-v1-xxx

  # Deploy with OpenRouter API key as environment variable
  OPENROUTER_API_KEY=sk-or-v1-xxx REMOTE_USER=myuser REMOTE_HOST=example.com $0

  # Deploy specific branch
  BRANCH=dev REMOTE_USER=myuser REMOTE_HOST=example.com $0 sk-or-v1-xxx

  # Stop the remote server
  REMOTE_USER=myuser REMOTE_HOST=example.com $0 --stop

  # Deploy with custom ports and always install deps
  FORCE_INSTALL=1 FRONTEND_PORT=8080 BACKEND_PORT=8081 REMOTE_USER=myuser REMOTE_HOST=example.com $0

  # Dry run to see what would be executed
  DRY_RUN=1 REMOTE_USER=myuser REMOTE_HOST=example.com $0
EOF
}

run_cmd() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "[DRY RUN] $*"
  else
    echo "Running: $*"
    "$@"
  fi
}

log() {
  echo "==> $*"
}

# ============================================
# Argument Parsing
# ============================================

STOP_MODE=0

if [ $# -gt 0 ]; then
  case "$1" in
    -h|--help)
      print_usage
      exit 0
      ;;
    --stop)
      STOP_MODE=1
      ;;
    sk-or-*)
      # OpenRouter API key passed as argument
      OPENROUTER_API_KEY="$1"
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
fi

# ============================================
# Validation
# ============================================

if [ "$REMOTE_USER" = "youruser" ] || [ "$REMOTE_HOST" = "your.server.com" ]; then
  echo "Error: Please set REMOTE_USER and REMOTE_HOST environment variables"
  echo ""
  print_usage
  exit 1
fi

# Expand tilde in REMOTE_DIR if present
if [[ "$REMOTE_DIR" == ~* ]]; then
  # Get the home directory from the remote server
  REMOTE_HOME=$(ssh -p "$SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo \$HOME")
  REMOTE_DIR="${REMOTE_DIR/\~/$REMOTE_HOME}"
fi

# ============================================
# Stop Mode: Shutdown remote development server
# ============================================

if [ "$STOP_MODE" = "1" ]; then
  log "Stopping development server on $REMOTE_USER@$REMOTE_HOST"
  
  run_cmd ssh -p "$SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" bash <<EOF
    set -e
    
    echo "==> Stopping development server"
    
    # Kill using PID file if exists
    if [ -f '$REMOTE_DIR/dev-server.pid' ]; then
      PID=\$(cat '$REMOTE_DIR/dev-server.pid')
      if kill -0 \$PID 2>/dev/null; then
        kill \$PID
        echo "==> Stopped process with PID: \$PID"
        rm '$REMOTE_DIR/dev-server.pid'
      else
        echo "==> Process \$PID not running, cleaning up PID file"
        rm '$REMOTE_DIR/dev-server.pid'
      fi
    else
      # Fallback: kill by process name
      if pkill -f 'pnpm dev'; then
        echo "==> Stopped pnpm dev process"
      else
        echo "==> No pnpm dev process found"
      fi
    fi
    
    echo "==> Server stopped successfully"
EOF
  
  log "Server stopped!"
  exit 0
fi

# ============================================
# Deploy Mode: Setup or Update (auto-detect)
# ============================================

log "Starting deployment to $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
log "Branch: $BRANCH"
log "Assuming changes are already pushed to GitHub"
log "Deploying to remote server (auto-detecting first time vs update)"

run_cmd ssh -p "$SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" bash <<EOF
  set -e
  
  # Check if directory exists and has git repo
  if [ -d '$REMOTE_DIR/.git' ]; then
    echo "==> Existing repository found, updating..."
    
    cd '$REMOTE_DIR'
    git fetch
    git checkout '$BRANCH'
    git pull --ff-only
    
  else
    echo "==> No repository found, performing initial setup..."
    
    # Create parent directory structure
    mkdir -p \$(dirname '$REMOTE_DIR')
    
    # Clone repository
    git clone '$GIT_REPO' '$REMOTE_DIR'
    cd '$REMOTE_DIR'
    git checkout '$BRANCH'
  fi
  
  echo "==> Installing dependencies"
  pnpm install
  
  echo "==> Building packages"
  pnpm build
  
  echo "==> Restarting development server"
  
  # Kill existing process if running
  pkill -f 'pnpm dev' || echo "No existing pnpm dev process to kill"
  
  # Debug: Show environment variables being passed
  echo "BACKEND_PORT=$BACKEND_PORT"
  echo "FRONTEND_PORT=$FRONTEND_PORT"
  echo "NEXT_PUBLIC_API_BASE_URL=http://$REMOTE_HOST:$BACKEND_PORT"
  echo "CORS_ORIGIN=http://$REMOTE_HOST:$FRONTEND_PORT"
  
  # Start in background with nohup
  cd '$REMOTE_DIR'
  nohup env BACKEND_PORT=$BACKEND_PORT FRONTEND_PORT=$FRONTEND_PORT CORS_ORIGIN="http://$REMOTE_HOST:$FRONTEND_PORT" NEXT_PUBLIC_API_BASE_URL="http://$REMOTE_HOST:$BACKEND_PORT" OPENROUTER_API_KEY='$OPENROUTER_API_KEY' pnpm dev > dev-server.log 2>&1 &
  echo \$! > dev-server.pid
  
  echo "==> Development server started in background (PID: \$(cat dev-server.pid))"
  echo "Log file: $REMOTE_DIR/dev-server.log"
EOF

# ============================================
# Success Message
# ============================================

log "Deployment complete!"
echo ""
echo "Your development server is now running on the remote server."
echo "  Frontend: http://$REMOTE_HOST:$FRONTEND_PORT"
echo "  Backend API: http://$REMOTE_HOST:$BACKEND_PORT"
echo ""
