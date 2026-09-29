import { useEffect, useState } from "react"
import { ownerApi } from "@/lib/api/owner"

export function useOwnerCredits() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [credits, setCredits] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function refresh() {
    setLoading(true)
    setError("")
    try {
      const [customerRows, productRows, creditRows, paymentRows] = await Promise.all([
        ownerApi.listCustomers(),
        ownerApi.listProducts(),
        ownerApi.listCredits(),
        ownerApi.listPayments(),
      ])
      setCustomers(customerRows)
      setProducts(productRows)
      setCredits(creditRows)
      setPayments(paymentRows)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load credit data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(refresh)
  }, [])

  return { customers, products, credits, payments, loading, error, refresh }
}
