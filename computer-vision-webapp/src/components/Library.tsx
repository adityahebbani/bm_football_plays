// filepath: /Users/adity/Files/bm_front/computer-vision-webapp/src/components/Library.tsx
import React, { useEffect, useState } from 'react';

interface StoredVideo {
    id: string;
    name: string;
    dataUrl: string;
    timestamp: number;
    isVideo: boolean;
}

// 1) List your preloaded video references here:
const PRELOADED_VIDEOS: StoredVideo[] = [
    {
        id: 'pre-1',
        name: 'My Preloaded Video',
        // public/videos/myvideo.mp4 => accessible at /videos/myvideo.mp4
        dataUrl: '/videos/myvideo.mp4',
        timestamp: 1,  // older timestamp so new uploads appear above it
        isVideo: true,
    }
];

const Library: React.FC = () => {
    const [videos, setVideos] = useState<StoredVideo[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('uploadedVideos');
        let merged: StoredVideo[] = [];

        if (!stored) {
            // 2) If localStorage is empty, seed it with your preloaded videos
            localStorage.setItem('uploadedVideos', JSON.stringify(PRELOADED_VIDEOS));
            merged = PRELOADED_VIDEOS;
        } else {
            const parsed = JSON.parse(stored) as StoredVideo[];
            merged = mergePreloadedAndStored(parsed);
            // In case the preloaded video is missing in localStorage, store it:
            localStorage.setItem('uploadedVideos', JSON.stringify(merged));
        }

        // Sort newest first
        merged.sort((a, b) => b.timestamp - a.timestamp);
        setVideos(merged);
    }, []);

    // 3) Helper to ensure preloaded items merge only once
    function mergePreloadedAndStored(storedVideos: StoredVideo[]): StoredVideo[] {
        const existingIds = new Set(storedVideos.map(v => v.id));
        const merged = [...storedVideos];

        PRELOADED_VIDEOS.forEach(preVid => {
            if (!existingIds.has(preVid.id)) {
                merged.push(preVid);
            }
        });
        return merged;
    }

    return (
        <div className="home-container">
            <h2>Video Library</h2>
            <p>This page displays preloaded and user-uploaded videos.</p>

            {videos.map((vid) => (
                <div key={vid.id} style={{ marginBottom: '2rem' }}>
                    <h3>{vid.name}</h3>
                    {vid.isVideo ? (
                        <video controls width="600">
                            <source src={vid.dataUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <img src={vid.dataUrl} alt={vid.name} width="600" />
                    )}

                    {/* Simple placeholder table for top 5 plays */}
                    <table className="plays-table" style={{ marginTop: '10px' }}>
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