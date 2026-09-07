import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * Runs once in the main vitest process before test-file workers spawn.
 * Pre-downloads (and caches) the mongod binary so the 16 parallel test
 * files — each creating its own MongoMemoryServer in beforeAll — never
 * race on the mongodb-memory-server download lockfile (which fails the
 * whole run with "Cannot unlock file ... not locked by this process").
 */
export async function setup(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  await mongo.stop();
}
