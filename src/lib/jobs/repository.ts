import { isJobOpen, type Job } from "./types"
import { mockJobs } from "./mock-repository"

/**
 * Data seam for job postings, mirroring `ProductRepository` and
 * `ArticleRepository`. The open/paused/closed filter lives here rather than in
 * the pages, so a paused posting cannot leak into the storefront by accident.
 */
export interface JobRepository {
  getOpenJobs(): Promise<Job[]>
  getJobBySlug(slug: string): Promise<Job | null>
  getAllJobs(): Promise<Job[]>
}

export class MockJobRepository implements JobRepository {
  async getAllJobs(): Promise<Job[]> {
    return mockJobs
  }

  async getOpenJobs(): Promise<Job[]> {
    return mockJobs
      .filter((job) => isJobOpen(job))
      .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))
  }

  async getJobBySlug(slug: string): Promise<Job | null> {
    return mockJobs.find((job) => job.slug === slug && isJobOpen(job)) ?? null
  }
}
