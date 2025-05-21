const express = require('express');
const dns = require('dns');
const urlParser = require('url');
const router = express.Router();
const Url = require('../models/url');

// Auto-incrementing counter (in-memory, for simplicity)
let counter = 1;

// POST - Create short URL
router.post('/', async (req, res) => {
  const inputUrl = req.body.url;

  // Validate URL format (must include http or https)
  try {
    const parsedUrl = new URL(inputUrl);
    const hostname = parsedUrl.hostname;

    // DNS lookup
    dns.lookup(hostname, async (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // Check if URL already exists
      let found = await Url.findOne({ original_url: inputUrl });
      if (found) {
        return res.json({
          original_url: found.original_url,
          short_url: found.short_url,
        });
      }

      // Create new short URL entry
      const newUrl = new Url({
        original_url: inputUrl,
        short_url: counter++,
      });

      await newUrl.save();

      res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url,
      });
    });
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }
});

// GET - Redirect to original URL
router.get('/:short', async (req, res) => {
  const short = Number(req.params.short);

  if (isNaN(short)) {
    return res.status(400).json({ error: 'Invalid short URL' });
  }

  const found = await Url.findOne({ short_url: short });
  if (found) {
    return res.redirect(found.original_url);
  } else {
    return res.status(404).json({ error: 'No short URL found for the given input' });
  }
});

module.exports = router;
