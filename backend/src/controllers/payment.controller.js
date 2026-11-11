const razorpay = require("../config/razorpay");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const PaymentHistory = require("../models/PaymentHistory");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Progress = require("../models/Progress");
const Lead = require("../models/Lead");
const { assignLead } = require("../services/leadAssignment.service");


const createPaymentOrder = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Valid course ID is required",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      status: "published",
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Published course not found",
      });
    }

    if (
      typeof course.price !== "number" ||
      !Number.isFinite(course.price) ||
      course.price <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid course price",
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: { $in: ["active", "completed"] },
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    const amount = Math.round(course.price * 100);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `course_${course._id}_${Date.now()}`,
    });

    // Find or create Sales Lead
    let lead = await Lead.findOne({
      student: studentId,
      course: course._id,
      currentTeam: "sales",
      status: { $ne: "converted" },
    });

    if (!lead) {
      lead = await Lead.create({
        student: studentId,
        course: course._id,
        currentTeam: "sales",
        status: "new",
        temperature: "cold",
      });

      const assignment = await assignLead({
        leadId: lead._id,
        team: "sales",
        reason: "initial_assignment",
      });

      lead = assignment.lead;
    }

    // Create payment history
    await PaymentHistory.create({
      student: studentId,
      course: course._id,
      lead: lead._id,
      amount,
      currency: "INR",
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};


const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !/^[a-f0-9]{64}$/i.test(razorpay_signature)
        ) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment details",
        });
    }

    const payment = await PaymentHistory.findOne({
      razorpayOrderId: razorpay_order_id,
      student: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }


    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValidSignature =
      generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpay_signature)
      );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const existingPaymentId = await PaymentHistory.findOne({
        razorpayPaymentId: razorpay_payment_id,
        _id: { $ne: payment._id },
        });

        if (existingPaymentId) {
        return res.status(409).json({
            success: false,
            message: "This payment has already been used",
        });
    }

    const razorpayPayment = await razorpay.payments.fetch(
        razorpay_payment_id
        );

        if (
        razorpayPayment.order_id !== razorpay_order_id ||
        razorpayPayment.status !== "captured" ||
        razorpayPayment.amount !== payment.amount ||
        razorpayPayment.currency !== payment.currency
        ) {
        return res.status(400).json({
            success: false,
            message: "Payment is not valid or not captured",
        });
        }

        const session = await mongoose.startSession();

        try {
        await session.withTransaction(async () => {
            const currentPayment = await PaymentHistory.findById(
            payment._id
            ).session(session);

            if (!currentPayment) {
                throw new Error("Payment record not found");
                }

            if (
              currentPayment.status === "captured" &&
              currentPayment.razorpayPaymentId === razorpay_payment_id
            ) {
              return;
            }

            if (currentPayment.status !== "created") {
              throw new Error("Payment cannot be verified in its current status");
            }

            if (
                currentPayment.razorpayPaymentId &&
                currentPayment.razorpayPaymentId !== razorpay_payment_id
                ) {
                throw new Error("Payment ID does not match this order");
            }

            currentPayment.razorpayPaymentId = razorpay_payment_id;
            currentPayment.status = "captured";
            currentPayment.paymentMethod = razorpayPayment.method;
            currentPayment.verifiedAt = new Date();

            await currentPayment.save({ session });

            const existingEnrollment = await Enrollment.findOne({
            student: currentPayment.student,
            course: currentPayment.course,
            }).session(session);

            let enrollment = existingEnrollment;

            if (!enrollment) {
            [enrollment] = await Enrollment.create(
                [{
                student: currentPayment.student,
                course: currentPayment.course,
                }],
                { session }
            );
            }

            await Progress.updateOne(
            {
                student: currentPayment.student,
                course: currentPayment.course,
            },
            {
                $setOnInsert: {
                student: currentPayment.student,
                course: currentPayment.course,
                },
            },
            { upsert: true, session }
            );

            currentPayment.enrollment = enrollment._id;
            const lead = currentPayment.lead
              ? await Lead.findById(currentPayment.lead).session(session)
              : null;

            if (lead) {
              if (lead.status !== "converted") {
                lead.status = "converted";
                lead.convertedAt = new Date();

                await lead.save({ session });
              }

              currentPayment.lead = lead._id;
            } else {
              currentPayment.lead = null;
            }

            await currentPayment.save({ session });
        });
        } finally {
        await session.endSession();
        }

        return res.status(200).json({
        success: true,
        message: "Payment verified and course enrollment successful",
        });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
};