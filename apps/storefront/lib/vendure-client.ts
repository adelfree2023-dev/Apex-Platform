
import { GraphQLClient } from 'graphql-request';

const VENDURE_API_URL = process.env.NEXT_PUBLIC_VENDURE_URL || 'http://localhost:3001/shop-api';

export const vendureClient = new GraphQLClient(VENDURE_API_URL, {
    headers: {
        'vendure-token': 'default', // Default Channel Token
    },
});

export async function getProducts(take = 10, skip = 0) {
    const query = `
    query GetProducts($take: Int, $skip: Int) {
      products(options: { take: $take, skip: $skip }) {
        items {
          id
          name
          slug
          description
          featuredAsset {
            preview
          }
          variants {
            price
            currencyCode
          }
        }
        totalItems
      }
    }
  `;
    try {
        const data: any = await vendureClient.request(query, { take, skip });
        return data.products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return { items: [], totalItems: 0 };
    }
}

export async function getProductBySlug(slug: string) {
    const query = `
    query GetProduct($slug: String!) {
      product(slug: $slug) {
        id
        name
        slug
        description
        featuredAsset {
          preview
        }
        assets {
          preview
        }
        variants {
          id
          price
          currencyCode
          sku
        }
      }
    }
  `;
    try {
        const data: any = await vendureClient.request(query, { slug });
        return data.product;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

export async function searchProducts(term: string) {
    const query = `
    query Search($term: String!) {
      search(input: { term: $term, groupByProduct: true }) {
        items {
          productId
          productName
          slug
          price {
            ... on PriceRange {
              min
            }
          }
          productAsset {
            preview
          }
        }
      }
    }
  `;
    try {
        const data: any = await vendureClient.request(query, { term });
        return data.search;
    } catch (error) {
        console.error('Search error:', error);
        return { items: [] };
    }
}
