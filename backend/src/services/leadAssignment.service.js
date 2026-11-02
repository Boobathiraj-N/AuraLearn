const User = require("../models/User");
const Lead = require("../models/Lead");
const LeadAssignment = require("../models/LeadAssignment");
const AssignmentCounter = require("../models/AssignmentCounter");

const assignLead = async ({
  leadId,
  team,
  assignedBy = null,
  reason = "initial_assignment",
  session,
}) => {
  if (!["support", "sales"].includes(team)) {
    throw new Error("Invalid assignment team");
  }

  // 1. Get active staff members
  const staffMembers = await User.find({
    role: team,
    isActive: true,
  })
    .sort({ _id: 1 })
    .session(session || null);

  if (staffMembers.length === 0) {
    throw new Error(`No active ${team} staff available`);
  }

  // 2. Atomically increment the team's counter
  const counter = await AssignmentCounter.findOneAndUpdate(
    { team },
    [
      {
        $set: {
          lastAssignedIndex: {
            $add: [{ $ifNull: ["$lastAssignedIndex", -1] }, 1],
          },
        },
      },
    ],
    {
      new: true,
      upsert: true,
      session,
      updatePipeline: true,
    }
  );

  // 3. Select the next staff member
  const index = counter.lastAssignedIndex % staffMembers.length;
  const selectedStaff = staffMembers[index];

  // 4. Close the previous active assignment
  await LeadAssignment.updateMany(
    { lead: leadId, endedAt: null },
    { $set: { endedAt: new Date() } },
    { session }
  );

  // 5. Update the lead's current owner and team
  const lead = await Lead.findByIdAndUpdate(
    leadId,
    {
      $set: {
        assignedTo: selectedStaff._id,
        currentTeam: team,
      },
    },
    {
      new: true,
      runValidators: true,
      session,
    }
  );

  if (!lead) {
    throw new Error("Lead not found");
  }

  // 6. Save assignment history
  const [assignment] = await LeadAssignment.create(
    [
      {
        lead: leadId,
        assignedTo: selectedStaff._id,
        team,
        assignedBy,
        reason,
      },
    ],
    { session }
  );

  return { lead, assignment };
};

module.exports = { assignLead };