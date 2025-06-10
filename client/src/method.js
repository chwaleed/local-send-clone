import axios from "axios";

export const getDevices = async () => {
  const response = await axios.get("http://localhost:5000/devices");
  if (response.data.success) {
    return response.data.data;
  }
  return [];
};
