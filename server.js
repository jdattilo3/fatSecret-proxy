const express = require('express');
const axios = require('axios');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const FATSECRET_BASE_URL =
  'https://platform.fatsecret.com/rest/server.api';

// ---- OAuth setup ----
const oauth = OAuth({
  consumer: {
    key: process.env.FATSECRET_CLIENT_ID,
    secret: process.env.FATSECRET_CLIENT_SECRET
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto
      .createHmac('sha1', key)
      .update(baseString)
      .digest('base64');
  }
});

// ---- Startup logs ----
console.log('PORT:', PORT);
console.log(
  'FatSecret Client ID set:',
  !!process.env.FATSECRET_CLIENT_ID
);
console.log(
  'FatSecret Client Secret set:',
  !!process.env.FATSECRET_CLIENT_SECRET
);

// ---- Health check ----
app.get('/', (req, res) => {
  res.send('FatSecret proxy running');
});

// ---- Search endpoint ----
app.post('/search', async (req, res) => {
  const query = req.body.query;

  if (!query) {
    return res.status(400).json({
      error: "Missing 'query' in request body"
    });
  }

  try {
    const requestData = {
      url: FATSECRET_BASE_URL,
      method: 'GET',
      data: {
        method: 'foods.search',
        search_expression: query,
        format: 'json'
      }
    };

    const authHeader = oauth.toHeader(
      oauth.authorize(requestData)
    );

    const response = await axios.get(FATSECRET_BASE_URL, {
      params: requestData.data,
      headers: {
        Authorization: authHeader.Authorization
      },
      timeout: 10000
    });

    res.json(response.data);

  } catch (err) {
    console.error('FatSecret error:', err.message);

    if (err.response) {
      console.error(err.response.data);
      return res.status(500).json({
        error: 'FatSecret request failed',
        details: err.response.data
      });
    }

    res.status(500).json({ error: err.message });
  }
});

// ---- Start server ----
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
