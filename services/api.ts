
import axios from "axios";

const api = axios.create({
  baseURL: "https://language-bridge-orpin.vercel.app/",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
