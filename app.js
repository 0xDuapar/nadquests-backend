import express from 'express';
import cors from 'cors';
import { connectDb, closeDb } from './db.js';
import userRoutes from './routes/users.js';

const app = express();
const port = 3000;

app.use(express.json());

// Configuration de CORS pour autoriser toutes les origines
app.use(cors()); // Autorise toutes les requêtes de n'importe quelle origine

// Utilisation des routes définies dans routes/users.js
app.use('/api', userRoutes);

app.use('/crypto', cryptoRoutes);

// Connexion à la base de données et démarrage du serveur
connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Erreur lors de l\'initialisation de la base de données:', err);
  });

// Déconnexion de la base de données lorsque l'application se ferme
process.on('SIGINT', async () => {
  await closeDb();
  process.exit();
});


