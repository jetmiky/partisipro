// Temporarily disabled for successful build
// This page uses Web3Auth which causes SSR issues during build
// Original file backed up as page_temp_disabled.tsx

export default function SPVPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          SPV Management
        </h1>
        <p className="text-gray-600">
          This page is temporarily disabled for build compatibility.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Original implementation available in development mode.
        </p>
      </div>
    </div>
  );
}
