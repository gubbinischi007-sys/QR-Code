const express = require('express');
const multer = require('multer');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary (it will use environment variables if available)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Ensure local uploads directory exists (fallback for local dev)
const uploadDir = path.join(__dirname, 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
} catch (err) {
    // Silent fail for read-only filesystems (Vercel)
}

// Multer Config: Use memory storage for Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'snapqr' },
            (error, result) => {
                if (result) resolve(result.secure_url);
                else reject(error || new Error('Cloudinary upload failed'));
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// Routes
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image' });
        }

        let imageUrl;

        // Check if Cloudinary is configured
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
            // Upload to Cloudinary for permanent storage (Vercel)
            imageUrl = await uploadToCloudinary(req.file.buffer);
        } else {
            // Fallback: Save locally if Cloudinary is not configured (Local Dev)
            const uniqueName = `${uuidv4()}${path.extname(req.file.originalname)}`;
            const localPath = path.join(uploadDir, uniqueName);
            fs.writeFileSync(localPath, req.file.buffer);

            const protocol = req.protocol;
            const host = req.get('host');
            imageUrl = `${protocol}://${host}/uploads/${uniqueName}`;
        }

        console.log(`Generating QR for: ${imageUrl}`);

        // Generate QR code
        const qrCodeDataUrl = await qrcode.toDataURL(imageUrl, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            scale: 10,
            color: { dark: '#0f172aff', light: '#ffffffff' }
        });

        res.json({ imageUrl, qrCode: qrCodeDataUrl });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// Serve index.html for the root route if not caught by static
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only start the server if running locally
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
