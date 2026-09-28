import { useEffect, useState } from "react"
import { ownerApi } from "@/lib/api/owner"

export function useOwnerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function refresh() {
    setLoading(true)
    setError("")
    try {
      setData(await ownerApi.getDashboard())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(refresh)
  }, [])

  return { data, loading, error, refresh }
}
