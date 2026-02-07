const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.FATSECRET_CLIENT_ID;
const CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET;

let accessToken = null;
let tokenExpiresAt = 0;

// Get OAuth2 token
async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const response = await axios.post(
    'https://oauth.fatsecret.com/connect/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'basic'
    }),
    {
      auth: {
        username: CLIENT_ID,
        password: CLIENT_SECRET
      }
    }
  );

  accessToken = response.data.access_token;
  tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

  return accessToken;
}

// Health check
app.get('/', (req, res) => {
  res.send('FatSecret proxy running');
});

// Search endpoint
app.post('/search', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    const token = await getAccessToken();

    const response = await axios.get(
      'https://platform.fatsecret.com/rest/foods/search/v3',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          search_expression: query,
          max_results: 20
        }
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'FatSecret request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
