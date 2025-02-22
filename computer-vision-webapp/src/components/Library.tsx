import React, { useEffect, useState } from 'react';

interface VideoData {
    id: string;
    name: string;
    path: string;
    timestamp: number;
    isVideo: boolean;
}

const Library: React.FC = () => {
    const [videos, setVideos] = useState<VideoData[]>([]);

    useEffect(() => {
        fetch('/api/videos')
            .then(response => response.json())
            .then(data => setVideos(data))
            .catch(err => console.error('Error fetching videos:', err));
    }, []);

    return (
        <div className="home-container">
            <h2>Video Library</h2>
            <p>Most recent uploads appear first.</p>

            {videos.map((vid) => (
                <div
                    key={vid.id}
                    className="video-table-container"
                    style={{ display: 'flex', gap: '20px', marginBottom: '2rem' }}
                >
                    <div>
                        <h3>{vid.name}</h3>
                        {vid.isVideo ? (
                            <video controls width="400">
                                <source src={vid.path} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <img src={vid.path} alt={vid.name} width="400" />
                        )}
                    </div>

                    <table className="plays-table" style={{ alignSelf: 'center' }}>
                        <thead>
                            <tr>
                                <th>Play</th>
                                <th>Probability</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Play 1</td><td>25%</td></tr>
                            <tr><td>Play 2</td><td>20%</td></tr>
                            <tr><td>Play 3</td><td>15%</td></tr>
                            <tr><td>Play 4</td><td>10%</td></tr>
                            <tr><td>Play 5</td><td>5%</td></tr>
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default Library;