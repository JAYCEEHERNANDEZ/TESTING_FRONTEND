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

// Fetch all readings (Admin)
export const fetchConsumptions = () => consumptionAPI.get("/all");

// Fetch readings for a specific user
export const fetchConsumptionsByUser = (userId) =>
  consumptionAPI.get(`/user/${userId}`);

// Add new reading
export const addConsumption = (data) =>
  consumptionAPI.post("/add", data);

// Update a reading (recalculate cubic_used, payments, etc.)
export const updateConsumption = (id, data) =>
  consumptionAPI.patch(`/update/${id}`, data);

// Delete a reading
export const deleteConsumption = (id) =>
  consumptionAPI.delete(`/delete/${id}`);

/* ---------------------------------------------
   BILLING (USER + ADMIN)
--------------------------------------------- */
export const billingAPI = axios.create({
  baseURL: "http://localhost:5000/billing",
  headers: { "Content-Type": "application/json" },
});

// Fetch individual user's billing records
export const fetchUserBilling = 
  (userId) => billingAPI.get(`/user/${userId}`);

// Fetch all billing records (Admin)
export const fetchAllBilling = () =>
  billingAPI.get(`/all`);

/* ---------------------------------------------
   MONTHLY INCOME
--------------------------------------------- */
export const monthlyIncomeAPI = axios.create({
  baseURL: "http://localhost:5000/monthly-income",
  headers: { "Content-Type": "application/json" },
});

// Fetch all monthly income records (Admin)
export const fetchAllMonthlyIncome = () => monthlyIncomeAPI.get("/all");


// PAYMENTS
export const paymentAPI = axios.create({
  baseURL: "http://localhost:5000/payment",
  headers: { "Content-Type": "application/json" },
});

// Fetch payments for resident
export const fetchUserPayments = (userId) =>
  paymentAPI.get(`/user/${userId}`);

// Make/update a payment
/* ---------------------------------------------
   PAYMENTS
--------------------------------------------- */
export const makePayment = (paymentId, data) =>
  paymentAPI.patch(`/pay/${paymentId}`, data);

/* ---------------------------------------------
   NOTIFICATIONS
--------------------------------------------- */
export const notificationAPI = axios.create({
  baseURL: "http://localhost:5000/notifications", // singular, matches router
  headers: { "Content-Type": "application/json" },
});

// Admin sends notification
export const sendNotification = (data) =>
  notificationAPI.post("/send", data);

// Fetch notifications for a specific user
export const fetchUserNotifications = (userId) =>
  notificationAPI.get(`/user/${userId}`);

// Fetch all notifications (admin view)
export const fetchAllNotifications = () =>
  notificationAPI.get("/all");

// Mark notification as read
export const markNotificationAsRead = (notifId) =>
  notificationAPI.put(`/read/${notifId}`);
