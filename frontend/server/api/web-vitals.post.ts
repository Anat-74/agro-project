import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; value: number; path: string }>(event)
  const dirPath = join(process.cwd(), "server/data")
  const filePath = join(dirPath, "web-vitals.json")

  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }

  let data: { metrics: any[] } = { metrics: [] }
  if (existsSync(filePath)) {
    try {
      data = JSON.parse(readFileSync(filePath, "utf-8"))
    } catch {}
  }

  data.metrics.push({
    ...body,
    timestamp: new Date().toISOString(),
  })

  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
  return { ok: true }
})
