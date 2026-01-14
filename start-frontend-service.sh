#!/bin/bash
# Script wrapper para iniciar el frontend desde systemd
# Ajusta la ruta según tu instalación

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Cargar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Usar Node 20.19.6
export PATH="/home/jarvis/.nvm/versions/node/v20.19.6/bin:$PATH"

# Iniciar Vite
exec npm run dev

