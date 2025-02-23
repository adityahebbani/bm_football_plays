const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const { spawnSync } = require('child_process'); // <-- added for invoking python script

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
    // Simplistic check for a video extension
    const lower = file.toLowerCase();
    const isVideoFile = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.avi');
    if (isVideoFile) {
      videos.push({
        id: uuid(),
        name: file,
        // The route to access it will be "/videos/<filename>"
        path: '/videos/' + file,
        timestamp: 0,             // older timestamp so user uploads appear above
        isVideo: true,
      });
    }
  });
}

// Load preexisting videos when the server starts
loadPreloadedVideos();

// 5) Endpoint: Upload a video, store in "uploads" folder, process it if video, and add to "videos" array
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  let newVideo = {
    id: uuid(),
    name: req.file.originalname,
    // Public route users can access:
    path: '/uploads/' + req.file.filename,
    timestamp: Date.now(),
    isVideo: req.file.mimetype.startsWith('video/'),
  };

  if (newVideo.isVideo) {
    // Ensure a "processed" folder exists inside the uploads folder.
    const processedFolder = path.join(uploadFolder, 'processed');
    if (!fs.existsSync(processedFolder)) {
      fs.mkdirSync(processedFolder);
    }

    const inputPath = req.file.path;
    const outputFilename = uuid() + path.extname(req.file.originalname);
    const outputPath = path.join(processedFolder, outputFilename);

    // Call the process_video.py script synchronously.
    const result = spawnSync('python', ['process_video.py', inputPath, outputPath]);
    if(result.error) {
      console.error('Error processing video:', result.error);
      return res.status(500).send('Error processing video.');
    }

    // Update newVideo path to point to the processed video.
    newVideo.path = '/uploads/processed/' + outputFilename;
  }

  videos.push(newVideo);
  return res.json(newVideo);
});

// 6) Endpoint: Return all videos (preloaded + uploads) in newest-first order
app.get('/api/videos', (req, res) => {
  videos.sort((a, b) => b.timestamp - a.timestamp);
  res.json(videos);
});

// 7) Serve uploaded files at "/uploads/<filename>"
app.use('/uploads', express.static(uploadFolder));

// 8) Catch-all: serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Finally, start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});