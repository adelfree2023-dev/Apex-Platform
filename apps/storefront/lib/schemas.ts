// apps/storefront/lib/schemas.ts

import { z } from 'zod';

export const HomepageContentSchema = z.object({
  heroTitle: z.string().min(1, 'Hero title is required'),
  heroSubtitle: z.string().min(1, 'Hero subtitle is required'),
  heroCtaText: z.string().min(1, 'CTA text is required'),
  heroCtaUrl: z.string().url('Must be a valid URL'),
  features: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      icon: z.string().url('Icon must be a valid URL'),
    })
  ),
  testimonials: z.array(
    z.object({
      quote: z.string().min(1),
      author: z.string().min(1),
      company: z.string().min(1),
      avatarUrl: z.string().url('Avatar must be a valid URL'),
    })
  ),
});

export const ProductFilterSchema = z.object({
  category: z.string().optional(),
  priceRange: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    })
    .optional(),
  brand: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'best_selling']).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const CartUpdateSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const CheckoutFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  shippingAddress: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  paymentMethod: z.enum(['card', 'paypal', 'cod']),
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
  expDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/i, 'Expiration date must be MM/YY'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
  billingAddressSameAsShipping: z.boolean().optional(),
  orderNotes: z.string().optional(),
});