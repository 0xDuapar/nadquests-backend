import 'dotenv-flow/config';
import express from 'express';
import passport from 'passport';
import { Strategy } from '@superfaceai/passport-twitter-oauth2';
import session from 'express-session';
import axios from 'axios';
import cors from 'cors';
import envVars from './config/validateEnv.js';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

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
      return done(null, profile);
    }
  )
);

const app = express();

app.use(cors({
  origin: envVars.ORIGIN,
  credentials: true,
}));
app.use(
  session({
    secret:envVars.SESSION_SECRET,
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

app.get('/auth/twitter', (req, res, next) => {
  const redirectUrl = req.query.redirectUrl || envVars.ORIGIN;
  req.session.redirectUrl = redirectUrl;
  req.session.save();

  passport.authenticate('twitter', {
    scope: ['tweet.read', 'users.read', 'offline.access'],
    keepSessionInfo: true
  })(req, res, next);
});

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login-failure', keepSessionInfo: true }),
  (req, res) => {
    // Retrieve redirectUrl from session or use default
    const redirectUrl = req.session.redirectUrl || process.env.ORIGIN;
    
    // Clear OAuth-related session variables
    delete req.session.oauthState;
    delete req.session.redirectUrl;

    // Redirect the user to the desired URL
    res.redirect(redirectUrl);
  }
);

// Endpoint to Get Current User
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// Endpoint to Check if User Follows a Specific Account
app.get('/api/check-follow', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { targetUsername } = req.query;

  if (!targetUsername) {
    return res.status(400).json({ error: 'targetUsername is required' });
  }

  try {
    // Get target user's ID
    const userResponse = await axios.get(`https://api.twitter.com/2/users/by/username/${targetUsername}`, {
      headers: {
        'Authorization': `Bearer ${envVars.TWITTER_BEARER_TOKEN}`, // Ensure this is set in production
      },
    });

    const targetUserId = userResponse.data.data.id;

    // Check if the authenticated user follows the target user
    await axios.get(`https://api.twitter.com/2/users/${req.user.id}/following/${targetUserId}`, {
      headers: {
        'Authorization': `Bearer ${envVars.TWITTER_BEARER_TOKEN}`, // Ensure this is set in production
      },
    });

    // If no error, the user follows the target
    res.json({ follows: true });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // User does not follow the target
      res.json({ follows: false });
    } else {
      console.error('Error checking follow status:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to check follow status' });
    }
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(envVars.ORIGIN); // Frontend URL
  });
});

app.get('/login-failure', (req, res) => {
  res.send('Login failed');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(500).send('Something went wrong: \n' + err.stack);
});

// Start the Server
const PORT = envVars.AUTH_PORT || 4000;
console.log('PORT:', envVars.AUTH_PORT);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
