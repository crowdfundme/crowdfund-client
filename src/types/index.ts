export interface Fund {
  _id: string;
  userId: string;
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
  initialFeePaid: number; // Add this field
  targetWallet: string;
  tokenTwitter?: string;
  tokenTelegram?: string;
  tokenWebsite?: string;
  status: "active" | "completed";
  launchFee: number;
  tokenAddress?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}