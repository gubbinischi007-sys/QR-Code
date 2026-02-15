document.addEventListener('DOMContentLoaded', () => {
    // Basic elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const previewSection = document.getElementById('preview-section');
    const imagePreview = document.getElementById('image-preview');
    const removeImgBtn = document.getElementById('remove-img');
    const generateBtn = document.getElementById('generate-btn');
    const loader = document.getElementById('loader');
    const resultOverlay = document.getElementById('result-overlay');
    const closeResultBtn = document.getElementById('close-result');
    const qrOutput = document.getElementById('qr-output');
    const downloadQr = document.getElementById('download-qr');
    const shareBtn = document.getElementById('share-btn');
    const imageUrlSpan = document.getElementById('image-url');

    // Camera elements
    const cameraBtn = document.getElementById('camera-btn');
    const cameraSection = document.getElementById('camera-section');
    const video = document.getElementById('video');
    const captureBtn = document.getElementById('capture-btn');
    const cancelCameraBtn = document.getElementById('cancel-camera');

    // Social elements
    const whatsappBtn = document.getElementById('whatsapp-btn');

    // Clickable preview
    const clickablePreview = document.querySelector('.clickable-preview');

    // History & Customizer
    const historySection = document.getElementById('history-section');
    const historyGrid = document.getElementById('history-grid');
    const clearHistoryBtn = document.getElementById('clear-history');
    const colorDots = document.querySelectorAll('.color-dot');

    let selectedFile = null;
    let currentQRCode = null;
    let currentImageUrl = null;
    let stream = null;
    let history = JSON.parse(localStorage.getItem('qr_history') || '[]');

    initHistory();

    // --- File Handling ---
    browseBtn.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });

    dropZone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (!file.type.startsWith('image/')) return alert('Images only!');
            selectedFile = file;
            displayPreview(file);
        }
    }

    function displayPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            dropZone.classList.add('hidden');
            cameraSection.classList.add('hidden');
            previewSection.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    removeImgBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null;
        fileInput.value = '';
        previewSection.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });

    // --- Camera Handling ---
    cameraBtn.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            video.srcObject = stream;
            dropZone.classList.add('hidden');
            previewSection.classList.add('hidden');
            cameraSection.classList.remove('hidden');
        } catch (err) {
            let msg = 'Could not access camera.';
            if (err.name === 'NotAllowedError') {
                msg = 'Camera permission denied. Please enable camera access in your browser settings and try again.';
            } else if (err.name === 'NotFoundError') {
                msg = 'No camera found on this device.';
            }
            alert(msg);
            cameraSection.classList.add('hidden');
            dropZone.classList.remove('hidden');
        }
    });

    cancelCameraBtn.addEventListener('click', stopCamera);

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraSection.classList.add('hidden');
        dropZone.classList.remove('hidden');
    }

    captureBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            const file = new File([blob], "captured_photo.jpg", { type: "image/jpeg" });
            selectedFile = file;
            displayPreview(file);
            stopCamera();
        }, 'image/jpeg', 0.9);
    });

    // --- Generation Handling ---
    async function generateQR() {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('image', selectedFile);

        loader.classList.remove('hidden');
        try {
            const response = await fetch('/upload', { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) {
                currentImageUrl = data.imageUrl;
                currentQRCode = data.qrCode;
                showResult(data);
                addToHistory(data);
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Server error. Is it running?');
        } finally {
            loader.classList.add('hidden');
        }
    }

    generateBtn.addEventListener('click', generateQR);

    clickablePreview.addEventListener('click', () => {
        if (!loader.classList.contains('hidden')) return;
        generateQR();
    });

    // --- Customizer ---
    colorDots.forEach(dot => {
        dot.addEventListener('click', async () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            updateQRColor(dot.dataset.color);
        });
    });

    async function updateQRColor(color) {
        if (!currentImageUrl) return;
        try {
            const qrDataUrl = await QRCode.toDataURL(currentImageUrl, {
                errorCorrectionLevel: 'H',
                margin: 1,
                scale: 10,
                color: { dark: color + 'ff', light: '#ffffffff' }
            });
            qrOutput.innerHTML = `<img src="${qrDataUrl}" alt="QR Code">`;
            downloadQr.href = qrDataUrl;
            qrOutput.style.boxShadow = `0 0 20px ${color}33`;
            qrOutput.style.borderColor = color + '44';
        } catch (err) { console.error(err); }
    }

    function showResult(data) {
        qrOutput.innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
        downloadQr.href = data.qrCode;
        imageUrlSpan.textContent = data.imageUrl;
        resultOverlay.classList.remove('hidden');
    }

    // --- History ---
    function addToHistory(item) {
        history.unshift({ ...item, id: Date.now() });
        if (history.length > 8) history.pop();
        localStorage.setItem('qr_history', JSON.stringify(history));
        renderHistory();
    }

    function initHistory() { renderHistory(); }

    function renderHistory() {
        if (history.length === 0) {
            historySection.classList.add('hidden');
            return;
        }
        historySection.classList.remove('hidden');
        historyGrid.innerHTML = history.map(item => `
            <div class="history-item" onclick="viewHistoryItem(${item.id})">
                <img src="${item.imageUrl}" alt="Uploaded">
            </div>
        `).join('');
    }

    window.viewHistoryItem = (id) => {
        const item = history.find(i => i.id === id);
        if (item) {
            currentImageUrl = item.imageUrl;
            currentQRCode = item.qrCode;
            showResult(item);
        }
    };

    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        localStorage.removeItem('qr_history');
        renderHistory();
    });

    // --- Sharing Logic ---
    shareBtn.onclick = () => {
        navigator.clipboard.writeText(currentImageUrl).then(() => {
            const originalText = shareBtn.textContent;
            shareBtn.innerHTML = 'Copied! <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => shareBtn.textContent = originalText, 2000);
        });
    };

    whatsappBtn.onclick = () => {
        const text = encodeURIComponent("Check out this image I uploaded to SnapQR: " + currentImageUrl);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    closeResultBtn.addEventListener('click', () => resultOverlay.classList.add('hidden'));
    resultOverlay.addEventListener('click', (e) => { if (e.target === resultOverlay) resultOverlay.classList.add('hidden'); });
});
