import type { MetadataRoute } from "next"

import { buildRobots } from "@/lib/seo/robots-policy"

export default function robots(): MetadataRoute.Robots {
  return buildRobots()
}
