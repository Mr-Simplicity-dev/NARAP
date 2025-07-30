@echo off
REM NARAP Frontend - Local Development Server (Windows)

echo 🚀 NARAP Frontend - Local Development
echo ====================================

REM Check if we're in the frontend directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the frontend directory
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
npm install

echo 🚀 Starting development server...
echo.
echo 🌐 Frontend will be available at: http://localhost:3000
echo 🔐 Admin panel will be available at: http://localhost:3000/admin
echo.
echo Press Ctrl+C to stop the server
echo.

npm start 