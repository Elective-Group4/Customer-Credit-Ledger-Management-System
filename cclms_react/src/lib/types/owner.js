/**
 * @typedef {'active'|'inactive'} OwnerStatus
 * @typedef {'full'|'partial'} PaymentType
 *
 * @typedef {Object} OwnerProduct
 * @property {string} id
 * @property {string} storeId
 * @property {string} idCode
 * @property {string} name
 * @property {number} price
 * @property {OwnerStatus} status
 *
 * @typedef {Object} OwnerCustomer
 * @property {string} id
 * @property {string} storeId
 * @property {string} customerCode
 * @property {string} name
 * @property {string} phoneNumber
 * @property {string} address
 * @property {OwnerStatus} status
 * @property {number} balance
 *
 * @typedef {Object} CreditItem
 * @property {string} id
 * @property {string} productId
 * @property {string} productName
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} subtotal
 *
 * @typedef {Object} CreditEntry
 * @property {string} id
 * @property {string} storeId
 * @property {string} customerId
 * @property {string} customerName
 * @property {CreditItem[]} items
 * @property {number} totalAmount
 * @property {string} createdAt
 * @property {string|null} dueDate
 *
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} storeId
 * @property {string} customerId
 * @property {number} amount
 * @property {PaymentType} paymentType
 * @property {string} createdAt
 *
 * @typedef {Object} DashboardTotals
 * @property {number} totalCustomers
 * @property {number} overallBalance
 * @property {number} activeCustomers
 * @property {number} customersDueThisMonth
 */
export {}
