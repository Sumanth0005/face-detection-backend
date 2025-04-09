// const express = require('express');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const fs = require('fs');

// const app = express();
// const PORT = 3000;

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/imageupload')
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Create Mongoose Schema
// const imageSchema = new mongoose.Schema({
//   name: String,
//   img: {
//     data: Buffer,
//     contentType: String
//   }
// });
// const ImageModel = mongoose.model('Image', imageSchema);

// // Configure Multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/'),
//   filename: (req, file, cb) => cb(null, file.originalname)
// });
// const upload = multer({ storage });

// // Upload Endpoint
// app.post('/upload', upload.single('image'), async (req, res) => {
//   const img = fs.readFileSync(req.file.path);
//   const encode_image = img.toString('base64');

//   const finalImg = new ImageModel({
//     name: req.file.originalname,
//     img: {
//       data: Buffer.from(encode_image, 'base64'),
//       contentType: req.file.mimetype
//     }
//   });

//   await finalImg.save();
//   res.send('Image uploaded successfully');
// });

// // Fetch Images
// app.get('/images', async (req, res) => {
//   const images = await ImageModel.find({});
//   res.json(images);
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors()); // Allow requests from frontend

// 🗂️ Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 🔌 Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/imageupload')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 📦 Mongoose Schema
const imageSchema = new mongoose.Schema({
  name: String,
  img: {
    data: Buffer,
    contentType: String
  }
});
const ImageModel = mongoose.model('Image', imageSchema);

// 📸 Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 🛠️ Upload Route
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('❌ No file uploaded');
    }

    const imgBuffer = fs.readFileSync(req.file.path);

    const newImage = new ImageModel({
      name: req.file.originalname,
      img: {
        data: imgBuffer,
        contentType: req.file.mimetype
      }
    });

    await newImage.save();

    fs.unlinkSync(req.file.path); // remove local file

    res.status(200).json({
      message: '✅ Image uploaded and saved to MongoDB',
      imageId: newImage._id
    });
  } catch (error) {
    console.error('❌ Upload Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 🔍 Get Image Metadata
app.get('/images', async (req, res) => {
  try {
    const images = await ImageModel.find({}, { img: 0 });
    res.json(images);
  } catch (error) {
    res.status(500).send('❌ Error fetching images');
  }
});

// 🖼️ Get Image By ID
app.get('/image/:id', async (req, res) => {
  try {
    const image = await ImageModel.findById(req.params.id);
    if (!image) return res.status(404).send('❌ Image not found');

    res.contentType(image.img.contentType);
    res.send(image.img.data);
  } catch (error) {
    res.status(500).send('❌ Error retrieving image');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
