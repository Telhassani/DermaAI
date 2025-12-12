#!/bin/bash

# DermAI Development Restart Script
# Cleans up caches and restarts both frontend and backend services
# Usage: ./dev-restart.sh [full|backend|frontend]

set -e

PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cleanup_frontend() {
  echo -e "${BLUE}🧹 Cleaning frontend cache...${NC}"
  rm -rf "$FRONTEND_DIR/.next" 2>/dev/null || true
  rm -rf "$FRONTEND_DIR/node_modules/.cache" 2>/dev/null || true
  echo -e "${GREEN}✓ Frontend cache cleaned${NC}"
}

cleanup_backend() {
  echo -e "${BLUE}🧹 Cleaning backend cache...${NC}"
  find "$BACKEND_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
  find "$BACKEND_DIR" -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
  echo -e "${GREEN}✓ Backend cache cleaned${NC}"
}

cleanup_auth_storage() {
  echo -e "${BLUE}🧹 Clearing browser localStorage...${NC}"
  echo "⚠️  Remember to clear browser localStorage manually:"
  echo "   - Open DevTools (F12)"
  echo "   - Go to Application > Local Storage"
  echo "   - Delete 'auth-store' and any other auth keys"
}

start_backend() {
  echo -e "${BLUE}🚀 Starting backend on port 8000...${NC}"
  
  # Kill anything running on port 8000
  PID_8000=$(lsof -ti :8000 || true)
  if [ ! -z "$PID_8000" ]; then
    echo -e "${YELLOW}⚠️  Killing existing process on port 8000 (PID: $PID_8000)...${NC}"
    kill -9 $PID_8000 2>/dev/null || true
  fi

  cd "$BACKEND_DIR"

  # Check if venv exists
  if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found, creating one...${NC}"
    python3 -m venv venv
  fi

  source venv/bin/activate 2>/dev/null || . venv/Scripts/activate
  pip install -q -r requirements.txt

  echo -e "${GREEN}✓ Backend dependencies ready${NC}"
  echo -e "${BLUE}Starting uvicorn...${NC}"
  uvicorn app.main:app --reload --port 8000 &
  BACKEND_PID=$!
  echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
}

start_frontend() {
  echo -e "${BLUE}🚀 Starting frontend on port 3000...${NC}"
  cd "$FRONTEND_DIR"

  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not found, installing...${NC}"
    npm install
  fi

  echo -e "${GREEN}✓ Frontend dependencies ready${NC}"
  echo -e "${BLUE}Starting dev server...${NC}"
  npm run dev &
  FRONTEND_PID=$!
  echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
}

show_help() {
  echo "DermAI Development Restart Script"
  echo ""
  echo "Usage: ./dev-restart.sh [command]"
  echo ""
  echo "Commands:"
  echo "  full      - Full cleanup and restart both services (default)"
  echo "  backend   - Restart only backend"
  echo "  frontend  - Restart only frontend"
  echo "  clean     - Clean caches without restarting"
  echo ""
  echo "Example:"
  echo "  ./dev-restart.sh full"
  echo "  ./dev-restart.sh backend"
}

# Main logic
COMMAND=${1:-full}

case $COMMAND in
  full)
    cleanup_frontend
    cleanup_backend
    cleanup_auth_storage
    echo ""
    echo -e "${YELLOW}Starting services...${NC}"
    start_backend
    sleep 2
    start_frontend
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}🎉 DermAI is ready!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔌 Backend:  http://localhost:8000"
    echo "📚 API Docs: http://localhost:8000/docs"
    echo ""
    echo "Demo Credentials:"
    echo "  👨‍⚕️  Doctor:    doctor@dermai.com / Doctor123!"
    echo "  🔐 Admin:     admin@dermai.com / Admin123!"
    echo "  📋 Secretary: secretary@dermai.com / Secretary123!"
    echo ""
    ;;

  backend)
    cleanup_backend
    start_backend
    echo -e "${GREEN}✓ Backend restarted${NC}"
    ;;

  frontend)
    cleanup_frontend
    start_frontend
    echo -e "${GREEN}✓ Frontend restarted${NC}"
    ;;

  clean)
    cleanup_frontend
    cleanup_backend
    cleanup_auth_storage
    echo -e "${GREEN}✓ Caches cleaned${NC}"
    ;;

  help|--help|-h)
    show_help
    ;;

  *)
    echo "Unknown command: $COMMAND"
    show_help
    exit 1
    ;;
esac
