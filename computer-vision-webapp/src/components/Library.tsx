import React, { useEffect, useState } from 'react';

interface VideoData {
  id: string;
  name: string;
  path: string;
  timestamp: number;
  isVideo: boolean;
  formation?: string;
}

const Library: React.FC = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);

  useEffect(() => {
    fetch('/api/videos')
      .then((response) => response.json())
      .then((data) => setVideos(data))
      .catch((err) => console.error('Error fetching videos:', err));
  }, []);

  return (
    <div className="home-container">
      <h2>Video Library</h2>
      <p>Most recent uploads appear first.</p>

      {videos.map((vid) => (
        <div key={vid.id} style={{ marginBottom: '2rem' }}>
          <h3>{vid.name}</h3>
          {vid.isVideo ? (
            <video controls width="400">
              <source src={vid.path} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <>
              <img src={vid.path} alt={vid.name} width="400" />
              {vid.formation && (
                <p style={{ fontWeight: 'bold', marginTop: '10px' }}>
                  Formation: {vid.formation}
                </p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default Library;