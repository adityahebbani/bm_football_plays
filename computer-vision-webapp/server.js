const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const { spawnSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 4000;

// 1) Serve the React build (after running: npm run build)
app.use(express.static(path.join(__dirname, 'build')));

// 2) Statically serve preloaded videos from "public/videos"
app.use('/videos', express.static(path.join(__dirname, 'public', 'videos')));

// 3) Setup multer to store uploads in a local "uploads" folder
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, uuid() + path.extname(file.originalname))
});
const upload = multer({ storage });

// 4) In-memory list of videos/images.
// In production, use a database.
let videos = [];

// Helper: Load preexisting videos from "public/videos"
function loadPreloadedVideos() {
  const preloadedDir = path.join(__dirname, 'public', 'videos');
  if (!fs.existsSync(preloadedDir)) return;
  
  const files = fs.readdirSync(preloadedDir);
  files.forEach(file => {
    const lower = file.toLowerCase();
    const isVideoFile = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.avi');
    if (isVideoFile) {
      videos.push({
        id: uuid(),
        name: file,
        path: '/videos/' + file,
        timestamp: 0,
        isVideo: true,
      });
    }
  });
}
loadPreloadedVideos();

// 5) Upload endpoint: if a video, run process_video.py; if image, run image_inference.py.
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Create new object with default raw path.
  let newVideo = {
    id: uuid(),
    name: req.file.originalname,
    path: '/uploads/' + req.file.filename,
    timestamp: Date.now(),
    isVideo: req.file.mimetype.startsWith('video/'),
  };

  // Video processing:
  if (newVideo.isVideo) {
    // Ensure processed folder exists.
    const processedFolder = path.join(uploadFolder, 'processed');
    if (!fs.existsSync(processedFolder)) {
      fs.mkdirSync(processedFolder);
      console.log('Created processed folder:', processedFolder);
    }
    const inputPath = req.file.path;
    const outputFilename = uuid() + '.mp4';
    const outputPath = path.join(processedFolder, outputFilename);

    // Run process_video.py synchronously.
    const videoResult = spawnSync('python', ['process_video.py', inputPath, outputPath]);
    console.log('Video processing stdout:', videoResult.stdout.toString());
    console.log('Video processing stderr:', videoResult.stderr.toString());
    if (videoResult.error || videoResult.status !== 0) {
      console.error('Error processing video:', videoResult.error, videoResult.stderr.toString());
      return res.status(500).send('Error processing video.');
    }
    if (!fs.existsSync(outputPath)) {
      console.error('Processed video file not found at:', outputPath);
      return res.status(500).send('Processed video file not found.');
    }
    console.log('Processed video file created at:', outputPath);
    newVideo.path = '/uploads/processed/' + outputFilename;
  } else {
    // If file is an image, run image inference.
    const imageResult = spawnSync('python', ['image_inference.py', req.file.path]);
    console.log('Image inference stdout:', imageResult.stdout.toString());
    console.log('Image inference stderr:', imageResult.stderr.toString());
    if (imageResult.error || imageResult.status !== 0) {
      console.error('Error processing image:', imageResult.error, imageResult.stderr.toString());
      newVideo.formation = "UNKNOWN";
    } else {
      newVideo.formation = imageResult.stdout.toString().trim();
    }
  }

  videos.push(newVideo);
  console.log('New video/image pushed:', newVideo);
  return res.json(newVideo);
});

// 6) Endpoint: Return all videos/images in newest-first order.
app.get('/api/videos', (req, res) => {
  videos.sort((a, b) => b.timestamp - a.timestamp);
  res.json(videos);
});

// 7) Serve uploaded files.
app.use('/uploads', express.static(uploadFolder));

// 8) Catch-all route: serve the React app.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// 9) Start the server.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});