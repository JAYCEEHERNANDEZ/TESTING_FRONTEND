import axios from "axios";

/* ---------------------------------------------
   USERS (CUSTOMERS / RESIDENTS)
--------------------------------------------- */
export const userAPI = axios.create({
  baseURL: "http://localhost:5000/user",
  headers: { "Content-Type": "application/json" },
});

export const loginUser = (data) => userAPI.post("/login", data);
export const registerUser = (data) => userAPI.post("/register", data);
export const fetchUsers = () => userAPI.get("/all");
export const deleteUser = (id) => userAPI.delete(`/delete/${id}`);

/* ---------------------------------------------
   ADMIN + METER READER
--------------------------------------------- */
export const adminReaderAPI = axios.create({
  baseURL: "http://localhost:5000/adminreader",
  headers: { "Content-Type": "application/json" },
});

export const loginadminReader = (data) =>
  adminReaderAPI.post("/loginadminreader", data);

/* ---------------------------------------------
   USER CONSUMPTION (METER READINGS)
--------------------------------------------- */
export const consumptionAPI = axios.create({
  baseURL: "http://localhost:5000/consumption",
  headers: { "Content-Type": "application/json" },
});

// Fetch all readings
export const fetchConsumptions = () => consumptionAPI.get("/all");

// Add new reading
export const addConsumption = (data) =>
  consumptionAPI.post("/add", data);

// Full update (auto recalculates cubic_used, payments, etc.)
export const updateConsumption = (id, data) =>
  consumptionAPI.patch(`/update/${id}`, data);

// Delete a reading
export const deleteConsumption = (id) =>
  consumptionAPI.delete(`/delete/${id}`);
