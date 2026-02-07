console.log("PORT environment variable:", process.env.PORT);

const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check route
app.get('/', (req, res) => res.send('Proxy is running!'));

// Search endpoint
app.post('/search', async (req, res) => {
  const query = req.body.query;
  console.log("Incoming search request:", query);

  if (!query) {
    return res.status(400).json({ error: "Missing 'query' in request body" });
  }

  const key = process.env.FATSECRET_CLIENT_ID;
  const secret = process.env.FATSECRET_CLIENT_SECRET;


  if (!key || !secret) {
    console.error("Missing FatSecret credentials in environment variables");
    return res.status(500).json({ error: "FatSecret credentials not set" });
  }

  try {
    // Log parameters
    console.log("FatSecret request params:", {
      method: 'foods.search',
      search_expression: query,
      format: 'json',
      oauth_consumer_key: key,
      oauth_consumer_secret: secret
    });

    // Make the FatSecret API request
    const response = await axios.get('https://platform.fatsecret.com/rest/server.api', {
      params: {
        method: 'foods.search',
        search_expression: query,
        format: 'json',
        oauth_consumer_key: key,
        oauth_consumer_secret: secret
      },
      timeout: 10000 // 10 seconds
    });

    console.log("FatSecret response received");
    res.json(response.data);

  } catch (err) {
    console.error("Error contacting FatSecret:", err.message);
    if (err.response) {
      console.error("FatSecret status:", err.response.status);
      console.error("FatSecret data:", err.response.data);
    }
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
