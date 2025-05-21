const express = require('express');
const dns = require('dns');
const router = express.Router();
const Url = require('../models/url');

let counter = 1;

router.post('/', async (req, res) => {
  const inputUrl = req.body.url;

  // Remove protocol for dns lookup
  const hostname = inputUrl.replace(/^https?:\/\//, '').split('/')[0];

  dns.lookup(hostname, async (err) => {
    if (err) return res.json({ error: 'invalid url' });

    const found = await Url.findOne({ original_url: inputUrl });
    if (found) return res.json(found);

    const newUrl = new Url({
      original_url: inputUrl,
      short_url: counter++
    });

    await newUrl.save();
    res.json({ original_url: newUrl.original_url, short_url: newUrl.short_url });
  });
});

router.get('/:short', async (req, res) => {
  const short = parseInt(req.params.short);
  const found = await Url.findOne({ short_url: short });

  if (found) {
    res.redirect(found.original_url);
  } else {
    res.status(404).json({ error: 'No short URL found for the given input' });
  }
});

module.exports = router;
