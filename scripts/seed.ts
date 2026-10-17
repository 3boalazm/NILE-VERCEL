/**
 * Seeds Payload (categories + products + articles) from the mock data — the same
 * data the storefront used before Payload went live, so a fresh database
 * boots with a real, renderable catalog instead of empty pages.
 *
 * Idempotent: existing slugs are skipped, never duplicated. Run with:
 *   DATABASE_URI=... PAYLOAD_SECRET=... npm run seed
 * To refresh existing rows from the mock catalog (e.g. after product
 * content updates in mock-repository.ts), re-run with --update — existing
 * slugs are overwritten with the mock data, new slugs are still created:
 *   DATABASE_URI=... PAYLOAD_SECRET=... npm run seed -- --update
 * Optionally also creates the first admin user:
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed
 */
import fs from "fs"
import path from "path"

import { getPayload } from "payload"

import config from "../src/payload.config"
import { MockProductRepository } from "../src/lib/products/mock-repository"
import { mockArticles } from "../src/lib/articles/mock-repository"
import type { Article } from "../src/lib/articles/types"
import { mockJobs } from "../src/lib/jobs/mock-repository"
import type { Job } from "../src/lib/jobs/types"
import type { Product, ProductCategory } from "../src/lib/products/types"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} — export it before running the seed (see .env.example).`)
  return value
}

// Payload's Postgres adapter runs an interactive `prompts()` confirm during
// its schema push (pushDevSchema) whenever drizzle detects any diff/warning.
// Under a non-TTY runner (GitHub Actions) that prompt never resolves and the
// seed would hang forever waiting for input. Detect that environment and
// force a non-interactive push instead — PUPPETEER-like stdin is hard to
// fake, but drizzle-kit/payload respect `PAYLOAD_FORCE_DRIZZLE_PUSH` to skip
// the equality shortcut; the prompts are only reached when warnings exist,
// so on a fresh CI database (no tables, no warnings) this is a safe default.
if (!process.stdin.isTTY) {
  process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = "true"
  console.log("seed: non-interactive environment — forcing drizzle schema push.")
}

function toCategoryData(category: ProductCategory, imageId?: number) {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? undefined,
    status: category.status ?? "active",
    image: imageId,
    translations: category.translations?.en
      ? {
          en: {
            name: category.translations.en.name ?? undefined,
            description: category.translations.en.description ?? undefined,
          },
        }
      : undefined,
  }
}

/**
 * Uploads a file that already ships in `public/` into the `media` collection
 * and returns its id, so seeded categories/products get the same artwork the
 * static catalog defines instead of rendering the placeholder graphic.
 *
 * Idempotent by filename: an existing media row is reused rather than
 * re-uploaded, so re-runs (and `--update`) stay cheap. Results are memoized
 * because galleries legitimately reuse files.
 */
const mediaIdsByPath = new Map<string, number | undefined>()

async function ensureMedia(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload instance type is structural here
  payload: any,
  publicPath: string,
  alt: string
): Promise<number | undefined> {
  if (mediaIdsByPath.has(publicPath)) return mediaIdsByPath.get(publicPath)

  const filePath = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""))
  if (!fs.existsSync(filePath)) {
    console.warn(`media: ${publicPath} not found in public/ — skipping (image will render as a placeholder)`)
    mediaIdsByPath.set(publicPath, undefined)
    return undefined
  }

  const filename = path.basename(filePath)
  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    const id = existing.docs[0].id as number
    mediaIdsByPath.set(publicPath, id)
    return id
  }

  const created = await payload.create({
    collection: "media",
    data: { alt },
    filePath,
    overrideAccess: true,
  })
  const id = created.id as number
  mediaIdsByPath.set(publicPath, id)
  console.log(`media: uploaded ${filename}`)
  return id
}

function toProductData(
  product: Product,
  categoryId: number,
  imageId?: number,
  galleryIds: number[] = []
) {
  const en = product.translations?.en
  return {
    name: product.name,
    nameArabic: product.nameArabic ?? undefined,
    slug: product.slug,
    category: categoryId,
    image: imageId,
    gallery: galleryIds.map((image) => ({ image })),
    status: product.status,
    shortDescription: product.shortDescription,
    keyBenefits: product.keyBenefits.map((text) => ({ text })),
    composition: product.composition?.map((item) => ({ label: item.label, value: item.value })),
    compositionNote: product.compositionNote ?? undefined,
    usage: product.usage ?? undefined,
    availableForm: product.availableForm ?? undefined,
    scientificInfo: product.scientificInfo ?? undefined,
    downloadUrl: product.downloadUrl ?? undefined,
    faq: product.faq?.map((item) => ({ question: item.question, answer: item.answer })),
    testimonials: product.testimonials?.map((item) => ({ quote: item.quote, author: item.author ?? undefined })),
    clinicalReferences: product.clinicalReferences?.map((item) => ({
      title: item.title,
      authors: item.authors ?? undefined,
      year: item.year ?? undefined,
      url: item.url ?? undefined,
      note: item.note ?? undefined,
    })),
    translations: en
      ? {
          en: {
            shortDescription: en.shortDescription ?? undefined,
            keyBenefits: en.keyBenefits?.map((text) => ({ text })),
            composition: en.composition?.map((item) => ({ label: item.label, value: item.value })),
            compositionNote: en.compositionNote ?? undefined,
            usage: en.usage ?? undefined,
            availableForm: en.availableForm ?? undefined,
            scientificInfo: en.scientificInfo ?? undefined,
            faq: en.faq?.map((item) => ({ question: item.question, answer: item.answer })),
            testimonials: en.testimonials?.map((item) => ({
              quote: item.quote,
              author: item.author ?? undefined,
            })),
            clinicalReferences: en.clinicalReferences?.map((item) => ({
              title: item.title,
              authors: item.authors ?? undefined,
              year: item.year ?? undefined,
              url: item.url ?? undefined,
      note: item.note ?? undefined,
            })),
          },
        }
      : undefined,
  }
}

/**
 * Maps a Job onto the Payload `jobs` collection shape. `mockJobs` is empty by
 * design — postings are created in the admin, not in code — so this path only
 * seeds rows if the mock list ever gains one, and keeps the two shapes in sync
 * either way.
 */
function toJobData(job: Job) {
  const en = job.translations?.en
  return {
    slug: job.slug,
    status: job.status,
    title: job.title,
    summary: job.summary,
    department: job.department,
    location: job.location,
    employmentType: job.employmentType,
    workMode: job.workMode ?? undefined,
    experience: job.experience ?? undefined,
    responsibilities: job.responsibilities.map((text) => ({ text })),
    requirements: job.requirements.map((text) => ({ text })),
    niceToHave: job.niceToHave?.map((text) => ({ text })) ?? undefined,
    postedAt: job.postedAt,
    closingDate: job.closingDate ?? undefined,
    translations: en
      ? {
          en: {
            title: en.title ?? undefined,
            summary: en.summary ?? undefined,
            department: en.department ?? undefined,
            location: en.location ?? undefined,
            responsibilities: en.responsibilities?.map((text) => ({ text })),
            requirements: en.requirements?.map((text) => ({ text })),
            niceToHave: en.niceToHave?.map((text) => ({ text })) ?? undefined,
          },
        }
      : undefined,
  }
}

/**
 * Maps an Article onto the Payload `articles` collection shape. The product
 * relationship is resolved by slug at seed time (Payload validates
 * relationships against numeric ids, same constraint as products/categories).
 */
function toArticleData(article: Article, productId?: number) {
  const en = article.translations?.en
  return {
    slug: article.slug,
    status: article.status,
    evidenceTier: article.evidenceTier,
    product: productId,
    title: article.title,
    summary: article.summary,
    keyFindings: article.keyFindings.map((text) => ({ text })),
    caveat: article.caveat,
    source: {
      title: article.source.title,
      authors: article.source.authors,
      journal: article.source.journal,
      year: article.source.year,
      type: article.source.type,
      doi: article.source.doi ?? undefined,
      url: article.source.url ?? undefined,
      pubmedId: article.source.pubmedId ?? undefined,
    },
    reviewNote: article.reviewNote ?? undefined,
    translations: en
      ? {
          en: {
            title: en.title ?? undefined,
            summary: en.summary ?? undefined,
            keyFindings: en.keyFindings?.map((text) => ({ text })),
            caveat: en.caveat ?? undefined,
            reviewNote: en.reviewNote ?? undefined,
            source: {
              type: en.source?.type ?? undefined,
              journal: en.source?.journal ?? undefined,
            },
          },
        }
      : undefined,
  }
}

async function main() {
  requireEnv("DATABASE_URI")
  requireEnv("PAYLOAD_SECRET")
  const updateExisting = process.argv.includes("--update")
  const payload = await getPayload({ config })
  const mock = new MockProductRepository()

  const [categories, products] = await Promise.all([
    mock.getAllCategories(),
    mock.getAllProducts(),
  ])

  // Payload's Postgres adapter uses numeric `serial` ids; relationship
  // fields validate against that id type, so category refs passed to
  // `payload.create` must stay numeric — a string id (`"1"`) fails
  // relationship validation with "The following field is invalid: Category".
  const categoryIds = new Map<string, number>()
  for (const category of categories) {
    const imageId = category.image
      ? await ensureMedia(payload, category.image, `${category.name} — ${category.translations?.en?.name ?? category.slug}`)
      : undefined
    const existing = await payload.find({
      collection: "categories",
      where: { slug: { equals: category.slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      const id = existing.docs[0].id as number
      categoryIds.set(category.slug, id)
      if (!updateExisting) {
        console.log(`category: ${category.slug} (exists, skipped)`)
        continue
      }
      await payload.update({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seed data is assembled dynamically; collection shapes are validated by Payload at runtime
        collection: "categories" as any,
        id,
        data: toCategoryData(category, imageId),
        overrideAccess: true,
      })
      console.log(`category: ${category.slug} (updated)`)
      continue
    }
    const created = await payload.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seed data is assembled dynamically; collection shapes are validated by Payload at runtime
      collection: "categories" as any,
      data: toCategoryData(category, imageId),
      overrideAccess: true,
    })
    categoryIds.set(category.slug, created.id as number)
    console.log(`category: ${category.slug} (created)`)
  }

  for (const product of products) {
    const alt = product.nameArabic ? `${product.name} — ${product.nameArabic}` : product.name
    const imageId = product.image ? await ensureMedia(payload, product.image, alt) : undefined
    const galleryIds = (
      await Promise.all((product.gallery ?? []).map((item) => ensureMedia(payload, item, alt)))
    ).filter((id): id is number => typeof id === "number")
    const existing = await payload.find({
      collection: "products",
      where: { slug: { equals: product.slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      if (!updateExisting) {
        console.log(`product: ${product.slug} (exists, skipped)`)
        continue
      }
      const updateCategoryId = categoryIds.get(product.categorySlug)
      if (!updateCategoryId)
        throw new Error(`No category id for ${product.slug} (category: ${product.categorySlug})`)
      await payload.update({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seed data is assembled dynamically; collection shapes are validated by Payload at runtime
        collection: "products" as any,
        id: String(existing.docs[0].id),
        data: toProductData(product, updateCategoryId, imageId, galleryIds),
        overrideAccess: true,
      })
      console.log(`product: ${product.slug} (updated)`)
      continue
    }
    const categoryId = categoryIds.get(product.categorySlug)
    if (!categoryId) throw new Error(`No category id for ${product.slug} (category: ${product.categorySlug})`)
    await payload.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
      collection: "products" as any,
      data: toProductData(product, categoryId, imageId, galleryIds),
      overrideAccess: true,
    })
    console.log(`product: ${product.slug} (created)`)
  }

  // Articles (المدونة). Seeded after products so the `product` relationship
  // can resolve by slug. Status is carried through verbatim: rows the client
  // has not approved stay `review`/`draft` and never reach the storefront.
  const productIds = new Map<string, number>()
  for (const product of products) {
    const found = await payload.find({
      collection: "products",
      where: { slug: { equals: product.slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs[0]) productIds.set(product.slug, found.docs[0].id as number)
  }
  for (const article of mockArticles) {
    const existing = await payload.find({
      collection: "articles",
      where: { slug: { equals: article.slug } },
      limit: 1,
      overrideAccess: true,
    })
    // An empty productSlug marks a topic-only article (published without a
    // product link) — those seed with no relationship instead of being skipped.
    const productId = article.productSlug ? productIds.get(article.productSlug) : undefined
    if (article.productSlug && !productId) {
      console.warn(`article: ${article.slug} (no product for slug ${article.productSlug}, skipped)`)
      continue
    }
    if (existing.docs[0]) {
      if (!updateExisting) {
        console.log(`article: ${article.slug} (exists, skipped)`)
        continue
      }
      await payload.update({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see note above
        collection: "articles" as any,
        id: existing.docs[0].id,
        data: toArticleData(article, productId),
        overrideAccess: true,
      })
      console.log(`article: ${article.slug} (updated, ${article.status})`)
      continue
    }
    await payload.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see note above
      collection: "articles" as any,
      data: toArticleData(article, productId),
      overrideAccess: true,
    })
    console.log(`article: ${article.slug} (created, ${article.status})`)
  }

  // Jobs (الوظائف). Empty by default: vacancies are published from the admin
  // so no role ever reaches the site that the client did not post. Kept here so
  // a preloaded posting would follow the same idempotent path as products and
  // articles.
  for (const job of mockJobs) {
    const existing = await payload.find({
      collection: "jobs",
      where: { slug: { equals: job.slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      if (!updateExisting) {
        console.log(`job: ${job.slug} (exists, skipped)`)
        continue
      }
      await payload.update({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see note above
        collection: "jobs" as any,
        id: existing.docs[0].id,
        data: toJobData(job),
        overrideAccess: true,
      })
      console.log(`job: ${job.slug} (updated, ${job.status})`)
      continue
    }
    await payload.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see note above
      collection: "jobs" as any,
      data: toJobData(job),
      overrideAccess: true,
    })
    console.log(`job: ${job.slug} (created, ${job.status})`)
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const existing = await payload.find({ collection: "users", limit: 1, overrideAccess: true })
    if (existing.docs[0]) {
      console.log("admin: users exist, skipped")
    } else {
      await payload.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
        collection: "users" as any,
        data: { email: adminEmail, password: adminPassword },
        overrideAccess: true,
      })
      console.log(`admin: ${adminEmail} (created)`)
    }
  } else {
    console.log("admin: SEED_ADMIN_EMAIL/PASSWORD not set, skipped")
  }

  await payload.db.destroy?.()
  const pool = (payload.db as { pool?: { end?: () => Promise<void> } }).pool
  // `payload.db.destroy()` only resets the adapter's references and does NOT
  // close the node-postgres pool. node-postgres' `pool.end()` can itself hang
  // while an in-flight client is checked out, so fire it best-effort WITHOUT
  // awaiting — the `process.exit(0)` at the end of the promise chain is the
  // hard guarantee the process terminates:
  //   • the pool's open TCP socket otherwise keeps the Node event loop alive
  //     (the original CI symptom: "seed complete" printed, step stuck
  //     in_progress for hours), and
  //   • `await pool.end()` would reintroduce a hang of its own.
  if (pool && typeof pool.end === "function") {
    void pool.end()
  }
  console.log("seed complete")
}

main()
  .then(() => {
    // Explicit exit — Payload/telemetry and the node-postgres pool leave open
    // handles behind, and `main()` resolving alone is not enough to end the
    // process under a CI runner.
    process.exit(0)
  })
  .catch((error) => {
    console.error("seed failed:", error instanceof Error ? error.message : error)
    process.exit(1)
  })
