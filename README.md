# 📸 SnapQR - Premium Image-to-QR Generator

SnapQR is a high-fidelity, dynamic web application that allows users to capture or upload images and instantly generate unique, customizable QR codes. When scanned, these QR codes open the uploaded image directly via a secure local server.

![UI Preview](https://via.placeholder.com/800x450?text=SnapQR+Premium+UI)

## ✨ Key Features
- **Modern UI/UX**: Sleek dark-themed interface with glassmorphism and electric blue accents.
- **Dynamic Animations**: Smooth entry spring animations, floating background blobs, and button shine effects.
- **Camera Integration**: Capture photos directly from your browser using your webcam.
- **Real-time Customization**: Change the QR code color instantly with a live preview.
- **Social Sharing**: One-click sharing to WhatsApp and clipboard link copying.
- **Smart History**: Keeps track of your recent uploads locally.
- **Permanent Storage**: Images are stored securely on your server.

## 🚀 Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (Modern Flexbox/Grid), JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Libraries**: 
  - `QRCode.js`: For high-quality QR generation.
  - `Multer`: For handling image uploads.
  - `UUID`: For generating unique image identifiers.

## 🛠️ Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Open the App**:
   Navigate to `http://localhost:3000` in your browser.

## 📦 Project Structure
```text
├── public/          # Frontend assets (HTML, CSS, JS)
├── uploads/         # Permanent storage for uploaded images
├── server.js        # Node.js/Express backend logic
├── package.json     # Project dependencies
└── README.md        # This file!
```

---
Made with ❤️ for a premium user experience.
