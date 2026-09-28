import { useEffect, useState } from "react"
import { ownerApi } from "@/lib/api/owner"

export function useOwnerProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function refresh() {
    setLoading(true)
    setError("")
    try {
      setProducts(await ownerApi.listProducts())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load products.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(refresh)
  }, [])

  return { products, loading, error, refresh }
}
