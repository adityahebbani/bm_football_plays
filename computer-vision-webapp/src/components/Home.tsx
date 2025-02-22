// filepath: /Users/adity/Files/bm_front/computer-vision-webapp/src/components/Home.tsx
import React, { useState } from 'react';

const Home: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [playProbability, setPlayProbability] = useState<number | null>(null);
    const [isVideo, setIsVideo] = useState<boolean>(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setIsVideo(selectedFile.type.startsWith('video/'));
        setPlayProbability(null);

        // Convert file to Data URL for storage
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;

            // Load existing library
            const stored = localStorage.getItem('uploadedVideos');
            let videos = stored ? JSON.parse(stored) : [];

            const newEntry = {
                id: crypto.randomUUID(),
                name: selectedFile.name,
                dataUrl,
                timestamp: Date.now(),
                isVideo: selectedFile.type.startsWith('video/'),
            };
            videos.push(newEntry);
            localStorage.setItem('uploadedVideos', JSON.stringify(videos));
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleScan = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/scan', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            setPlayProbability(data.probability);
        } else {
            console.error('Error scanning the file');
        }
    };

    return (
        <div className="home-container">
            <h2>Welcome!</h2>
            <div className="upload-section">
                <label htmlFor="file-input" className="file-upload-label">
                    Upload File
                </label>
                <input
                    id="file-input"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden-file-input"
                />
                <button onClick={handleScan} disabled={!file}>Scan</button>
            </div>

            <div className="media-table-container">
                <div>
                    {isVideo && file ? (
                        <video className="video-player" controls>
                            <source src={URL.createObjectURL(file)} type={file.type} />
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        file && (
                            <img
                                className="image-container"
                                src={URL.createObjectURL(file)}
                                alt="Uploaded"
                            />
                        )
                    )}

                    {playProbability !== null && (
                        <div className="probability-display">
                            <h3>Predicted Play Probability: {playProbability.toFixed(2)}%</h3>
                        </div>
                    )}
                </div>

                <table className="plays-table">
                    <thead>
                        <tr>
                            <th>Play</th>
                            <th>Probability</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Placeholder rows for future logic */}
                        <tr>
                            <td>Play 1</td>
                            <td>25%</td>
                        </tr>
                        <tr>
                            <td>Play 2</td>
                            <td>20%</td>
                        </tr>
                        <tr>
                            <td>Play 3</td>
                            <td>15%</td>
                        </tr>
                        <tr>
                            <td>Play 4</td>
                            <td>10%</td>
                        </tr>
                        <tr>
                            <td>Play 5</td>
                            <td>5%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Home;
