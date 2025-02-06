import 'dotenv-flow/config';
import express from 'express';
import passport from 'passport';
import { Strategy } from '@superfaceai/passport-twitter-oauth2';
import session from 'express-session';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import envVars from './config/validateEnv.js';

// Serialisation et désérialisation de l'utilisateur
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Configuration de Passport avec Twitter OAuth2
passport.use(
  new Strategy(
    {
      clientID: envVars.TWITTER_CLIENT_ID,
      clientSecret: envVars.TWITTER_CLIENT_SECRET,
      clientType: 'confidential',
      callbackURL: envVars.CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      console.log('Success!', { accessToken, refreshToken });
      console.log('profile:', profile);

      const accountData = {
        accessToken,
        refreshToken,
        username: profile.username,
        id: profile.id,
        profile_image_url: profile._json.profile_image_url,
        walletAddress: null, // Ajout du wallet par défaut
      };

      // Lire et mettre à jour account.json
      fs.readFile('account.json', 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Erreur lecture:', err);
          return done(err);
        }

        let accounts = data ? JSON.parse(data) : [];

        // Vérifier si l'utilisateur existe déjà
        const userIndex = accounts.findIndex(account => account.id === profile.id);
        if (userIndex !== -1) {
          accounts[userIndex] = { ...accounts[userIndex], ...accountData };
        } else {
          accounts.push(accountData);
        }

        fs.writeFile('account.json', JSON.stringify(accounts, null, 2), (err) => {
          if (err) {
            console.error("Erreur écriture:", err);
            return done(err);
          }
          console.log('Utilisateur enregistré dans account.json');
        });
      });

      return done(null, profile);
    }
  )
);

// Initialisation d'Express
const app = express();
app.use(express.json());

// Configuration CORS
app.use(cors({
  origin: envVars.ORIGIN,
  credentials: true,
}));

// Configuration de la session
app.use(
  session({
    secret: envVars.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Route d'authentification Twitter
app.get('/auth/twitter', (req, res, next) => {
  const redirectUrl = req.query.redirectUrl || envVars.ORIGIN;
  req.session.redirectUrl = redirectUrl;
  req.session.save();

  passport.authenticate('twitter', {
    scope: ['tweet.read', 'users.read', 'offline.access'],
    keepSessionInfo: true,
  })(req, res, next);
});

// Route de callback après authentification
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login-failure', keepSessionInfo: true }),
  (req, res) => {
    const redirectUrl = req.session.redirectUrl || envVars.ORIGIN;
    delete req.session.oauthState;
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
  }
);

// Endpoint pour récupérer l'utilisateur actuel
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// Endpoint pour enregistrer le walletAddress
app.post('/api/save-wallet', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { walletAddress } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress is required' });
  }

  fs.readFile('account.json', 'utf8', (err, data) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Erreur lecture:', err);
      return res.status(500).json({ error: 'Erreur interne' });
    }

    let accounts = data ? JSON.parse(data) : [];

    // Trouver l'utilisateur existant et mettre à jour son walletAddress
    const userIndex = accounts.findIndex(account => account.id === req.user.id);
    if (userIndex !== -1) {
      accounts[userIndex].walletAddress = walletAddress;
    } else {
      accounts.push({
        id: req.user.id,
        username: req.user.username,
        profile_image_url: req.user._json.profile_image_url,
        walletAddress,
      });
    }

    fs.writeFile('account.json', JSON.stringify(accounts, null, 2), (err) => {
      if (err) {
        console.error("Erreur écriture:", err);
        return res.status(500).json({ error: "Erreur d'écriture" });
      }
      res.json({ message: 'walletAddress enregistré avec succès' });
    });
  });
});

// Endpoint pour vérifier si l'utilisateur suit un compte
app.get('/api/check-follow', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { targetUsername } = req.query;
  if (!targetUsername) {
    return res.status(400).json({ error: 'targetUsername is required' });
  }

  try {
    const userResponse = await axios.get(`https://api.twitter.com/2/users/by/username/${targetUsername}`, {
      headers: { 'Authorization': `Bearer ${envVars.TWITTER_BEARER_TOKEN}` },
    });

    const targetUserId = userResponse.data.data.id;
    await axios.get(`https://api.twitter.com/2/users/${req.user.id}/following/${targetUserId}`, {
      headers: { 'Authorization': `Bearer ${envVars.TWITTER_BEARER_TOKEN}` },
    });

    res.json({ follows: true });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      res.json({ follows: false });
    } else {
      console.error('Erreur vérification follow:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Erreur de vérification' });
    }
  }
});

// Route de déconnexion
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(envVars.ORIGIN);
  });
});

// Page d'échec de connexion
app.get('/login-failure', (req, res) => {
  res.send('Login failed');
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err.stack);
  res.status(500).send('Une erreur est survenue : \n' + err.stack);
});

// Lancer le serveur
const PORT = envVars.AUTH_PORT || 4000;
console.log('PORT:', envVars.AUTH_PORT);
app.listen(PORT, () => {
  console.log(`Le serveur tourne sur le port ${PORT}`);
});
