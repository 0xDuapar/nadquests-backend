import express from 'express';
import { ethers } from "ethers";  // Import correctly
import generateSignature from '../utils/crypto.js';

const router = express.Router();

router.get('/getClaimSignature/:walletAdrs/:tokenType', async (req, res) => {
  try {
    const { walletAdrs, tokenType } = req.params;
    const walletAdrsFormated = ethers.getAddress(walletAdrs);

    if (!walletAdrsFormated || !tokenType) {
      return res.status(400).json({ error: 'Les paramètres walletAdrsFormated et tokenType sont requis' });
    }

    const { key, signature } = await generateSignature(walletAdrsFormated, tokenType);

    res.json({ key, signature });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la génération de la signature' });
  }
});

export default router;
