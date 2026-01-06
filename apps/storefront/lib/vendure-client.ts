import { GraphQLClient } from 'graphql-request';

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || 'http://127.0.0.1:3001/shop-api'; // Vendure API

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  featuredAsset?: {
    preview: string;
  };
  variants: Array<{
    id: string;
    price: number;
    currencyCode: string;
    name?: string;
  }>;
}

const GET_PRODUCTS_QUERY = `
  query GetProducts {
    products(options: { take: 10 }) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          preview
        }
        variants {
          id
          price
          currencyCode
        }
      }
      totalItems
    }
  }
`;

const GET_PRODUCT_BY_SLUG_QUERY = `
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      featuredAsset {
        preview
      }
      variants {
        id
        name
        price
        currencyCode
      }
    }
  }
`;

export async function getProducts(channelToken: string): Promise<Product[]> {
  if (!channelToken) {
    console.error("❌ No channel token provided!");
    return [];
  }

  const client = new GraphQLClient(VENDURE_API, {
    headers: {
      'vendure-token': channelToken,
    },
  });

  console.log(`🛒 Fetching products from Vendure (Token: ${channelToken.substring(0, 5)}...)`);

  try {
    const data: any = await client.request(GET_PRODUCTS_QUERY);
    return data.products.items;
  } catch (error) {
    console.error("❌ Failed to fetch products:", error);
    return [];
  }
}

export async function getProductBySlug(channelToken: string, slug: string): Promise<Product | null> {
  if (!channelToken) return null;

  const client = new GraphQLClient(VENDURE_API, {
    headers: { 'vendure-token': channelToken },
  });

  try {
    const data: any = await client.request(GET_PRODUCT_BY_SLUG_QUERY, { slug });
    return data.product;
  } catch (error) {
    console.error(`❌ Failed to fetch product ${slug}:`, error);
    return null;
  }
}
