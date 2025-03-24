require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const File = require('./models/file.model');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
console.log('MongoDB URI:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => console.error('MongoDB connection error:', error));
db.once('open', () => console.log('Connected to MongoDB'));

// Multer configuration for file uploading
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files (your HTML page and assets like CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Root route - Adding this line
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'public','index.html'));
});

// Route for uploading a PDF file
app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const { originalname, buffer, mimetype } = req.file;

    const file = new File({
      name: originalname,
      data: buffer,
      contentType: mimetype,
    });

    await file.save();
    res.status(201).send('File uploaded successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading the file.');
  }
});

// Route to display a list of uploaded files
app.get('/files', async (req, res) => {
  try {
    const files = await File.find();
    res.json(files); // Changed to JSON response to match your frontend
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving files from the database.');
  }
});

// Route to display an individual file based on its ID
app.get('/files/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).send('File not found');
    }

    if (req.query.download) {
      res.setHeader('Content-Disposition', `attachment; filename=${file.name}`);
    }

    // Send the file data as a response
    res.contentType(file.contentType);
    res.send(file.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving the file from the database.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
