import mongoose from 'mongoose';

let supportsTransactions;

async function databaseSupportsTransactions() {
  if (supportsTransactions !== undefined) {
    return supportsTransactions;
  }

  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  supportsTransactions = Boolean(hello.setName);
  return supportsTransactions;
}

export async function withBestEffortTransaction(work) {
  if (!(await databaseSupportsTransactions())) {
    return work(null);
  }

  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
