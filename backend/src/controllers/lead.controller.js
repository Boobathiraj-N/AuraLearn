
const Lead = require("../models/Lead");

const getMyLeads = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const staffRole = req.user.role;

    const leads = await Lead.find({
      assignedTo: staffId,
      currentTeam: staffRole,
    })
      .populate("student", "name email mobile profileType")
      .populate("course", "title thumbnail price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error) {
    next(error);
  }
};


    const updateLeadStatus = async (req, res, next) => {
    try {
        const { leadId } = req.params;
        const { status, temperature } = req.body;

        const allowedStatuses = [
        "new",
        "contacted",
        "follow_up",
        "completed",
        "interested",
        "payment_pending",
        "converted",
        "not_interested",
        ];

        const allowedTemperatures = ["cold", "warm"];

        if (
        status === undefined &&
        temperature === undefined
        ) {
        return res.status(400).json({
            success: false,
            message: "Status or temperature is required",
        });
        }

        if (
        status !== undefined &&
        !allowedStatuses.includes(status)
        ) {
        return res.status(400).json({
            success: false,
            message: "Invalid lead status",
        });
        }

        if (
        temperature !== undefined &&
        !allowedTemperatures.includes(temperature)
        ) {
        return res.status(400).json({
            success: false,
            message: "Invalid lead temperature",
        });
        }

        // Converted status must only be set after verified payment.
        if (status === "converted") {
        return res.status(400).json({
            success: false,
            message: "Lead can only be converted after payment verification",
        });
        }

        const lead = await Lead.findOne({
        _id: leadId,
        assignedTo: req.user.id,
        currentTeam: req.user.role,
        });

        if (!lead) {
        return res.status(404).json({
            success: false,
            message: "Lead not found or access denied",
        });
        }

        if (status !== undefined) {
        lead.status = status;
        }

        if (temperature !== undefined) {
        lead.temperature = temperature;
        }

        await lead.save();

        return res.status(200).json({
        success: true,
        message: "Lead updated successfully",
        lead,
        });
    } catch (error) {
        next(error);
    }
    };


module.exports = { getMyLeads, updateLeadStatus };
