
const Lead = require("../models/Lead");
const LeadNote = require("../models/LeadNote");

const addLeadNote = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
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

    const note = await LeadNote.create({
      lead: lead._id,
      createdBy: req.user.id,
      content: content.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Lead note added successfully",
      note,
    });
  } catch (error) {
    next(error);
  }
};


const getLeadNotes = async (req, res, next) => {
  try {
    const { leadId } = req.params;

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

    const notes = await LeadNote.find({ lead: leadId })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = { addLeadNote, getLeadNotes };
