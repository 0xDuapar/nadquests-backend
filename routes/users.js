import express from 'express';
import { connectDb } from '../db.js';  // Import de la fonction connectDb

const router = express.Router();

// GET: Get user ID based on wallet address
router.get('/users/:wallet', async (req, res) => {
  let connection;

  try {
    const { wallet } = req.params;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address est requis' });
    }

    // Connexion à la base de données
    connection = await connectDb(); // On établit la connexion ici

    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE wallet_id = ?',
      [wallet]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ id: rows[0].id });  // Retourne seulement l'ID, plutôt que l'objet complet
    
  } catch (err) {
    console.error('Error in database query:', err);
    res.status(500).json({ error: 'Erreur lors de la recherche de l\'utilisateur' });
  } finally {
    // Si une connexion a été établie, on la ferme
    if (connection) {
      await connection.end();
    }
  }
});

export default router;
