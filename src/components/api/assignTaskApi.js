// assignTaskApi.js - Updated version
import axios from './axios';

// const API_BASE_URL = 'http://localhost:3005/api';

export const pushAssignTask = async (taskData) => {
    try {
        // console.log('Sending data to backend:', taskData);

        const response = await axios.post(`/housekeeping-dashboard/assigntask/generate`, taskData, {
            headers: {
                'Content-Type': 'application/json',
            },
            // Remove timeout completely or set it very high
            timeout: 0, // No timeout - wait indefinitely
        });

        return response.data;

    } catch (error) {
        console.error('API Error details:');

        if (error.code === 'ECONNABORTED') {
            console.log('Request was aborted - backend might be processing slowly');
        }

        throw error;
    }
};