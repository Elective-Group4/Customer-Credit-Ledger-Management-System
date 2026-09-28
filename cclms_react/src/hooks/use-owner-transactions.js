import { useEffect, useState } from "react"
import { ownerApi } from "@/lib/api/owner"

export function useOwnerTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function refresh() {
    setLoading(true)
    setError("")
    try {
      setTransactions(await ownerApi.listTransactions())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load transactions.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(refresh)
  }, [])

  return { transactions, loading, error, refresh }
}
