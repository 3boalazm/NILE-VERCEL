import { NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

/**
 * F-77 — One-time online seed endpoint (no local terminal required).
 *
 * Trigger online with:
 *   curl -H "x-seed-key: YOUR_SEED_KEY" https://<vercel-host>/api/seed
 *
 * Protects with SEED_KEY (set in Vercel Environment Variables, never in .env)
 * to prevent accidental or malicious seed runs in production.
 */
export async function GET(request: Request) {
  const seedKey = process.env.SEED_KEY
  const headerKey = request.headers.get("x-seed-key")

  if (!seedKey) {
    return NextResponse.json(
      { error: "SEED_KEY not configured in environment variables." },
      { status: 500 }
    )
  }

  if (headerKey !== seedKey) {
    return NextResponse.json(
      { error: "Invalid or missing x-seed-key header." },
      { status: 403 }
    )
  }

  return new Promise((resolve) => {
    const scriptPath = path.resolve(process.cwd(), "scripts", "run-seed.mjs")
    const child = spawn("node", [scriptPath], {
      env: { ...process.env },
      stdio: ["inherit", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString()
      console.log("[seed]", chunk.toString().trim())
    })

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString()
      console.error("[seed]", chunk.toString().trim())
    })

    child.on("close", (code) => {
      resolve(
        NextResponse.json(
          {
            status: code === 0 ? "success" : "failed",
            exitCode: code,
            stdout: stdout.slice(-2000), // keep response small
            stderr: stderr.slice(-1000),
          },
          { status: code === 0 ? 200 : 500 }
        )
      )
    })
  })
}
