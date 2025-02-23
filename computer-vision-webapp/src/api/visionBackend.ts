//// filepath: /c:/Users/Adi/Files/Projects/bm_football_plays/computer-vision-webapp/src/api/visionBackend.ts
import axios from 'axios';

export interface VideoAnalysisResult {
  timestamp: number;
  prediction: any;
}

// This function sends the file to the backend /api/analyze endpoint for inference
export const analyzeVideoBackend = async (file: File): Promise<VideoAnalysisResult[]> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<VideoAnalysisResult[]>('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};