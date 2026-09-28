import { useEffect, useState } from "react"
import { ownerApi } from "@/lib/api/owner"

export function useOwnerCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function refresh() {
    setLoading(true)
    setError("")
    try {
      setCustomers(await ownerApi.listCustomers())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load customers.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(refresh)
  }, [])

  return { customers, loading, error, refresh }
}
