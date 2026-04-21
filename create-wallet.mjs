import { generateKeyPairSigner, createSolanaRpc, devnet } from "@solana/kit"

const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));
// Generate a brand new keypair
const wallet = await generateKeyPairSigner();

console.log("Wallet address:", wallet.address);

// Check the balance of the new wallet
const {value: balance} = await rpc.getBalance(wallet.address).send();
const balanceInSol = Number(balance) / 1_000_000_000;

console.log("Wallet balance:", balanceInSol, "SOL");