let clientIpPromise

export function getClientIp() {
  if (!clientIpPromise) {
    clientIpPromise = fetch("https://api.ipify.org?format=json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to determine client IP address")
        }

        return response.json()
      })
      .then(({ ip }) => ip || null)
      .catch((error) => {
        console.error("Client IP lookup error:", error)
        return null
      })
  }

  return clientIpPromise
}