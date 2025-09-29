#!/bin/bash

# VeryFi Deployment Script
echo "🚀 Deploying VeryFi to Vercel..."

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "❌ Build directory not found. Running npm run build..."
    npm run build
fi

# Deploy using vercel CLI
echo "📦 Deploying to Vercel..."
npx vercel --prod --yes

echo "✅ Deployment complete!"
echo "🌐 Your VeryFi app should be live at the URL shown above"
