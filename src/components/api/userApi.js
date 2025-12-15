import axios from "axios";

// ⚠ Replace with your backend URL
// const API = "http://localhost:5050/api/users";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API = `${API_BASE}/users`;

// ➤ Get all users
export const fetchUsers = async () => {
  const res = await axios.get(API);
  return res.data.data;
};

// ➤ Add user
export const addUser = async (userData) => {
  const res = await axios.post(API, userData);
  return res.data.data;
};

// ➤ Update user
export const updateUser = async (id, userData) => {
  const res = await axios.put(`${API}/${id}`, userData);
  return res.data.data;
};

// ➤ Delete user
export const deleteUser = async (id) => {
  const res = await axios.delete(`${API}/${id}`);
  return res.data;
};
