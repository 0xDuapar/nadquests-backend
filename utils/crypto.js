import { ethers } from "ethers";  // Import correctly
import dotenv from "dotenv";

dotenv.config();

async function generateSignature(user, tokenType) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is missing in environment variables.");
  }

  const wallet = new ethers.Wallet(privateKey);

  const key = ethers.hexlify(ethers.randomBytes(32)); // FIX: Use ethers.randomBytes correctly

  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "bytes32"],
    [user, tokenType, key]
  );

  const signature = await wallet.signMessage(ethers.getBytes(messageHash)); // FIX: Correct getBytes method

  console.log("User (minter) address   :", user);
  console.log("Token Type             :", tokenType);
  console.log("Generated key (bytes32):", key);
  console.log("Signature              :", signature);

  return { key, signature };
}

export default generateSignature;
