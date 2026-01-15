import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MantlePredict - RWA Prediction Markets",
  description:
    "Decentralized prediction markets for Real World Asset events on Mantle Network. Bet on commodities, bonds, real estate, and more.",
  keywords: ["prediction market", "Mantle", "DeFi", "RWA", "blockchain"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border/40 py-6">
              <div className="container mx-auto max-w-7xl px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Built for Mantle Network Hackathon 2026
                  </p>
                  <div className="flex items-center gap-4">
                    <a
                      href="https://mantle.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Mantle Network
                    </a>
                    <a
                      href="https://faucet.sepolia.mantle.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Get Testnet MNT
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
