const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const { spawnSync } = require('child_process'); // <-- for invoking python script

const app = express();
const PORT = process.env.PORT || 4000;

// 1) Serve the React build (after running: npm run build in your React app)
app.use(express.static(path.join(__dirname, 'build')));

// 2) Statically serve preloaded videos from "public/videos"
app.use('/videos', express.static(path.join(__dirname, 'public', 'videos')));

// 3) Configure multer to store user uploads in a local “uploads” folder
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, uuid() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// 4) In-memory list of videos. Production apps should use a database.
let videos = [];

/**
 * Load any preexisting videos from "public/videos"
 * so they appear in the library by default.
 */
function loadPreloadedVideos() {
  const preloadedDir = path.join(__dirname, 'public', 'videos');
  if (!fs.existsSync(preloadedDir)) return;
  const files = fs.readdirSync(preloadedDir);
  files.forEach(file => {
    // Check for common video extensions.
    const lower = file.toLowerCase();
    const isVideoFile = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.avi');
    if (isVideoFile) {
      videos.push({
        id: uuid(),
        name: file,
        path: '/videos/' + file, // accessible via /videos/...
        timestamp: 0, // Preloaded videos sorted older.
        isVideo: true,
      });
    }
  });
}

// Load preexisting videos on startup.
loadPreloadedVideos();

// 5) Endpoint: Upload a video, process it if needed, and add info to "videos" array.
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  let newVideo = {
    id: uuid(),
    name: req.file.originalname,
    // Default: raw uploaded path.
    path: '/uploads/' + req.file.filename,
    timestamp: Date.now(),
    isVideo: req.file.mimetype.startsWith('video/'),
  };

  if (newVideo.isVideo) {
    // Ensure a "processed" folder exists inside the uploads folder.
    const processedFolder = path.join(uploadFolder, 'processed');
    if (!fs.existsSync(processedFolder)) {
      fs.mkdirSync(processedFolder);
      console.log('Created processed folder:', processedFolder);
    }

    const inputPath = req.file.path;
    const outputFilename = uuid() + '.mp4';
    const outputPath = path.join(processedFolder, outputFilename);

    // Call process_video.py synchronously.
    const result = spawnSync('python', ['process_video.py', inputPath, outputPath]);
    console.log('Process stdout:', result.stdout.toString());
    console.log('Process stderr:', result.stderr.toString());

    if (result.error || result.status !== 0) {
      console.error('Error processing video:', result.error, result.stderr.toString());
      return res.status(500).send('Error processing video.');
    }
    
    // Check that the processed file exists.
    if (!fs.existsSync(outputPath)) {
      console.error('Processed video file not found at:', outputPath);
      return res.status(500).send('Processed video file not found.');
    }
    
    console.log('Processed video file created at:', outputPath);

    // Update newVideo path to point to the processed video.
    newVideo.path = '/uploads/processed/' + outputFilename;
  }

  videos.push(newVideo);
  console.log('New video pushed:', newVideo);
  return res.json(newVideo);
});

// 6) Endpoint: Return all videos in newest-first order.
app.get('/api/videos', (req, res) => {
  videos.sort((a, b) => b.timestamp - a.timestamp);
  res.json(videos);
});

// 7) Serve uploaded files.
app.use('/uploads', express.static(uploadFolder));

// 8) Catch-all: serve the React app for all other routes.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});