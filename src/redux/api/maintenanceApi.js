import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

// Create axios instance with base URL
const maintenanceApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add authorization header
maintenanceApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API functions
export const getMaintenanceTasksAPI = (page = 1, filters = {}) => {
  const params = { page, ...filters };
  return maintenanceApi.get("maintenance/tasks", { params });
};

export const getPendingMaintenanceTasksAPI = (page = 1, userId = null) => {
  const params = { page, ...(userId && { userId }) };
  return maintenanceApi.get("maintenance/tasks/pending", { params });
};

export const getCompletedMaintenanceTasksAPI = (page = 1, filters = {}) => {
  const params = { page, ...filters };
  return maintenanceApi.get("maintenance/tasks/completed", { params });
};

export const updateMaintenanceTaskAPI = (taskId, updateData) => {
  const formData = new FormData();
  
  // Add all update data to formData
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined && updateData[key] !== null) {
      formData.append(key, updateData[key]);
    }
  });
  
  return maintenanceApi.put(`maintenance/tasks/${taskId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

export const updateMultipleMaintenanceTasksAPI = (tasks) => {
  return maintenanceApi.put("maintenance/tasks/bulk/update", { tasks });
};

export const getUniqueMachineNamesAPI = () => {
  return maintenanceApi.get("maintenance/machines/unique");
};

export const getUniqueAssignedPersonnelAPI = () => {
  return maintenanceApi.get("maintenance/personnel/unique");
};

export const getMaintenanceStatisticsAPI = () => {
  return maintenanceApi.get("maintenance/statistics");
};

export default maintenanceApi;