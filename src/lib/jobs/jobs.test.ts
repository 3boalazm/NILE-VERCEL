import { describe, expect, it } from "vitest"

import { MockJobRepository } from "./repository"
import { isJobOpen, localizeJob, type Job } from "./types"

/**
 * The jobs system is CMS-driven and starts empty on purpose — publishing a
 * vacancy that does not exist would send real applicants nowhere. These tests
 * pin both halves: the empty default, and the open/paused/closed + closing-date
 * rules that decide what a visitor can see.
 */
const repository = new MockJobRepository()

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job_test",
    slug: "test-role",
    title: "وظيفة تجريبية",
    summary: "وصف مختصر",
    department: "المبيعات",
    location: "القاهرة",
    employmentType: "full-time",
    responsibilities: ["مسؤولية"],
    requirements: ["متطلب"],
    status: "open",
    postedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("jobs", () => {
  it("ships with no postings — the site must never invent an opening", async () => {
    expect(await repository.getAllJobs()).toEqual([])
    expect(await repository.getOpenJobs()).toEqual([])
    expect(await repository.getJobBySlug("anything")).toBeNull()
  })

  it("treats only 'open' postings as live", () => {
    const now = new Date("2026-09-24T00:00:00.000Z")
    expect(isJobOpen(makeJob({ status: "open" }), now)).toBe(true)
    expect(isJobOpen(makeJob({ status: "paused" }), now)).toBe(false)
    expect(isJobOpen(makeJob({ status: "closed" }), now)).toBe(false)
  })

  it("hides a posting once its closing date has passed", () => {
    const now = new Date("2026-09-24T00:00:00.000Z")
    expect(isJobOpen(makeJob({ closingDate: "2026-09-25T00:00:00.000Z" }), now)).toBe(true)
    expect(isJobOpen(makeJob({ closingDate: "2026-09-23T00:00:00.000Z" }), now)).toBe(false)
  })

  it("keeps the role live through the whole closing day", () => {
    // The admin date field stores 00:00, so the day itself must stay open.
    const job = makeJob({ closingDate: "2026-09-24T00:00:00.000Z" })
    expect(isJobOpen(job, new Date("2026-09-24T09:30:00.000Z"))).toBe(true)
    expect(isJobOpen(job, new Date("2026-09-24T23:59:59.000Z"))).toBe(true)
    expect(isJobOpen(job, new Date("2026-09-25T00:00:00.000Z"))).toBe(false)
  })

  it("ignores an unparseable closing date rather than hiding the role", () => {
    expect(isJobOpen(makeJob({ closingDate: "not-a-date" }))).toBe(true)
  })

  it("localizes the copy but keeps the factual fields", () => {
    const job = makeJob({
      translations: {
        en: {
          title: "Test role",
          summary: "Short summary",
          responsibilities: ["Own it"],
          requirements: ["Two years"],
          location: "Cairo",
          department: "Sales",
        },
      },
    })
    const en = localizeJob(job, "en")
    expect(en.title).toBe("Test role")
    expect(en.department).toBe("Sales")
    // Facts that are not translatable must survive untouched.
    expect(en.employmentType).toBe(job.employmentType)
    expect(en.postedAt).toBe(job.postedAt)
    expect(localizeJob(job, "ar").title).toBe(job.title)
  })
})

describe("localizeJob partial translations", () => {
  it("keeps the Arabic text for fields the English tab left blank", () => {
    const job = makeJob({
      title: "مندوب طبي",
      department: "المبيعات",
      responsibilities: ["زيارات ميدانية"],
      translations: {
        en: {
          title: "Medical rep",
          // Everything else is missing or blank, as a half-filled admin form
          // would leave it — the storefront must not render empty sections.
          summary: undefined,
          department: "",
          responsibilities: [],
          location: undefined,
        },
      },
    })
    const en = localizeJob(job, "en")
    expect(en.title).toBe("Medical rep")
    expect(en.summary).toBe(job.summary)
    expect(en.department).toBe(job.department)
    expect(en.location).toBe(job.location)
    expect(en.responsibilities).toEqual(job.responsibilities)
  })
})
