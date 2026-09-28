import { mockOwnerData } from "@/lib/mock/owner-data"

// This adapter is the only UI-facing data boundary. Replace mockOwnerData calls with Supabase queries later.
/**
 * @typedef {Object} ProductInput
 * @property {string} name
 * @property {string} idCode
 * @property {number} price
 *
 * @typedef {Object} CustomerInput
 * @property {string} customerCode
 * @property {string} name
 * @property {string} phoneNumber
 * @property {string} address
 *
 * @typedef {Object} CreditInput
 * @property {string} customerId
 * @property {string} productId
 * @property {number} quantity
 * @property {string|undefined} dueDate
 *
 * @typedef {Object} PaymentInput
 * @property {string} customerId
 * @property {number} amount
 * @property {'full'|'partial'} paymentType
 */

/**
 * @typedef {Object} OwnerApi
 * @property {() => Promise<import("@/lib/types/owner").OwnerProduct[]>} listProducts
 * @property {(input: ProductInput) => Promise<import("@/lib/types/owner").OwnerProduct>} createProduct
 * @property {(id: string, input: ProductInput) => Promise<import("@/lib/types/owner").OwnerProduct>} updateProduct
 * @property {(id: string) => Promise<void>} deleteProduct
 * @property {(id: string) => Promise<import("@/lib/types/owner").OwnerProduct>} toggleProductStatus
 * @property {() => Promise<import("@/lib/types/owner").OwnerCustomer[]>} listCustomers
 * @property {() => Promise<string>} nextCustomerCode
 * @property {(input: CustomerInput) => Promise<import("@/lib/types/owner").OwnerCustomer>} createCustomer
 * @property {(id: string, input: CustomerInput) => Promise<import("@/lib/types/owner").OwnerCustomer>} updateCustomer
 * @property {(id: string) => Promise<void>} deleteCustomer
 * @property {() => Promise<import("@/lib/types/owner").CreditEntry[]>} listCredits
 * @property {(input: CreditInput) => Promise<import("@/lib/types/owner").CreditEntry>} createCredit
 * @property {(input: PaymentInput) => Promise<import("@/lib/types/owner").Payment>} createPayment
 * @property {() => Promise<import("@/lib/types/owner").Payment[]>} listPayments
 * @property {() => Promise<Object>} getDashboard
 * @property {() => Promise<Object[]>} listTransactions
 */

/** @type {OwnerApi} */
export const ownerApi = {
  listProducts: () => mockOwnerData.getProducts(),
  createProduct: (input) => mockOwnerData.createProduct(input),
  updateProduct: (id, input) => mockOwnerData.updateProduct(id, input),
  deleteProduct: (id) => mockOwnerData.deleteProduct(id),
  toggleProductStatus: (id) => mockOwnerData.toggleProductStatus(id),
  listCustomers: () => mockOwnerData.getCustomers(),
  nextCustomerCode: () => mockOwnerData.getNextCustomerCode(),
  createCustomer: (input) => mockOwnerData.createCustomer(input),
  updateCustomer: (id, input) => mockOwnerData.updateCustomer(id, input),
  deleteCustomer: (id) => mockOwnerData.deleteCustomer(id),
  listCredits: () => mockOwnerData.getCredits(),
  createCredit: (input) => mockOwnerData.createCredit(input),
  createPayment: (input) => mockOwnerData.createPayment(input),
  listPayments: () => mockOwnerData.getPayments(),
  getDashboard: () => mockOwnerData.getDashboard(),
  listTransactions: () => mockOwnerData.getTransactions(),
}
