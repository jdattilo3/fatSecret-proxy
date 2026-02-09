const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

// Railway injects PORT automatically (usually 8080)
const PORT = process.env.PORT || 3000;

// ---- DEBUG: verify env vars at startup ----
console.log('PORT environment variable:', PORT);
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
  res.send('FatSecret proxy is running');
});

// ---- Search endpoint ----
app.post('/search', async (req, res) => {
  const query = req.body.query;
  console.log('Incoming search request:', query);

  if (!query) {
    return res.status(400).json({
      error: "Missing 'query' in request body"
    });
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing FatSecret credentials');
    return res.status(500).json({
      error: 'FatSecret credentials not set'
    });
  }

  try {
    console.log('Sending request to FatSecret…');

    const response = await axios.get(
      'https://platform.fatsecret.com/rest/server.api',
      {
        params: {
          method: 'foods.search',
          search_expression: query,
          format: 'json',
          oauth_consumer_key: clientId,
          oauth_consumer_secret: clientSecret
        },
        timeout: 10000
      }
    );

    console.log('FatSecret response received');
    res.json(response.data);

  } catch (err) {
    console.error('Error contacting FatSecret:', err.message);

    if (err.response) {
      console.error('FatSecret status:', err.response.status);
      console.error('FatSecret data:', err.response.data);
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
