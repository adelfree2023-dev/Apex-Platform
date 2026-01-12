// apps/storefront/types/storefront.d.ts

import { z } from 'zod';

// Type inference from Zod schemas
export type HomepageContent = z.infer<typeof import('../lib/schemas').HomepageContentSchema>;
export type ProductFilter = z.infer<typeof import('../lib/schemas').ProductFilterSchema>;
export type CartUpdate = z.infer<typeof import('../lib/schemas').CartUpdateSchema>;
export type CheckoutForm = z.infer<typeof import('../lib/schemas').CheckoutFormSchema>;

// Vendure GraphQL response types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  images: Array<{
    url: string;
    alt: string;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    price: number;
    salePrice: number | null;
    stock: number;
    attributes: Array<{
      name: string;
      value: string;
    }>;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  reviews: Array<{
    rating: number;
    comment: string;
    customerName: string;
    createdAt: string;
  }>;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  salePrice: number | null;
  quantity: number;
  image: string;
  attributes: Array<{
    name: string;
    value: string;
  }>;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  products: Product[];
  count: number;
}