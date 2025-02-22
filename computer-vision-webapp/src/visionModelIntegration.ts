import axios from 'axios';

const API_URL = 'http://your-api-endpoint.com/predict'; // Replace with your actual API endpoint

export const analyzeMedia = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(API_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // Assuming the response contains the prediction data
    } catch (error) {
        console.error('Error analyzing media:', error);
        throw error; // Rethrow the error for handling in the component
    }
};