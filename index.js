require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(cors());

const validURLRegex = /https?:\/\/(www)?.+[a-z0-9]+\.[a-z0-9]+/
const URLisValid = (url) => {
  console.log('url to validate:', url);
  const isValid = validURLRegex.test(url);
  console.log('isValid:', isValid);
  return isValid;
}

// Basic Configuration
const port = process.env.PORT || 3000;

// Connect to Atlas hosted cluster
const { DB_URL } = process.env;
const { Schema } = mongoose;

// Connect to DB
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Create Schema
const urlSchema = new Schema({
  original_url: { type: String },
  short_url: { type: Number }
});

// Create Model
let Url = mongoose.model('Url', urlSchema);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  console.log('req.body:', req.body);
  const { url: original_url } = req.body;
  if (!URLisValid(original_url)) {
    res.json({ 'error': 'invalid url' });
    return;
  }
  // auto increment id value will come from amount of docs
  const short_url = await Url.countDocuments() + 1;
  await Url.create({ original_url, short_url });
  const responseJson = { original_url, short_url };
  console.log('responseJson:', responseJson);
  res.json(responseJson);
  return;
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  console.log('req.params:', req.params);
  const { short_url } = req.params;
  const { original_url } = await Url.findOne({ short_url });
  res.redirect(original_url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});