export const useWebVitals = () => {
  if (import.meta.client) {
    const report = (name: string, value: number) => {
      console.debug(`[Web Vitals] ${name}:`, value)
    }

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          report("LCP", lastEntry.startTime)
        }
      })
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })
    } catch {
      // LCP not supported
    }

    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value || 0
          }
        }
        report("CLS", clsValue)
      })
      clsObserver.observe({ type: "layout-shift", buffered: true })
    } catch {
      // CLS not supported
    }

    try {
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const eventEntry = entry as any
          if (eventEntry.processingStart && eventEntry.startTime) {
            report("INP", eventEntry.processingStart - eventEntry.startTime)
          }
        }
      })
      inpObserver.observe({ type: "first-input", buffered: true })
    } catch {
      // INP not supported
    }
  }
}
