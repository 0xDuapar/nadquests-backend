import express from 'express';
import { client } from '../db.js';

const router = express.Router();

// GET permet d'avoir l'id grace au wallet ;)
router.get('/users/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address est requis' });
    }

    const result = await client.query(
      'SELECT id FROM users WHERE wallet = $1',
      [wallet]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la recherche de l\'utilisateur' });
  }
});

// POST pour ajouter un wallet à la table users
router.post('/users', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    // Validation de l'adresse wallet
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address est requis' });
    }

    // Vérifier si le wallet existe déjà
    const existingUser = await client.query(
      'SELECT id FROM users WHERE wallet = $1',
      [walletAddress]
    );

    if (existingUser.rows.length > 0) {
      return res.status(200).json({ message: 'Compte déjà enregistré' });
    }

    // Insérer le nouveau wallet
    const result = await client.query(
      'INSERT INTO users (wallet) VALUES ($1) RETURNING *',
      [walletAddress]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
  }
});

export default router;
