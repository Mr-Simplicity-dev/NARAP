@echo off
REM NARAP Frontend - Vercel Deployment Script (Windows)

echo 🚀 NARAP Frontend - Vercel Deployment
echo =====================================

REM Check if we're in the frontend directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the frontend directory
    pause
    exit /b 1
)

REM Check if vercel is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

REM Check if .vercel directory exists (project already configured)
if exist ".vercel" (
    echo 🔄 Deploying to existing Vercel project...
    vercel --prod
) else (
    echo 🆕 Creating new Vercel project...
    vercel
)

echo.
echo ✅ Deployment completed!
echo.
echo Next steps:
echo 1. Check your deployment URL
echo 2. Configure custom domain (optional)
echo 3. Test all functionality
echo 4. Update DNS if using custom domain
echo.
echo For more information, see: README.md
pause 