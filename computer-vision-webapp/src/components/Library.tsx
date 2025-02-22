// filepath: /Users/adity/Files/bm_front/computer-vision-webapp/src/components/Library.tsx
import React, { useEffect, useState } from 'react';

interface StoredVideo {
    id: string;
    name: string;
    dataUrl: string;   // either base64 or a public URL
    timestamp: number;
    isVideo: boolean;
}

// Preloaded static videos in /public/videos.
// You can add as many as you want here.
const PRELOADED_VIDEOS: StoredVideo[] = [
    {
        id: 'pre-1',
        name: 'Preloaded Video 1',
        dataUrl: '/videos/preloaded1.mp4',   // path in /public
        timestamp: 1,                        // older timestamps so user uploads appear above
        isVideo: true,
    },
    {
        id: 'pre-2',
        name: 'Preloaded Video 2',
        dataUrl: '/videos/preloaded2.mp4',
        timestamp: 2,
        isVideo: true,
    },
];

const Library: React.FC = () => {
    const [videos, setVideos] = useState<StoredVideo[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('uploadedVideos');
        if (!stored) {
            // If no uploaded videos exist yet, seed localStorage with the preloaded ones
            localStorage.setItem('uploadedVideos', JSON.stringify(PRELOADED_VIDEOS));
            setVideos(PRELOADED_VIDEOS);
        } else {
            // Merge user uploads with preloaded items (if not already merged)
            const parsed = JSON.parse(stored) as StoredVideo[];
            const merged = mergePreloadedAndStored(parsed);
            // Sort newest first
            merged.sort((a, b) => b.timestamp - a.timestamp);

            // In case preloaded were not already merged, store them
            localStorage.setItem('uploadedVideos', JSON.stringify(merged));
            setVideos(merged);
        }
    }, []);

    // Helper to ensure preloaded items are merged only once
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
            <p>This page displays preloaded and user-uploaded videos in a blog-like format (newest first).</p>

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
                </div>
            ))}
        </div>
    );
};

export default Library;
