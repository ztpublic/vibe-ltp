const fs = require('fs');
const path = require('path');

const allowedExtensions = new Set(['.css', '.svg']);
const srcRoot = path.resolve(__dirname, '../src/chatbot');
const distRoot = path.resolve(__dirname, '../dist/chatbot');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const copyFiltered = (srcDir, destDir) => {
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyFiltered(srcPath, destPath);
      continue;
    }

    const ext = path.extname(entry.name);
    if (allowedExtensions.has(ext)) {
      ensureDir(path.dirname(destPath));
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const main = () => {
  if (!fs.existsSync(srcRoot)) {
    console.warn('[copy-chatbot-assets] source folder missing:', srcRoot);
    return;
  }

  copyFiltered(srcRoot, distRoot);
  console.log('[copy-chatbot-assets] copied CSS/SVG assets to dist/chatbot');
};

main();
