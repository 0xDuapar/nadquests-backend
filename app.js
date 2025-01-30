// app.js
import express from 'express';
import { connectDb, closeDb } from './db.js';
import userRoutes from './routes/users.js';

const app = express();
const port = 3000;

// Middleware pour analyser les données JSON
app.use(express.json());

// Utilisation des routes définies dans routes/users.js
app.use('/api', userRoutes);

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
