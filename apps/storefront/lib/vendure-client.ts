import { GraphQLClient } from 'graphql-request';

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_URL || 'http://127.0.0.1:3000/shop-api';

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    featuredAsset?: {
        preview: string;
    };
    variants: Array<{
        price: number;
        currencyCode: string;
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
          price
          currencyCode
        }
      }
      totalItems
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
