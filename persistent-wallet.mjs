import{ createSolanaRpc, devnet, 
    generateKeyPair,
    createKeyPairSignerFromBytes,
    createSignerFromKeyPair,
} from "@solana/kit";
import { readFile, writeFile } from "node:fs/promises";

const WALLET_FILE = "wallet.json";
const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

async function loadOrCreateWallet() {
    try {
        // Try to load an existing wallet
        const data = JSON.parse(await readFile(WALLET_FILE, "utf-8"));
        const secretBytes = new Uint8Array(data.secretKey);
        const wallet = await createKeyPairSignerFromBytes(secretBytes);
        console.log("Loaded existing wallet:", wallet.address);
        return wallet;
    } catch (error) {
        // No wallet file found, create a new one
        // Pass `true` so the keys are extractable for persistence
        const keyPair = await generateKeyPair(true);

        // Export the public key (raw format works for public keys)
        const publicKeyBytes = new Uint8Array(
            await crypto.subtle.exportKey("raw", keyPair.publicKey)
        );

        // Export the private key using pkcs8 format, which is extractable and can be stored securely
        const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        const privateKeyBytes = new Uint8Array(pkcs8).slice(-32); // Extract the last 32 bytes for the secret key

        // Solana keypair format: 64 bytes (32 bytes secret key + 32 bytes public key)
        const keypairBytes = new Uint8Array(64);
        keypairBytes.set(privateKeyBytes, 0); // Set the secret key in the first 32 bytes
        keypairBytes.set(publicKeyBytes, 32); // Set the public key in the next 32 bytes

        await writeFile(
            WALLET_FILE,
            JSON.stringify({ secretKey: Array.from(keypairBytes) }),
        )

        const wallet = await createSignerFromKeyPair(keyPair);
        console.log("Created new wallet:", wallet.address);
        console.log(`Wallet saved to ${WALLET_FILE}`);
        return wallet;

    }
}



const wallet = await loadOrCreateWallet();

// Check the balance of the wallet
const { value: balance } = await rpc.getBalance(wallet.address).send();
const balanceInSol = Number(balance) / 1_000_000_000;


console.log(`\nAddress: ${wallet.address}`);
console.log(`Balance: ${balanceInSol} SOL`);

if (balanceInSol === 0) {
    console.log(`\nYour wallet is empty. You can request some SOL from the Solana Devnet Faucet: https://solfaucet.com/`);

    console.log(wallet.address);
}