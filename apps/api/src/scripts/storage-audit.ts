/**
 * Storage reconciliation CLI: compares Mongo photo/document metadata
 * against stored bytes and reports ORPHAN / PHANTOM / SIZE_MISMATCH /
 * MIME_MISMATCH drift.
 *
 * Usage: pnpm --filter @family/api storage-audit [--json]
 * Exit code is 1 when issues are found (cron-friendly).
 */
import { connectDb, disconnectDb } from "../lib/db.js";
import "../lib/load-env.js";
import { auditStorage } from "../lib/storage-audit.js";

async function main() {
  const asJson = process.argv.includes("--json");
  await connectDb();
  try {
    const report = await auditStorage();
    if (asJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(
        `checked ${report.dbObjects} metadata rows vs ${report.storedObjects} stored objects at ${report.checkedAt}`,
      );
      if (report.issues.length === 0) {
        console.log("clean: no drift detected");
      } else {
        for (const issue of report.issues) {
          console.log(`[${issue.kind}] ${issue.key} — ${issue.detail}`);
        }
      }
    }
    process.exitCode = report.issues.length > 0 ? 1 : 0;
  } finally {
    await disconnectDb();
  }
}

void main();
