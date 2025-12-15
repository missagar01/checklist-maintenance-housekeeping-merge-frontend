import axios from "axios";

// const API = "http://localhost:5050/api/departments-for-setting";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API = `${API_BASE}/departments-for-setting`;

export const fetchDepartments = async () => {
  const res = await axios.get(API);
  return res.data.data;
};

export const addDepartment = async (data) => {
  const res = await axios.post(API, data);
  return res.data.data;
};

export const updateDepartment = async (id, data) => {
  const res = await axios.put(`${API}/${id}`, data);
  return res.data.data;
};

export const removeDepartment = async (id) => {
  const res = await axios.delete(`${API}/${id}`);
  return res.data.data;
};
