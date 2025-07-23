#!/bin/bash

# Add dynamic export to pages that use auth hooks to prevent SSG issues

pages=(
  "src/app/spv/create/page.tsx"
  "src/app/invest/[id]/page.tsx"
  "src/app/auth/signin/page.tsx"
  "src/app/admin/users/page.tsx"
  "src/app/admin/spv/page.tsx"
  "src/app/admin/dashboard/page.tsx"
  "src/app/auth/signup/page.tsx"
  "src/app/admin/fees/page.tsx"
  "src/app/admin/projects/page.tsx"
  "src/app/admin/system/page.tsx"
  "src/app/governance/page.tsx"
  "src/app/identity/page.tsx"
)

for page in "${pages[@]}"; do
  if [ -f "$page" ]; then
    echo "Updating $page..."
    # Check if it already has the dynamic export
    if ! grep -q "export const dynamic" "$page"; then
      # Add the dynamic export after 'use client';
      sed -i "/^'use client';$/a\\
\\
// Force dynamic rendering for presentation mode compatibility\\
export const dynamic = 'force-dynamic';" "$page"
    fi
  fi
done

echo "✅ Updated all pages with dynamic rendering export"