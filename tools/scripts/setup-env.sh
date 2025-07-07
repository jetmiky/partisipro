#!/bin/bash

# Partisipro Development Environment Setup Script
# This script sets up the development environment for the Partisipro project

set -e

echo "🚀 Setting up Partisipro development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+ and try again."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment files
echo "🔧 Setting up environment files..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
    echo "⚠️  Please update .env.local with your configuration"
else
    echo "✅ .env.local already exists"
fi

# Build shared packages
echo "🏗️  Building shared packages..."
npm run build --workspace=@partisipro/shared

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Update .env.local with your configuration"
echo "   2. Run 'npm run dev' to start all services"
echo "   3. Visit http://localhost:3000 for the frontend"
echo "   4. Visit http://localhost:3001/api/docs for API documentation"
echo ""
echo "📚 Available commands:"
echo "   npm run dev          - Start all services in development mode"
echo "   npm run build        - Build all packages"
echo "   npm run test         - Run all tests"
echo "   npm run lint         - Lint all code"
echo "   npm run format       - Format all code"
echo ""