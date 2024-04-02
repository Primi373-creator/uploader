// server.js

const express = require('express');
const multer  = require('multer');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/image-uploads', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define Image Schema
const imageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String,
});

const Image = mongoose.model('Image', imageSchema);

// Set up Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({ storage: storage });

// Express endpoint to handle file uploads
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }

  try {
    // Save the file data to MongoDB
    const newImage = new Image({
      data: req.file.buffer,
      contentType: req.file.mimetype,
    });
    const savedImage = await newImage.save();

    // Return the ID and URL to access the uploaded image
    const imageUrl = req.protocol + '://' + req.get('host') + '/image/' + savedImage._id;
    res.send(imageUrl);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading image.');
  }
});

// Express endpoint to fetch uploaded images
app.get('/image/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).send('Image not found.');
    }
    res.set('Content-Type', image.contentType);
    res.send(image.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching image.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
