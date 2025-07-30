#!/bin/bash

# NARAP Frontend - Vercel Deployment Script

echo "🚀 NARAP Frontend - Vercel Deployment"
echo "====================================="

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if .vercel directory exists (project already configured)
if [ -d ".vercel" ]; then
    echo "🔄 Deploying to existing Vercel project..."
    vercel --prod
else
    echo "🆕 Creating new Vercel project..."
    vercel
fi

echo ""
echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Check your deployment URL"
echo "2. Configure custom domain (optional)"
echo "3. Test all functionality"
echo "4. Update DNS if using custom domain"
echo ""
echo "For more information, see: README.md" 