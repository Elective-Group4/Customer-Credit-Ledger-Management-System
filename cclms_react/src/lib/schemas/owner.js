import { z } from "zod"

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  idCode: z.string().trim().min(1, "ID code is required."),
  price: z.coerce.number().positive("Price must be greater than zero."),
})

export const customerSchema = z.object({
  customerCode: z.string().trim().min(1),
  name: z.string().trim().min(1, "Customer name is required."),
  phoneNumber: z.string().trim().min(1, "Phone number is required."),
  address: z.string().trim().min(1, "Address is required."),
})

export const creditSchema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  productId: z.string().min(1, "Choose a product."),
  quantity: z.coerce.number().int().positive("Quantity must be greater than zero."),
  dueDate: z.string().optional(),
})

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Payment must be greater than zero."),
})
