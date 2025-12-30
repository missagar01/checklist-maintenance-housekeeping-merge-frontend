// assignTaskApi.js - Updated version
import axios from './axios';

// const API_BASE_URL = 'http://localhost:3005/api';

export const pushAssignTask = async (taskData) => {
    try {
        const response = await axios.post(`/housekeeping-dashboard/assigntask/generate`, taskData, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 0,
        });

        return response.data;

    } catch (error) {
        throw error;
    }
};

export const getDepartments = async () => {
    try {
        const response = await axios.get('/dashboard/departments');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        return [];
    }
};

export const getLocations = async () => {
  try {
    const response = await axios.get('/locations');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return [];
  }
};

export const getUserDepartments = async (silent = false) => {
  try {
    const response = await axios.get('/users/departments');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error.response?.status === 403 || error.silent) {
      return [];
    }
    return [];
  }
};

export const createLocation = async (payload) => {
    if (!payload) {
        throw new Error('Department payload required');
    }
    const response = await axios.post('/locations', payload);
    return response.data;
};