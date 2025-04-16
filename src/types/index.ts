export interface User {
  walletAddress: string;
}

export interface Fund {
  _id: string;
  userId: User;
  name: string;
  image?: string;
  fundWalletAddress: string;
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
  pumpPortalTransferCompleted?: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  launchError?: string;
  tokenCa?: string;
  solscanUrl?: string;
  currentBalance?: number | null;
}