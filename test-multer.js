const express = require('express');
const multer = require('multer');
const request = require('supertest');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.put('/test', upload.single('image'), (req, res) => {
  res.json({ body: req.body, file: req.file });
});

request(app)
  .put('/test')
  .field('name', 'Nasi Goreng Modern')
  .end((err, res) => {
    console.log(res.body);
  });
