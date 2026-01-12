// apps/storefront/lib/api/products.ts

import { Product } from '@/types/storefront';
import { gql } from 'graphql-request';

// GraphQL query to fetch rich product data from Vendure
const GET_RICH_PRODUCTS = gql`
  query GetRichProducts($limit: Int, $offset: Int) {
    products(first: $limit, skip: $offset) {
      id
      name
      slug
      description
      variants {
        id
        sku
        price
        salePrice
        stock
        attributes {
          name
          value
        }
      }
      assets {
        id
        url
        alt
      }
      collections {
        id
        name
        slug
      }
    }
  }
`;

// Function to fetch products from Vendure Shop API
export async function GetRichProducts(limit = 8, offset = 0): Promise<Product[]> {
  const endpoint = process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL;
  if (!endpoint) {
    throw new Error('NEXT_PUBLIC_VENDURE_SHOP_API_URL is not defined');
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_RICH_PRODUCTS,
        variables: { limit, offset },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data } = await response.json();

    // Transform Vendure response to our clean Product[] type
    return data.products.map((product: any): Product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: 0, // Root price can be derived or set to 0 if not on main object
      salePrice: null,
      images: (product.assets || []).map((asset: any) => ({
        url: asset.url,
        alt: asset.alt || '',
      })),
      variants: (product.variants || []).map((variant: any) => ({
        id: variant.id,
        sku: variant.sku || '',
        price: variant.price || 0,
        salePrice: variant.salePrice || null,
        stock: variant.stock || 0,
        attributes: (variant.attributes || []).map((attr: any) => ({
          name: attr.name,
          value: attr.value,
        })),
      })),
      categories: (product.collections || []).map((collection: any) => ({
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
      })),
      reviews: [],
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}