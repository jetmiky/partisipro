export default function Home() {
  return (
    <div className="p-8 min-h-screen bg-background text-foreground">
      <div className="card">
        <h1 className="text-2xl font-bold text-primary-600 mb-4">
          Welcome to Partisipro
        </h1>
        <p className="text-secondary-600 mb-6">
          Blockchain-based Platform for Public Private Partnership Funding
        </p>

        <div className="flex gap-4">
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-secondary">Secondary Button</button>
        </div>

        <div className="mt-6">
          <input className="input" placeholder="Test input field" />
        </div>

        <div className="mt-4 p-4 bg-success-50 text-success-600 rounded">
          ✅ Tailwind v4 migration successful! Custom components working.
        </div>

        <div className="mt-4 p-4 border border-border rounded">
          🌓 Dark mode support ready - automatically adapts to system preference
        </div>
      </div>
    </div>
  );
}
