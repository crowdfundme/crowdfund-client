import { Connection} from "@solana/web3.js";
import { getSolanaRpcUrl } from '../utils/getSolanaRpcUrl';

/**
 * Get a Solana connection using the secure runtime RPC URL.
 */
export const getConnection = async (): Promise<Connection> => {
  const rpcUrl = await getSolanaRpcUrl();
  return new Connection(rpcUrl, "confirmed");
};