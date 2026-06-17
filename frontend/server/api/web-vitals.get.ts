import { readFileSync, existsSync } from "fs"
import { join } from "path"

export default defineEventHandler(() => {
  const filePath = join(process.cwd(), "server/data/web-vitals.json")
  if (!existsSync(filePath)) return { metrics: [] }
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"))
  } catch {
    return { metrics: [] }
  }
})
