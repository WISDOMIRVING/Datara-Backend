import axios from "axios";

const client = axios.create({
  baseURL: process.env.VTU_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.VTU_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export const buyAirtime = async (payload) => {
  return (await client.post("/airtime", payload)).data;
};

export const buyData = async (payload) => {
  return (await client.post("/data", payload)).data;
};

export const payElectricity = async (payload) => {
  return (await client.post("/electricity", payload)).data;
};

export const subscribeCable = async (payload) => {
  return (await client.post("/cable", payload)).data;
};

export const buyExamPin = async (payload) => {
  return (await client.post("/exam", payload)).data;
};
