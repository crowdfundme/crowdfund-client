export interface Fund {
  _id: string;
  userId: string;
  name: string;
  image: string;
  fundWalletAddress: string;
  tokenName: string;
  tokenSymbol: string;
  targetPercentage: number;
  targetSolAmount: number;
  currentDonatedSol: number;
  targetWallet: string;
  status: "active" | "completed";
}