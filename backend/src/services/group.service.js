
const CourseGroup = require("../models/CourseGroup");
const GroupMembership = require("../models/GroupMembership");

const ensureCourseGroupMembership = async ({
  course,
  studentId,
  session,
}) => {
  // Find existing group or create a new group
  const group = await CourseGroup.findOneAndUpdate(
    { course: course._id },
    {
      $setOnInsert: {
        course: course._id,
        name: `${course.title} Group`,
        description: `Discussion group for ${course.title}`,
      },
    },
    {
      new: true,
      upsert: true,
      session,
      setDefaultsOnInsert: true,
    }
  );

  // Check existing membership
  let membership = await GroupMembership.findOne({
    group: group._id,
    student: studentId,
  }).session(session);

  if (membership) {
    // Reactivate membership if previously inactive
    if (!membership.isActive) {
      membership.isActive = true;
      membership.joinedAt = new Date();

      await membership.save({ session });

      await CourseGroup.updateOne(
        { _id: group._id },
        { $inc: { memberCount: 1 } },
        { session }
      );
    }
  } else {
    // Create new membership
    [membership] = await GroupMembership.create(
      [
        {
          group: group._id,
          student: studentId,
        },
      ],
      { session }
    );

    // Update group member count
    await CourseGroup.updateOne(
      { _id: group._id },
      { $inc: { memberCount: 1 } },
      { session }
    );
  }

  return { group, membership };
};

module.exports = {
  ensureCourseGroupMembership,
};
