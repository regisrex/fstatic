const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const morgan = require("morgan")
const cors = require("cors")
const app = express();
const PORT = 5104;
app.use(morgan('dev'))
app.use(cors({
  origin: "*"
}))

app.use(express.urlencoded({ extended: true , limit  : '50mb' }));
app.use(express.json({ limit :  '50mb' ));


const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const generateUUID = () => crypto.randomUUID().replace(/-/g, '');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public');
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${generateUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({ storage });

app.post('/files/upload', upload.single('file'), (req, res) => {
  try {


    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/public/${req.file.filename}`;
    res.status(200).json({ status: 200, message: 'File uploaded successfully', data: fileUrl });
  } catch (error) {
    return res.status(401).json({ status: 200, message: error.message, data: null });
  }
});

app.delete('/files/delete', (req, res) => {
  try {


    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'No URL provided' });
    }

    const fileName = url.split('/').pop();
    console.log(fileName)
    const filePath = path.join(__dirname, 'public', fileName);

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ message: 'File not found' });
      }

      fs.unlink(filePath, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error deleting the file' });
        }
        res.status(200).json({ status: 200, message: 'File deleted successfully', data: null });
      });
    });
  } catch (error) {
    return res.status(401).json({ status: 401, message: error.message, data: null });
  }
});

app.use('/public', express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
