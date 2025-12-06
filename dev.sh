#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Starting Open Canvas Dev Server..."
echo ""

# Trap to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    jobs -p | xargs kill 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM EXIT

# Start LangGraph server
echo "Starting LangGraph server..."
cd "$SCRIPT_DIR/apps/agents" && yarn dev &
LANGGRAPH_PID=$!

# Wait for LangGraph to start
sleep 5

# Start Next.js
echo "Starting Next.js frontend..."
cd "$SCRIPT_DIR/apps/web" && yarn dev &
NEXTJS_PID=$!

# Wait for Next.js to start
sleep 5

echo ""
echo "✨ Ready! ✨"
echo ""
echo "Services running:"
echo "  🚀 LangGraph API:     http://localhost:54367"
echo "  🌐 Next.js App:       http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait
