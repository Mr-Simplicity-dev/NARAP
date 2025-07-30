#!/bin/bash

# NARAP Frontend - Local Development Server

echo "🚀 NARAP Frontend - Local Development"
echo "===================================="

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🚀 Starting development server..."
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔐 Admin panel will be available at: http://localhost:3000/admin"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start 