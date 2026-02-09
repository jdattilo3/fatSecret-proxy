const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

// Railway injects PORT automatically (usually 8080)
const PORT = process.env.PORT || 3000;

// --- Startup logging ---
console.log("Starting FatSecret Proxy...");
console.log("PORT environment variable:", process.env.PORT);
console.log("FatSecret Key set:", !!process.env.FATSECRET_KEY);
console.log("FatSecret Secret set:", !!process.env.FATSECRET_SECRET);

// --- Health check ---
app.get('/', (req, res) => {
  res.send('Proxy is running!');
});

// --- Search endpoint ---
app.post('/search', async (req, res) => {
  const query = req.body.query;

  console.log("Incoming search request:", query);

  if (!query) {
    return res.status(400).json({ error: "Missing 'query' in request body" });
  }

  const key = process.env.FATSECRET_KEY;
  const secret = process.env.FATSECRET_SECRET;

  if (!key || !secret) {
    console.error("❌ Missing FatSecret credentials");
    return res.status(500).json({ error: "FatSecret credentials not set" });
  }

  try {
    console.log("➡️ Sending request to FatSecret...");
    console.log("Query:", query);

    const response = await axios.get(
      'https://platform.fatsecret.com/rest/server.api',
      {
        params: {
          method: 'foods.search',
          search_expression: query,
          format: 'json',
          oauth_consumer_key: key,
          oauth_consumer_secret: secret
        },
        timeout: 10000
      }
    );

    console.log("✅ FatSecret response received");
    res.json(response.data);

  } catch (err) {
    console.error("====== FATSECRET ERROR ======");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Headers:", err.response.headers);
      console.error("Raw response:", err.response.data);

      // Send the raw FatSecret response back (XML or JSON)
      res.status(500).send(err.response.data);
    } else {
      console.error("Message:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});
