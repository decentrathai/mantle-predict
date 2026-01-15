import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mantleSepoliaTestnet } from "./chains";

export const config = getDefaultConfig({
  appName: "MantlePredict",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || "demo-project-id",
  chains: [mantleSepoliaTestnet],
  ssr: true,
});
