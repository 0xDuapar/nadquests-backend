// routes/users.js
import express from 'express';
import { client } from '../db.js';

const router = express.Router();


// Route pour récupérer tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});



export default router;
