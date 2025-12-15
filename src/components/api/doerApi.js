import axios from "axios";

// const API = "http://localhost:5050/api/doer";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API = `${API_BASE}/doer`;


// GET ALL DOERS
export const fetchDoers = async () => {
  const res = await axios.get(`${API}/doers`);
  return res.data.data;
};

// ADD DOER
export const addDoer = async (data) => {
  const res = await axios.post(`${API}/doers`, data);
  return res.data.data;
};

// UPDATE DOER
export const updateDoer = async (id, data) => {
  const res = await axios.put(`${API}/doers/${id}`, data);
  return res.data.data;
};

// DELETE DOER
export const removeDoer = async (id) => {
  const res = await axios.delete(`${API}/doers/${id}`);
  return res.data;
};
