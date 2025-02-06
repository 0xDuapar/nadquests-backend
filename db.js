import dotenv from 'dotenv';  // Remplacer require par import
import mysql from 'mysql2/promise';  // Utiliser mysql2 avec promesses

// Charge les variables d'environnement
dotenv.config({ path: '.env.development' });

let dbConnection = null;  // Déclare la variable de connexion en tant que 'null' par défaut

// Fonction pour établir la connexion à la base de données
export const connectDb = async () => {
  if (dbConnection) return dbConnection;  // Retourne la connexion existante si elle est déjà établie

  try {
    // Création de la connexion à la base de données
    dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('Connected to MySQL database');
    return dbConnection;  // Retourne la connexion établie
  } catch (err) {
    console.error('Error connecting to the database:', err);
    throw err;  // Relance l'erreur pour qu'elle soit capturée par app.js
  }
};

// Fonction pour fermer la connexion à la base de données
export const closeDb = async () => {
  try {
    if (dbConnection) {
      await dbConnection.end();  // Ferme la connexion proprement
      dbConnection = null;  // Réinitialise la connexion
      console.log('Database connection closed');
    }
  } catch (err) {
    console.error('Error closing the database connection:', err);
    throw err;  // Relance l'erreur en cas de problème de fermeture
  }
};
