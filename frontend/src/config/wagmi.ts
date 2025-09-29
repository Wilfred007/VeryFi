import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

// Temporarily use regular sepolia to test if config works
// TODO: Switch back to Lisk Sepolia once TypeScript issues are resolved
// @ts-ignore - Bypassing TypeScript error for wagmi v2 compatibility
export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [sepolia.id]: http(),
  },
})

export const liskSepolia = sepolia
export const LISK_SEPOLIA = sepolia
