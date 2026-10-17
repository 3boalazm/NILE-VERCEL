import type { Job } from "./types"

/**
 * Intentionally empty.
 *
 * Every other mock repository in this project carries demo data so a fresh
 * checkout renders something. Jobs are the opposite case: publishing a
 * vacancy that does not exist is a real-world harm (people apply, and nobody
 * is hiring), so NPF's site shows the "no open positions" state until the
 * client posts a role from the Payload admin. Seeding writes nothing here.
 *
 * Add a posting in /admin → Jobs, not in this file.
 */
export const mockJobs: Job[] = []
