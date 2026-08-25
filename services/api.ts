import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const api = axios.create({
  baseURL:
    "https://language-bridge-1.onrender.com/api/v1",
});

api.interceptors.request.use(
  async (config) => {
    const token =
      await AsyncStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;