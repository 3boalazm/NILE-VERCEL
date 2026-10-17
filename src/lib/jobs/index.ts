import { PayloadJobRepository } from "./payload-repository"

/**
 * Single composition point for job-postings data, same shape as
 * `@/lib/products` and `@/lib/articles`. Pages import from here.
 */
export const jobRepository = new PayloadJobRepository()

export { MockJobRepository } from "./repository"
export type { JobRepository } from "./repository"
export { localizeJob, isJobOpen } from "./types"
export type { EmploymentType, Job, JobStatus, JobTranslation, WorkMode } from "./types"
