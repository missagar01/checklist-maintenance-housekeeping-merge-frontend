"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../redux/slice/loginSlice"
import { LoginCredentialsApi } from "../redux/api/loginApi"

const LoginPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn, userData, error } = useSelector((state) => state.login);
  const dispatch = useDispatch();

  const [isLoginLoading, setIsLoginLoading] = useState(false)

  // Check if user is already logged in (session persisted in localStorage)
  useEffect(() => {
    const storedUsername = localStorage.getItem('user-name');
    if (storedUsername) {
      // User is already logged in, redirect to dashboard
      navigate("/dashboard/admin");
    }
  }, [navigate]);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    // Remove email_id from here since it's not a login input
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    dispatch(loginUser(formData));
  };

  // Update the useEffect in LoginPage.jsx
  // Update the useEffect in LoginPage.jsx to add more debugging
  // In LoginPage.jsx - update the useEffect
  useEffect(() => {
    if (isLoggedIn && userData) {
      // Store all user data in localStorage - optimized batch operation
      const dataToStore = {
        'user-name': userData.user_name || userData.username || "",
        'role': userData.role || "",
        'email_id': userData.email_id || userData.email || "",
      };

      // Batch localStorage operations
      Object.entries(dataToStore).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value);
        } else {
          localStorage.removeItem(key);
        }
      });

      // Store user_access
      if (userData.user_access) {
        localStorage.setItem('user_access', userData.user_access);
        localStorage.setItem('userAccess', userData.user_access);
      } else {
        localStorage.removeItem('user_access');
        localStorage.removeItem('userAccess');
      }

      // Store user_access1 (for housekeeping)
      if (userData.user_access1) {
        localStorage.setItem('user_access1', userData.user_access1);
        localStorage.setItem('userAccess1', userData.user_access1);
      } else {
        localStorage.removeItem('user_access1');
        localStorage.removeItem('userAccess1');
      }

      // Store page_access if available
      if (userData.page_access) {
        localStorage.setItem('page_access', userData.page_access);
      } else {
        localStorage.removeItem('page_access');
      }

      // Store system_access
      if (userData.system_access) {
        localStorage.setItem('system_access', userData.system_access);
      } else {
        localStorage.removeItem('system_access');
      }

      navigate("/dashboard/admin")
    } else if (error) {
      showToast(error, "error");
      setIsLoginLoading(false);
    }
  }, [isLoggedIn, userData, error, navigate]);

  // Removed supabase subscription - not needed for current implementation
  // User status is checked on login and session is managed via localStorage



  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 5000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md shadow-lg border border-blue-200 rounded-lg bg-white">
        <div className="space-y-1 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-lg">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="h-auto w-100 mr-3"
          />
          <h2 className="text-2xl font-bold text-blue-700 p-2 items-center justify-center">Checklist & Delegation</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="flex items-center text-blue-700">
              <i className="fas fa-user h-4 w-4 mr-2"></i>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="flex items-center text-blue-700">
              <i className="fas fa-key h-4 w-4 mr-2"></i>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 -mx-4 -mb-4 mt-4 rounded-b-lg">
            <button
              type="submit"
              className="w-full py-2 px-4 gradient-bg text-white rounded-md font-medium gradient-bg:hover disabled:opacity-50"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <div className="fixed left-0 right-0 bottom-0 py-1 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center text-sm shadow-md z-10">
          <a
            href="https://www.botivate.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Powered by-<span className="font-semibold">Botivate</span>
          </a>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${toast.type === "success"
          ? "bg-green-100 text-green-800 border-l-4 border-green-500"
          : "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default LoginPage