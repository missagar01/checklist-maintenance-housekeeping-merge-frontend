

import axios from "axios";

// Dynamic Base URL
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/login`;

export const LoginCredentialsApi = async (formData) => {
  try {
    const res = await axios.post(BASE_URL, formData);

    return { data: res.data }; // same return format
  } catch (err) {
    return { error: err.response?.data?.error || "Login failed" };
  }
};

export const logoutApi = async () => {
  try {
    await axios.post(`${BASE_URL}/logout`);
  } catch (err) {
    console.warn("Logout API failed", err);
  }
};
