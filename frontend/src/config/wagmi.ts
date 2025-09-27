import { createConfig, http } from 'wagmi';
import { injected, metaMask } from 'wagmi/connectors';
import { LISK_SEPOLIA } from './contracts';

export const config = createConfig({
  chains: [LISK_SEPOLIA],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [LISK_SEPOLIA.id]: http(),
  },
});

// Custom chain configuration for Lisk Sepolia
export const liskSepolia = {
  id: 4202,
  name: 'Lisk Sepolia',
  network: 'lisk-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia-api.lisk.com'],
    },
    public: {
      http: ['https://rpc.sepolia-api.lisk.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Lisk Sepolia Explorer',
      url: 'https://sepolia-blockscout.lisk.com',
    },
  },
  testnet: true,
};
