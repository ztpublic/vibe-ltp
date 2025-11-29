#!/bin/bash

# Vibe LTP Development Deployment Script
# Deploys the project to a remote server and starts pnpm dev in a tmux session

set -euo pipefail

# ============================================
# Configuration
# ============================================

# Remote server settings (override via environment variables)
REMOTE_USER="${REMOTE_USER:-youruser}"
REMOTE_HOST="${REMOTE_HOST:-your.server.com}"
REMOTE_DIR="${REMOTE_DIR:-/home/youruser/apps/vibe-ltp-dev}"
SSH_PORT="${SSH_PORT:-22}"
TMUX_SESSION="${TMUX_SESSION:-vibe-ltp-dev}"

# Optional flags
DRY_RUN="${DRY_RUN:-0}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"

# ============================================
# Helper Functions
# ============================================

print_usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Deploy vibe-ltp to remote server and start development server.

Environment Variables:
  REMOTE_USER      SSH username (default: youruser)
  REMOTE_HOST      Remote server hostname (default: your.server.com)
  REMOTE_DIR       Remote deployment directory (default: /home/youruser/apps/vibe-ltp-dev)
  SSH_PORT         SSH port (default: 22)
  TMUX_SESSION     Tmux session name (default: vibe-ltp-dev)
  SKIP_INSTALL     Skip pnpm install step (default: 0)
  DRY_RUN          Print commands instead of executing (default: 0)

Options:
  -h, --help       Show this help message

Examples:
  # Deploy with default settings
  REMOTE_USER=myuser REMOTE_HOST=example.com $0

  # Deploy and skip dependency installation
  SKIP_INSTALL=1 REMOTE_USER=myuser REMOTE_HOST=example.com $0

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

if [ $# -gt 0 ]; then
  case "$1" in
    -h|--help)
      print_usage
      exit 0
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

# ============================================
# Deployment Steps
# ============================================

log "Starting deployment to $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"

# Step 1: Create remote directory
log "Step 1/5: Ensuring remote directory exists"
run_cmd ssh -p "$SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p '$REMOTE_DIR'"

# Step 2: Copy project files to remote
log "Step 2/5: Copying project files to remote server"
run_cmd scp -P "$SSH_PORT" -r ./ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"

# Step 3: Install dependencies (optional)
if [ "$SKIP_INSTALL" = "0" ]; then
  log "Step 3/5: Installing dependencies with pnpm"
  run_cmd ssh -p "$SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" "cd '$REMOTE_DIR' && pnpm install"
else
  log "Step 3/5: Skipping dependency installation (SKIP_INSTALL=1)"
fi

# Step 4: Stop existing tmux session
log "Step 4/5: Stopping existing development server (if running)"
run_cmd ssh -p "$SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" "tmux kill-session -t '$TMUX_SESSION' 2>/dev/null || true"

# Step 5: Start new tmux session with pnpm dev
log "Step 5/5: Starting development server in tmux session '$TMUX_SESSION'"
run_cmd ssh -p "$SSH_PORT" "$REMOTE_USER@$REMOTE_HOST" \
  "cd '$REMOTE_DIR' && tmux new -d -s '$TMUX_SESSION' 'pnpm dev'"

# ============================================
# Success Message
# ============================================

log "Deployment complete!"
echo ""
echo "Your development server is now running on the remote server."
echo "To view logs, attach to the tmux session:"
echo "  ssh -t -p $SSH_PORT $REMOTE_USER@$REMOTE_HOST \"tmux attach -t $TMUX_SESSION\""
echo ""
echo "To detach from tmux: Press Ctrl+B, then D"
