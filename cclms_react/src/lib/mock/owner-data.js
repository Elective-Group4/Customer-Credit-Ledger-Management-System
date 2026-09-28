const STORE_ID = "mock-store"

let products = []
let customers = []
let creditEntries = []
let payments = []
let nextCustomerNumber = 123

function createId(prefix) {
  const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
  return `${prefix}-${value}`
}

function getCustomerBalance(customerId) {
  const credits = creditEntries
    .filter((entry) => entry.customerId === customerId)
    .reduce((total, entry) => total + entry.totalAmount, 0)
  const paid = payments
    .filter((payment) => payment.customerId === customerId)
    .reduce((total, payment) => total + payment.amount, 0)
  return Math.max(0, credits - paid)
}

function withCustomerBalance(customer) {
  return { ...customer, balance: getCustomerBalance(customer.id) }
}

function createCustomerCode() {
  const code = `CUST-${String(nextCustomerNumber).padStart(6, "0")}`
  nextCustomerNumber += 1
  return code
}

export const mockOwnerData = {
  getProducts: async () => products.map((product) => ({ ...product })),
  createProduct: async (input) => {
    if (products.some((product) => product.idCode.toLowerCase() === input.idCode.toLowerCase())) {
      throw new Error("A product with this ID code already exists.")
    }
    const product = { ...input, id: createId("product"), storeId: STORE_ID, status: "active" }
    products = [...products, product]
    return { ...product }
  },
  updateProduct: async (id, input) => {
    if (products.some((product) => product.id !== id && product.idCode.toLowerCase() === input.idCode.toLowerCase())) {
      throw new Error("A product with this ID code already exists.")
    }
    products = products.map((product) => product.id === id ? { ...product, ...input } : product)
    return products.find((product) => product.id === id)
  },
  deleteProduct: async (id) => {
    products = products.filter((product) => product.id !== id)
  },
  toggleProductStatus: async (id) => {
    products = products.map((product) => product.id === id
      ? { ...product, status: product.status === "active" ? "inactive" : "active" }
      : product)
    return products.find((product) => product.id === id)
  },
  getCustomers: async () => customers.map(withCustomerBalance),
  getNextCustomerCode: async () => createCustomerCode(),
  createCustomer: async (input) => {
    const customerCode = input.customerCode || createCustomerCode()
    if (customers.some((customer) => customer.customerCode === customerCode)) {
      throw new Error("A customer with this ID already exists.")
    }
    const customer = { ...input, customerCode, id: createId("customer"), storeId: STORE_ID, status: "active" }
    customers = [...customers, customer]
    return withCustomerBalance(customer)
  },
  updateCustomer: async (id, input) => {
    if (customers.some((customer) => customer.id !== id && customer.customerCode === input.customerCode)) {
      throw new Error("A customer with this ID already exists.")
    }
    customers = customers.map((customer) => customer.id === id ? { ...customer, ...input } : customer)
    return withCustomerBalance(customers.find((customer) => customer.id === id))
  },
  deleteCustomer: async (id) => {
    customers = customers.filter((customer) => customer.id !== id)
  },
  getCredits: async () => creditEntries.map((entry) => ({ ...entry, items: entry.items.map((item) => ({ ...item })) })),
  createCredit: async ({ customerId, productId, quantity, dueDate }) => {
    const customer = customers.find((item) => item.id === customerId)
    const product = products.find((item) => item.id === productId)
    if (!customer || !product) throw new Error("Customer or product was not found.")
    const item = {
      id: createId("credit-item"),
      productId,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      subtotal: product.price * quantity,
    }
    const entry = {
      id: createId("credit"),
      storeId: STORE_ID,
      customerId,
      customerName: customer.name,
      items: [item],
      totalAmount: item.subtotal,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || null,
    }
    creditEntries = [...creditEntries, entry]
    return { ...entry }
  },
  createPayment: async ({ customerId, amount, paymentType }) => {
    const payment = { id: createId("payment"), storeId: STORE_ID, customerId, amount, paymentType, createdAt: new Date().toISOString() }
    payments = [...payments, payment]
    return { ...payment }
  },
  getPayments: async () => payments.map((payment) => ({ ...payment })),
  getDashboard: async () => {
    const customerRows = customers.map(withCustomerBalance)
    const now = new Date()
    const customersDueThisMonth = new Set(
      creditEntries
        .filter((entry) => {
          if (!entry.dueDate) return false
          const dueDate = new Date(`${entry.dueDate}T00:00:00`)
          return dueDate.getFullYear() === now.getFullYear() &&
            dueDate.getMonth() === now.getMonth() &&
            getCustomerBalance(entry.customerId) > 0
        })
        .map((entry) => entry.customerId)
    ).size

    const monthlyCredit = creditEntries.reduce((months, entry) => {
      const month = entry.createdAt.slice(0, 7)
      const current = months.get(month) || { month, credit: 0, payments: 0 }
      current.credit += entry.totalAmount
      months.set(month, current)
      return months
    }, new Map())

    payments.forEach((payment) => {
      const month = payment.createdAt.slice(0, 7)
      const current = monthlyCredit.get(month) || { month, credit: 0, payments: 0 }
      current.payments += payment.amount
      monthlyCredit.set(month, current)
    })

    return {
      totals: {
        totalCustomers: customerRows.length,
        overallBalance: customerRows.reduce((total, customer) => total + customer.balance, 0),
        activeCustomers: customerRows.filter((customer) => customer.status === "active").length,
        customersDueThisMonth,
      },
      ranking: customerRows
        .filter((customer) => customer.balance > 0)
        .sort((first, second) => second.balance - first.balance),
      monthlyCredit: Array.from(monthlyCredit.values()).sort((first, second) => first.month.localeCompare(second.month)),
    }
  },
  getTransactions: async () => creditEntries.map((entry) => ({
    id: entry.id,
    customerId: entry.customerId,
    customerName: entry.customerName,
    products: entry.items.map((item) => item.productName).join(", "),
    createdAt: entry.createdAt,
  })),
  getStoreId: () => STORE_ID,
}

export function calculateCustomerBalance(customerId) {
  return getCustomerBalance(customerId)
}
