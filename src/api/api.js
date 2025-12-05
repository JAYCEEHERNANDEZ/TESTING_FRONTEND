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
export const fetchUserById = (id) => userAPI.get(`/${id}`);

// Reset password manually with a new password
export const resetUserPassword = (id, newPassword) =>
  userAPI.post(`/reset-password/${id}`, { newPassword });

//export const deleteUser = (id) => userAPI.delete(`/delete/${id}`);

// ✅ Replace deleteUser with deactivate/reactivate
export const deactivateUser = (id) => userAPI.put(`/deactivate/${id}`);
export const reactivateUser = (id) => userAPI.put(`/reactivate/${id}`);


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
// export const billingAPI = axios.create({
//   baseURL: "http://localhost:5000/billing",
//   headers: { "Content-Type": "application/json" },
// });

// // Fetch individual user's billing records
// export const fetchUserBilling = (userId) => billingAPI.get(`/user/${userId}`);

// // Fetch all billing records (Admin)
// export const fetchAllBilling = () => billingAPI.get(`/all`);

/* ---------------------------------------------
   MONTHLY INCOME
--------------------------------------------- */
export const monthlyIncomeAPI = axios.create({
  baseURL: "http://localhost:5000/monthly-income",
  headers: { "Content-Type": "application/json" },
});

// Fetch all monthly income records (Admin)
export const fetchAllMonthlyIncome = () => monthlyIncomeAPI.get("/all");

/* ---------------------------------------------
   PAYMENTS
--------------------------------------------- */
export const paymentAPI = axios.create({
  baseURL: "http://localhost:5000/payment",
  headers: { "Content-Type": "application/json" },
});

// Fetch payments for a specific user
export const fetchUserPayments = (userId) =>
  paymentAPI.get(`/user/${userId}`);

// Submit a payment for a single bill
export const submitPayment = (paymentId, amount, reference_code) =>
  paymentAPI.patch(`/pay/${paymentId}`, {
    amount,
    reference_code,
  });

// Submit payment for multiple bills (Pay All)
export const submitPayAll = (billIds = [], amount, reference_code) =>
  paymentAPI.patch(`/pay/all`, {
    bill_ids: billIds,
    amount,
    reference_code,
  });

// Submit reference code
export const submitReferenceCodeAPI = ({ user_id, reference_code }) =>
  axios.post("http://localhost:5000/payment/submit-reference", { user_id, reference_code });

  export const uploadPaymentProof = (formData) =>
  axios.post("http://localhost:5000/payment/upload-proof", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // USER: Get specific user's payment proofs
export const fetchUserPaymentProofs = (userId) =>
  paymentAPI.get(`/proofs/user/${userId}`);

// ADMIN: Get all payment proofs from all users
export const fetchAllPaymentProofs = () =>
  paymentAPI.get(`/proofs/all`);

  
// -----------------------------
// ADMIN PAYMENTS
// -----------------------------
export const adminPaymentAPI = axios.create({
  baseURL: "http://localhost:5000/payment", // matches backend
  headers: { "Content-Type": "application/json" },
});

// Fetch pending payments for a user
export const fetchUserPendingPayments = (userId) =>
  adminPaymentAPI.get(`/user/${userId}/pending`);

// Admin records a payment for a bill
// Admin records a payment for a specific user's bill
export const adminRecordPayment = (paymentId, amount) =>
  paymentAPI.post(`/record`, { payment_id: paymentId, amount });

// Admin marks payment status
export const adminMarkPaymentStatus = (paymentId, status) =>
  adminPaymentAPI.patch(`/pay/${paymentId}`, { status });

// Fetch all users for dropdown
export const fetchAllUsersAdmin = () =>
  adminPaymentAPI.get("/all-users");

/* ---------------------------------------------
   NOTIFICATIONS / REMINDERS
--------------------------------------------- */
export const notificationAPI = axios.create({
  baseURL: "http://localhost:5000/notifications",
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

//Per user//

// Admin sends notification
export const sendNotificationPerUser = (data) =>
  notificationAPI.post("/send", data);

// Fetch notifications for a specific user
export const fetchUserNotificationsPerUser = (userId) =>
  notificationAPI.get(`/user/${userId}`);

// Mark notification as read
export const readNotificationPerUser = (notifId) =>
  notificationAPI.put(`/read/${notifId}`);


// Notify admin (used when user submits reference code or proof)
export const notifyAdmin = (title, message) =>
  notificationAPI.post("/send", { user_id: null, title, message });

// Mark admin notification as read
export const markAdminNotificationAsRead = (notifId) =>
  notificationAPI.put(`/read/${notifId}`);

export const adminNotificationAPI = axios.create({
  baseURL: "http://localhost:5000/notifications/admin",
  headers: { "Content-Type": "application/json" },
});

// Fetch all admin notifications
export const fetchAdminNotifications = () =>
  adminNotificationAPI.get("/all");

// Mark an admin notification as read
export const markAdminNotificationRead = (id) =>
  adminNotificationAPI.put(`/read/${id}`);
// DEACTIVATION NOTICES
// -----------------------------
export const noticeAPI = axios.create({
  baseURL: "http://localhost:5000/deact-notice",
  headers: { "Content-Type": "application/json" },
});

// ADMIN – Fetch overdue users
export const fetchOverdueUsers = () => noticeAPI.get("/overdue");

// ADMIN – Send notice to specific user
export const sendDeactNotice = (data) => noticeAPI.post("/send", data);

// USER – Fetch their own notices
export const fetchUserNotices = (userId) => noticeAPI.get(`/user/${userId}`);

// USER – Mark as read
export const markNoticeAsRead = (id) => noticeAPI.put(`/read/${id}`);


export const receiptAPI = axios.create({
  baseURL: "http://localhost:5000/receipt",
  headers: { "Content-Type": "application/json" },
});

// Fetch a receipt by consumption ID
export const fetchReceipt = (consumptionId) => receiptAPI.get(`/${consumptionId}`);