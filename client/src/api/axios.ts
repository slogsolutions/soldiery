import { baseURL } from "@/utils/baseUrl";
import axios from "axios";


const serverUrl = baseURL

console.log("📡 Using backend URL:", serverUrl);

const axiosInstance = axios.create({
  baseURL: serverUrl,
  timeout: 5000,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`➡️ ${config.method} to: ${config.url}`);
    return config;
  },
  (error) => {
    console.log("Request error:", error);
    return Promise.reject(error);
  }
);

// Simple Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log("❌ API Error:", error.message);
    
    // Network Error (no response from server)
    if (!error.response) {
      console.log("⚠️ Network Error - Server might be down");
      console.log("Check if backend is running on Render");
      
      return Promise.reject(
        new Error("Cannot connect to server. Please try again later.")
      );
    }
    
    // Server responded with error
    console.log("Status Code:", error.response.status);
    
    // Handle 401 - Unauthorized
    if (error.response.status === 401) {
      window.location.href = "/login";
    }
    
    // Get error message
    const errorMessage = error.response.data?.message || "Something went wrong";
    return Promise.reject(new Error(errorMessage));
  }
);

export default axiosInstance;