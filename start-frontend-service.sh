#!/bin/bash
# Script wrapper para iniciar el frontend desde systemd

cd /home/jarvis/fesv/fesv/admin-interface/frontend

# Cargar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Usar Node 20.19.6
export PATH="/home/jarvis/.nvm/versions/node/v20.19.6/bin:$PATH"

# Iniciar Vite
exec npm run dev

