const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(fileUpload());

app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "file") is used to retrieve the uploaded file
  let uploadedFile = req.files.file;

  // Use the mv() method to place the file somewhere on your server
  uploadedFile.mv(path.join(__dirname, 'music', uploadedFile.name), (err) => {
    if (err) return res.status(500).send(err);

    res.send('File uploaded!');
  });
});

app.get('/music', (req, res) => {
    const musicDir = path.join(__dirname, 'music');
    fs.readdir(musicDir, (err, files) => {
      if (err) {
        return res.status(500).send('Unable to scan directory: ' + err);
      }
      res.send(files);
    });
});

app.listen(3001, () => {
  console.log('Server started on http://localhost:3001');
});
