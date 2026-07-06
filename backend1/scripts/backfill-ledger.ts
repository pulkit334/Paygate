import mongoose from "mongoose";
import dotenv from "dotenv";
import Transaction from "../models/transction";
import TransactionLedger from "../models/ledgerentry";

dotenv.config();

async function backfill() {
  const uri = process.env.Db;
  if (!uri) throw new Error("Db env not set");

  await mongoose.connect(uri);
  console.log("Connected to DB");

  const paidTxns = await Transaction.find({ status: "paid" })
    .sort({ createdAt: 1 })
    .lean();

  console.log(`Found ${paidTxns.length} paid transactions`);

  if (paidTxns.length === 0) {
    console.log("Nothing to backfill");
    await mongoose.disconnect();
    return;
  }

  // Group by appId
  const byApp: Record<string, typeof paidTxns> = {};
  for (const tx of paidTxns) {
    const id = tx.appId.toString();
    if (!byApp[id]) byApp[id] = [];
    byApp[id].push(tx);
  }

  let totalCreated = 0;

  for (const [appId, txns] of Object.entries(byApp)) {
    // Check existing ledger to resume from there
    const lastEntry = await TransactionLedger.findOne({
      appId: new mongoose.Types.ObjectId(appId),
    })
      .sort({ createdAt: -1 })
      .lean();

    let balance = lastEntry?.balanceAfter ?? 0;
    const existingTxIds = new Set(
      (
        await TransactionLedger.find({
          appId: new mongoose.Types.ObjectId(appId),
        })
          .select("transactionId")
          .lean()
      ).map((e) => e.transactionId),
    );

    for (const tx of txns) {
      const txId = tx._id.toString();
      if (existingTxIds.has(txId)) continue;

      const balanceBefore = balance;
      const balanceAfter = balance + tx.amount;

      await TransactionLedger.create({
        transactionId: txId,
        appId: new mongoose.Types.ObjectId(appId),
        amount: tx.amount,
        balanceBefore,
        balanceAfter,
        description: `Backfill: ${tx.currency} payment`,
        createdAt: tx.createdAt || new Date(),
        updatedAt: tx.createdAt || new Date(),
      });

      balance = balanceAfter;
      totalCreated++;
    }

    console.log(`App ${appId}: balance now ₹${balance / 100}`);
  }

  console.log(`\nDone. Created ${totalCreated} ledger entries.`);
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
