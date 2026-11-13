
import {
  createPaymentOrder,
  verifyPayment,
} from "../services/paymentService";

export const startRazorpayPayment = async (courseId) => {
  try {
    // 1. Create order from backend
    const orderData = await createPaymentOrder(courseId);

    if (!window.Razorpay) {
      throw new Error("Razorpay Checkout script not loaded");
    }

    // 2. Open Razorpay checkout and wait for verification
    return new Promise((resolve, reject) => {
      let settled = false;

      const finish = (callback, value) => {
        if (settled) return;

        settled = true;
        callback(value);
      };

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "AuraLearn AI",
        description: "Course Enrollment",
        order_id: orderData.order.id,

        // 3. Verify payment on backend
        handler: async function (response) {
          try {
            const result = await verifyPayment(response);

            finish(resolve, result);
          } catch (error) {
            finish(
              reject,
              new Error(
                error.response?.data?.message ||
                  "Payment verification failed"
              )
            );
          }
        },

        modal: {
          ondismiss: function () {
            finish(
              reject,
              new Error("Payment cancelled by user")
            );
          },
        },

        theme: {
          color: "#4F46E5",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        finish(
          reject,
          new Error(
            response.error?.description ||
              "Payment failed. Please try again."
          )
        );
      });

      razorpay.open();
    });
  } catch (error) {
    throw error;
  }
};
