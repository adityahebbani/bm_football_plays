import Roboflow from 'roboflow';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import axios from 'axios';

const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const exists = fs.existsSync;

export interface VideoAnalysisResult {
  timestamp: number;
  prediction: any;
}

// Load your Roboflow model
export const loadRoboflowModel = async (): Promise<any> => {
  try {
    // Replace the API key, project, model, and version details with your actual values.
    const rf = new Roboflow('hB8S8n5OlohSOI3c51ic');
    const model = await rf.load('Boilermake 2025', 'presnaps-large-model/1', 'v1');
    console.log('Roboflow model loaded successfully.');
    return model;
  } catch (err) {
    console.error('Error loading Roboflow model:', err);
    throw err;
  }
};

// Analyze a video file (located at filePath) by extracting one frame per second
// and running the Roboflow model's prediction on each frame.
export const analyzeVideo = async (filePath: string): Promise<VideoAnalysisResult[]> => {
  const model = await loadRoboflowModel();

  // Create a temporary directory for frames if it doesn't already exist.
  const framesDir = path.join(__dirname, 'temp_frames');
  if (!exists(framesDir)) {
    await mkdir(framesDir);
  }

  // Get video duration using ffprobe via fluent-ffmpeg.
  const getVideoDuration = (): Promise<number> => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err: Error | null, metadata: any) => {
        if (err) return reject(err);
        const duration = metadata.format.duration || 0;
        resolve(duration);
      });
    });
  };

  const duration = await getVideoDuration();
  const results: VideoAnalysisResult[] = [];

  // Extract frames at a rate of 1 frame per second.
  // The frames will be saved as "frame-001.jpg", "frame-002.jpg", etc.
  await new Promise<void>((resolve, reject) => {
    ffmpeg(filePath)
      .output(path.join(framesDir, 'frame-%03d.jpg'))
      .outputOptions('-vf', 'fps=1')
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // Read the extracted frame files from the temporary directory.
  const files = await readdir(framesDir);
  const frameFiles = files.filter(f => f.endsWith('.jpg')).sort();

  // Process each frame file.
  for (let i = 0; i < frameFiles.length; i++) {
    const frameFilePath = path.join(framesDir, frameFiles[i]);
    // Assume each frame is one second apart.
    const timestamp = i + 1;
    const imageBuffer = await readFile(frameFilePath);
    const base64Image = 'data:image/jpeg;base64,' + imageBuffer.toString('base64');

    // Run prediction on the frame image.
    const prediction = await model.predict(base64Image);
    results.push({ timestamp, prediction });

    // Remove the frame file after processing.
    await unlink(frameFilePath);
  }

  return results;
};

// Client-side helper that sends the video file to the backend /api/analyze endpoint.
// This function is used by Home.tsx to trigger backend inference.
export const analyzeVideoBackend = async (file: File): Promise<VideoAnalysisResult[]> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post<VideoAnalysisResult[]>('/api/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error in backend video analysis:', error);
    throw error;
  }
};