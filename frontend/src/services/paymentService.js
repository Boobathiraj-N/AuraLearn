import authAPI from "./authService";

export const createPaymentOrder = async (courseId) => {
  const response = await authAPI.post("/payments/create-order", {
    courseId,
  });

  return response.data;
};

export const verifyPayment = async (paymentData) => {
  const response = await authAPI.post("/payments/verify", paymentData);

  return response.data;
};