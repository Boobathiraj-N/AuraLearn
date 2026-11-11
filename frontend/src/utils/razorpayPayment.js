import {
  createPaymentOrder,
  verifyPayment,
} from "../services/paymentService";

export const startRazorpayPayment = async (courseId) => {
  try {
    // 1. Create order from backend
    const orderData = await createPaymentOrder(courseId);

    const options = {
      key: orderData.keyId,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: "AuraLearn AI",
      description: "Course Enrollment",
      order_id: orderData.order.id,

      // handler: async function (response) {
      //   try {
      //     // 2. Verify payment on backend
      //     const result = await verifyPayment(response);

      //     alert(result.message);
      //   } catch (error) {
      //     alert(
      //       error.response?.data?.message ||
      //         "Payment verification failed"
      //     );
      //   }
      // },

      // ithu summa temporary code than 

      handler: async function (response) {
        console.log("Razorpay Order ID:", response.razorpay_order_id);
        console.log("Razorpay Payment ID:", response.razorpay_payment_id);
        console.log("Razorpay Signature:", response.razorpay_signature);

        try {
          const result = await verifyPayment(response);

          alert(result.message);
        } catch (error) {
          alert(
            error.response?.data?.message ||
              "Payment verification failed"
          );
        }
      },
      modal: {
        ondismiss: function () {
          console.log("Payment window closed");
        },
      },

      theme: {
        color: "#4F46E5",
      },
    };

    if (!window.Razorpay) {
      throw new Error("Razorpay Checkout script not loaded");
    }

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", function (response) {
      console.error("Payment failed:", response.error);
      alert("Payment failed. Please try again.");
    });

    razorpay.open();
  } catch (error) {
    console.error("Payment error:", error);

    alert(
      error.response?.data?.message ||
        error.message ||
        "Unable to start payment"
    );
  }
};