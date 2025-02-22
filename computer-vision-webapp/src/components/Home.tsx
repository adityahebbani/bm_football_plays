import React, { useState } from 'react';

interface VideoData {
  id: string;
  name: string;
  path: string;
  timestamp: number;
  isVideo: boolean;
}

const Home: React.FC = () => {
  const [uploadedVideo, setUploadedVideo] = useState<VideoData | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data: VideoData = await response.json();
          // Store info about the newly uploaded video.
          setUploadedVideo(data);
          alert('File uploaded successfully!');
        } else {
          alert('Upload failed.');
        }
      } catch (err) {
        console.error('Error uploading file:', err);
      }
    }
  };

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

      {/* Show newly uploaded video or image immediately */}
      {uploadedVideo && (
        <div style={{ marginTop: '20px' }}>
          <h3>{uploadedVideo.name}</h3>
          {uploadedVideo.isVideo ? (
            <video width="400" controls>
              <source src={uploadedVideo.path} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img src={uploadedVideo.path} alt={uploadedVideo.name} width="400" />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;