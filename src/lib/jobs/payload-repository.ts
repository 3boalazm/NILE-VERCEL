import { getPayloadClient } from "@/lib/cms/payload-client"
import { degradeToMock } from "@/lib/products/mock-fallback"
import { MockJobRepository } from "./repository"
import { isJobOpen, type EmploymentType, type Job, type JobRepository, type JobStatus, type WorkMode } from "./types"

/**
 * Live repository for job postings. Mirrors the product/article repositories:
 * CMS shapes are mapped here so pages never import Payload, and a CMS outage
 * fails closed unless `MOCK_CATALOG_FALLBACK` is explicitly enabled (in which
 * case the mock list — currently empty — is served).
 */
const EMPLOYMENT_TYPES: EmploymentType[] = ["full-time", "part-time", "contract", "internship"]
const WORK_MODES: WorkMode[] = ["onsite", "hybrid", "remote"]
const STATUSES: JobStatus[] = ["open", "paused", "closed"]

function toEmploymentType(value: unknown): EmploymentType {
  return EMPLOYMENT_TYPES.includes(value as EmploymentType) ? (value as EmploymentType) : "full-time"
}

function toWorkMode(value: unknown): WorkMode | undefined {
  return WORK_MODES.includes(value as WorkMode) ? (value as WorkMode) : undefined
}

function toStatus(value: unknown): JobStatus {
  return STATUSES.includes(value as JobStatus) ? (value as JobStatus) : "closed"
}

const texts = (value: unknown): string[] =>
  Array.isArray(value)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value as any[]).map((item) => (typeof item === "string" ? item : (item?.text ?? ""))).filter(Boolean)
    : []

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Payload document shapes are validated at runtime
function toJob(doc: any): Job {
  const en = doc.translations?.en
  return {
    id: String(doc.id),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    department: doc.department,
    location: doc.location,
    employmentType: toEmploymentType(doc.employmentType),
    workMode: toWorkMode(doc.workMode),
    experience: doc.experience ?? undefined,
    responsibilities: texts(doc.responsibilities),
    requirements: texts(doc.requirements),
    niceToHave: texts(doc.niceToHave).length ? texts(doc.niceToHave) : undefined,
    status: toStatus(doc.status),
    postedAt: doc.postedAt ?? doc.createdAt ?? new Date().toISOString(),
    closingDate: doc.closingDate ?? undefined,
    translations: en
      ? {
          en: {
            title: en.title ?? undefined,
            summary: en.summary ?? undefined,
            responsibilities: texts(en.responsibilities),
            requirements: texts(en.requirements),
            niceToHave: texts(en.niceToHave).length ? texts(en.niceToHave) : undefined,
            location: en.location ?? undefined,
            department: en.department ?? undefined,
          },
        }
      : undefined,
  }
}

async function findJobs(where?: Record<string, unknown>, operation = "findJobs"): Promise<Job[]> {
  // The config is imported on demand (not at module scope) so a missing
  // runtime CMS environment surfaces as a failed *read* — which this
  // repository already handles — instead of a failed page render.
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: "jobs",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Payload's Where type is generic over the collection
    where: where as any,
    limit: 200,
    depth: 0,
    sort: "-postedAt",
    overrideAccess: true,
  })
  void operation
  return result.docs.map(toJob)
}

export class PayloadJobRepository implements JobRepository {
  private mock = new MockJobRepository()

  private async read(operation: string, where: Record<string, unknown>, fallback: () => Promise<Job[]>) {
    try {
      return await findJobs(where, operation)
    } catch (error) {
      degradeToMock(operation, error)
      return fallback()
    }
  }

  async getAllJobs(): Promise<Job[]> {
    return this.read("getAllJobs", {}, () => this.mock.getAllJobs())
  }

  async getOpenJobs(): Promise<Job[]> {
    // `status: open` narrows in the database; the closing-date rule is applied
    // here because it depends on today's date, which SQL would evaluate in a
    // second place and risk drifting from `isJobOpen`.
    const jobs = await this.read("getOpenJobs", { status: { equals: "open" } }, () => this.mock.getOpenJobs())
    return jobs.filter((job) => isJobOpen(job)).sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))
  }

  async getJobBySlug(slug: string): Promise<Job | null> {
    const jobs = await this.read(
      `getJobBySlug("${slug}")`,
      { slug: { equals: slug }, status: { equals: "open" } },
      async () => {
        const found = await this.mock.getJobBySlug(slug)
        return found ? [found] : []
      }
    )
    return jobs.find((job) => isJobOpen(job)) ?? null
  }
}
