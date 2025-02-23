import React, { useState, useRef, useEffect } from 'react';
import { analyzeVideoBackend, VideoAnalysisResult } from '../api/visionBackend';

interface VideoData {
  id: string;
  name: string;
  path: string;
  timestamp: number;
  isVideo: boolean;
}

const Home: React.FC = () => {
  const [uploadedVideo, setUploadedVideo] = useState<VideoData | null>(null);
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysisResult[] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // File upload handler
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Upload file to /api/upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data: VideoData = await response.json();
        setUploadedVideo(data);

        // Trigger backend analysis if video is an MP4
        if (data.isVideo && selectedFile.type === 'video/mp4') {
          const results = await analyzeVideoBackend(selectedFile);
          setAnalysisResults(results);
        }
      } else {
        alert('Upload failed.');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  // Overlay bounding boxes on the video as it plays.
  useEffect(() => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) return;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const handleLoadedMetadata = () => {
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
    };

    const updateOverlay = () => {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      if (!analysisResults) return;
      const currentTime = videoEl.currentTime;

      // Find predictions with timestamps near the current time (within ±0.5s)
      const result = analysisResults.find(
        (res) => Math.abs(res.timestamp - currentTime) < 0.5
      );

      if (result?.prediction?.predictions) {
        result.prediction.predictions.forEach((pred: any) => {
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.strokeRect(pred.x, pred.y, pred.width, pred.height);
          ctx.font = '16px Arial';
          ctx.fillStyle = 'red';
          ctx.fillText(pred.label, pred.x, pred.y - 5);
        });
      }
    };

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('timeupdate', updateOverlay);

    return () => {
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.removeEventListener('timeupdate', updateOverlay);
    };
  }, [analysisResults]);

  return (
    <div className="home-container">
      <h2>Upload and View on Home Page</h2>
      <div className="upload-section">
        <label htmlFor="file-input" className="file-upload-label">
          Choose File
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden-file-input"
        />
      </div>

      {uploadedVideo && (
        <div style={{ marginTop: '20px', position: 'relative', display: 'inline-block' }}>
          <h3>{uploadedVideo.name}</h3>
          {uploadedVideo.isVideo ? (
            <>
              <video ref={videoRef} width="400" controls>
                <source src={uploadedVideo.path} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                }}
              />
            </>
          ) : (
            <img src={uploadedVideo.path} alt={uploadedVideo.name} width="400" />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;