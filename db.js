// db.js
import pkg from 'pg';
import dotenv from 'dotenv';

// Charger les variables d'environnement du fichier .env
dotenv.config();

const { Client } = pkg;

// Configuration de la connexion à PostgreSQL avec les variables d'environnement
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function connectDb() {
  try {
    await client.connect();
    console.log('Connexion réussie à PostgreSQL !');
  } catch (err) {
    console.error('Erreur de connexion à PostgreSQL:', err);
    throw err;
  }
}

async function closeDb() {
  await client.end();
  console.log('Connexion fermée.');
}

export { connectDb, closeDb, client };
