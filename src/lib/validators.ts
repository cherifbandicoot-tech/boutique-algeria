import { z } from 'zod';

export const algerianPhoneRegex = /^(05|06|07)[0-9]{8}$/;

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(3, 'Name is too short').max(80),
  customerPhone: z
    .string()
    .trim()
    .regex(algerianPhoneRegex, 'Invalid Algerian phone number (must start with 05, 06, or 07 and be 10 digits)'),
  wilayaCode: z.number().int().min(1).max(58),
  commune: z.string().trim().min(2).max(80),
  address: z.string().trim().max(200).optional(),
  deliveryType: z.enum(['HOME', 'DESK']),
  paymentMethod: z.enum(['COD', 'CIB_EDAHABIA']).default('COD'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        title: z.string().min(1),
        size: z.string().min(1).max(15),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1, 'Cart cannot be empty'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;