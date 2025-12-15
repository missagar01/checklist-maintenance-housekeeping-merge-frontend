import axios from '../api/axios';

// const API_BASE_URL = 'http://localhost:3005/api';

export const dashboardAPI = {
  getSummary: async (options = {}) => {
    const today = new Date().toISOString().split("T")[0];
    return axios.get("/housekeeping-dashboard/dashboard/summary", {
      params: {
        start_date: today,
        end_date: today,
        ...options
      }
    }).then(res => res.data);
  },

  getDepartments: async () => {
    return axios.get("/housekeeping-dashboard/dashboard/departments")
      .then(res => res.data);
  }
};

