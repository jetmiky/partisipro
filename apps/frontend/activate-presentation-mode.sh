#!/bin/bash

# Partisipro Presentation Mode Activator
# Quickly switches the frontend to presentation mode for investor demos

echo "🎯 Activating Partisipro Presentation Mode for Investor Demo..."

# Copy presentation environment variables
if [ -f .env.presentation ]; then
    cp .env.presentation .env.local
    echo "✅ Environment variables configured for presentation mode"
else
    echo "⚠️  Warning: .env.presentation not found, creating from template..."
    cat > .env.local << EOL
# Presentation Mode Environment Variables
NEXT_PUBLIC_PRESENTATION_MODE=true
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=arbitrum-sepolia

# Disable real external services in presentation mode
NEXT_PUBLIC_USE_MOCK_AUTH=true
NEXT_PUBLIC_USE_MOCK_KYC=true
NEXT_PUBLIC_USE_MOCK_PAYMENTS=true
EOL
fi

echo "🚀 Presentation Mode Activated!"
echo ""
echo "📋 Demo Instructions:"
echo "1. Run 'npm run dev' to start the application"
echo "2. Open http://localhost:3000?presentation=true"
echo "3. Navigate freely - no authentication required"
echo "4. Demo user: Rina Sari Dewi (Retail Investor)"
echo "5. Portfolio: IDR 132.5M in 4 infrastructure projects"
echo "6. Features: Real-time updates, governance voting, profit claiming"
echo ""
echo "💡 Demo Flow Suggestions:"
echo "   → Dashboard: Show portfolio performance and identity verification"
echo "   → Marketplace: Browse Jakarta MRT and Bandung Smart Highway projects"
echo "   → Governance: Vote on active proposals"
echo "   → Profile: Demonstrate one-time KYC benefits"
echo ""
echo "🔄 To disable: Delete .env.local and restart the application"