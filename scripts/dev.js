// Electron apps must not run with ELECTRON_RUN_AS_NODE=1.
// IDEs like VS Code set this env var, which breaks Electron's main process.
delete process.env.ELECTRON_RUN_AS_NODE
delete process.env.ELECTRON_FORCE_IS_PACKAGED

const { execSync } = require('child_process')
execSync('electron-vite dev', { stdio: 'inherit', env: process.env })
