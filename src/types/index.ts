// types/index.ts (or wherever your Fund type is defined)
export interface User {
  walletAddress: string;
}

export interface Fund {
  _id: string;
  userId: User; // Changed from string to User object
  name: string;
  image: string;
  fundWalletAddress: string;
  fundPrivateKey: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDescription: string;
  targetPercentage: number;
  targetSolAmount: number;
  currentDonatedSol: number;
  initialFeePaid: number;
  targetWallet: string;
  tokenTwitter?: string;
  tokenTelegram?: string;
  tokenWebsite?: string;
  status: "active" | "completed";
  launchFee: number;
  tokenAddress?: string;
  pumpPortalApiKey?: string;
  pumpPortalWalletPublicKey?: string;
  pumpPortalPrivateKey?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  launchError?: string;
}