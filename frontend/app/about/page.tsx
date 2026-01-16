export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          About <span className="text-primary">MantlePredict</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Decentralized prediction markets for Real World Asset events on Mantle Network
        </p>
      </div>

      {/* Video Section */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Watch Our Demo</h2>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/JUf9ePiMpHM"
            title="MantlePredict Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-xl font-semibold mb-3 text-primary">RWA Predictions</h3>
          <p className="text-muted-foreground">
            Trade on outcomes of real-world assets including commodities, bonds, real estate, and cryptocurrencies.
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-xl font-semibold mb-3 text-primary">Low Fees</h3>
          <p className="text-muted-foreground">
            Built on Mantle L2 for extremely low gas fees, making micro-predictions economically viable.
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-xl font-semibold mb-3 text-primary">Decentralized</h3>
          <p className="text-muted-foreground">
            Fully on-chain smart contracts ensure transparent and trustless market operations.
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-xl font-semibold mb-3 text-primary">CPMM Pricing</h3>
          <p className="text-muted-foreground">
            Constant Product Market Maker ensures fair pricing and continuous liquidity for all markets.
          </p>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-2xl font-semibold mb-4">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {["Solidity", "Hardhat", "Next.js 14", "wagmi", "RainbowKit", "Mantle L2", "TypeScript", "TailwindCSS"].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-secondary rounded-full text-sm text-secondary-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
