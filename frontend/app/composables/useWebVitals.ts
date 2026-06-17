export const useWebVitals = () => {
  if (import.meta.client) {
    const send = (name: string, value: number) => {
      console.debug(`[Web Vitals] ${name}:`, value)
      try {
        fetch("/api/web-vitals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, value, path: location.pathname }),
        })
      } catch {}
    }

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) send("LCP", lastEntry.startTime)
      })
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })
    } catch {}

    try {
      let clsValue = 0
      let lastPath = location.pathname
      const clsObserver = new PerformanceObserver((list) => {
        const currentPath = location.pathname
        if (currentPath !== lastPath) {
          clsValue = 0
          lastPath = currentPath
        }
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value || 0
          }
        }
        send("CLS", clsValue)
      })
      clsObserver.observe({ type: "layout-shift", buffered: true })
    } catch {}

    try {
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as any
          if (e.processingStart && e.startTime) {
            send("INP", e.processingStart - e.startTime)
          }
        }
      })
      inpObserver.observe({ type: "first-input", buffered: true })
    } catch {}
  }
}
