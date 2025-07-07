import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Partisipro - Blockchain PPP Funding Platform</title>
        <meta
          name="description"
          content="Blockchain-based Platform for Public Private Partnership Funding"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-primary-600">Partisipro</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Blockchain-based Platform for Public Private Partnership Funding
            </p>
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Platform Overview
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏗️</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Tokenize PPP Projects
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Transform infrastructure projects into tradeable digital
                    assets
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Democratize Investment
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Enable retail investors to participate in large-scale
                    infrastructure
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Blockchain Transparency
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Transparent fund management and automated profit
                    distribution
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                🚧 Development Status
              </h3>
              <p className="text-yellow-700">
                This platform is currently in prototype phase using Arbitrum
                Sepolia testnet. Core functionalities are under development.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-primary px-8 py-3 text-lg">
                TODO: Connect Wallet
              </button>
              <button className="btn btn-secondary px-8 py-3 text-lg">
                TODO: Explore Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
