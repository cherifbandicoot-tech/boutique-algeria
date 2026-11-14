import { z } from 'zod';

export const algerianPhoneRegex = /^(05|06|07)[0-9]{8}$/;

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(3, 'Nom trop court (min 3 caractères)').max(60),
  customerPhone: z
    .string()
    .trim()
    .regex(algerianPhoneRegex, 'Numéro invalide (doit commencer par 05, 06 ou 07 et contenir 10 chiffres)'),
  wilayaCode: z.number().int().min(1).max(58),
  commune: z.string().trim().min(2, 'Commune requise').max(50),
  stopdeskCode: z.string().trim().max(10).optional(),
  stopdeskName: z.string().trim().max(100).optional(),
  address: z.string().trim().max(100).optional(),
  deliveryType: z.enum(['HOME', 'DESK']),
  paymentMethod: z.enum(['COD', 'CIB_EDAHABIA']).default('COD'),
  promoCode: z.string().trim().max(40).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        title: z.string().min(1),
        size: z.string().min(1).max(20),
        colorName: z.string().max(40).optional(),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1, 'Votre panier est vide'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;