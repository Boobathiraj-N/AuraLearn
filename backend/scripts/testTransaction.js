
require("dotenv").config();

const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const testTransaction = async () => {
  const session = await mongoose.startSession();
  const collection = mongoose.connection.collection("transaction_tests");

  const testId = randomUUID();
  const commitId = `commit-${testId}`;
  const rollbackId = `rollback-${testId}`;

  try {
        

    // Test 1: Commit
    await session.withTransaction(async () => {
      await collection.insertOne(
        { testId: commitId, createdAt: new Date() },
        { session }
      );
    });

    const committedRecord = await collection.findOne({
      testId: commitId,
    });

    if (!committedRecord) {
      throw new Error("Commit test failed");
    }

    console.log("Commit test passed!");

    // Test 2: Rollback
    try {
      await session.withTransaction(async () => {
        await collection.insertOne(
          { testId: rollbackId, createdAt: new Date() },
          { session }
        );

        throw new Error("Intentional rollback test");
      });
    } catch (error) {
      if (error.message !== "Intentional rollback test") {
        throw error;
      }
    }

    const rolledBackRecord = await collection.findOne({
      testId: rollbackId,
    });

    if (rolledBackRecord) {
      throw new Error("Rollback test failed");
    }

    console.log("Rollback test passed!");

    await collection.deleteOne({ testId: commitId });
    console.log("Transaction tests completed successfully!");
  } catch (error) {
    console.error("Transaction test failed:", error.message);
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }
};

mongoose.connect(process.env.MONGODB_URI)
  .then(testTransaction)
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });
