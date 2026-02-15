const express = require('express');
const multer = require('multer');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (JPG, PNG) are allowed!'));
    }
});

// Routes
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image' });
        }

        // Generate public URL for the image
        // If testing on a phone, make sure you access the site via your IP address
        // or a public tunnel like ngrok.
        const protocol = req.protocol;
        const host = req.get('host');
        const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        console.log(`Generating QR for: ${imageUrl}`);

        // Generate QR code with high-quality settings
        const qrCodeDataUrl = await qrcode.toDataURL(imageUrl, {
            errorCorrectionLevel: 'H', // High error correction
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            scale: 10, // Larger scale for crispness
            color: {
                dark: '#0f172aff', // Deep dark blue (from our theme)
                light: '#ffffffff' // Pure white background
            }
        });

        res.json({
            imageUrl: imageUrl,
            qrCode: qrCodeDataUrl
        });
    } catch (err) {
        console.error('Generation Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
