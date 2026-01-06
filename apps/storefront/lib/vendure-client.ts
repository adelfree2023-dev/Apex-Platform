const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || 'http://127.0.0.1:3001/shop-api';

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
    sku?: string;
    price: number;
    priceWithTax: number;
    currencyCode: string;
    name?: string;
  }>;
}

const GET_PRODUCTS_QUERY = `
  query GetProducts {
    products(options: { take: 50 }) {
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
          sku
          price
          priceWithTax
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
        sku
        name
        price
        priceWithTax
        currencyCode
      }
    }
  }
`;

// 🔥 Using native fetch with NO CACHE to ensure fresh data from Vendure
export async function getProducts(channelToken: string): Promise<Product[]> {
  if (!channelToken) {
    console.error("❌ No channel token provided!");
    return [];
  }

  console.log(`🛒 Fetching products from Vendure (Token: ${channelToken.substring(0, 5)}...)`);

  try {
    const response = await fetch(VENDURE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': channelToken,
      },
      body: JSON.stringify({ query: GET_PRODUCTS_QUERY }),
      cache: 'no-store', // 🔥 CRITICAL: Disable caching for real-time data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data?.products?.items || [];
  } catch (error) {
    console.error("❌ Failed to fetch products:", error);
    return [];
  }
}

// 🔥 Using native fetch with NO CACHE for product details
export async function getProductBySlug(channelToken: string, slug: string): Promise<Product | null> {
  if (!channelToken) return null;

  try {
    const response = await fetch(VENDURE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'vendure-token': channelToken,
      },
      body: JSON.stringify({
        query: GET_PRODUCT_BY_SLUG_QUERY,
        variables: { slug },
      }),
      cache: 'no-store', // 🔥 CRITICAL: No caching
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data?.product || null;
  } catch (error) {
    console.error(`❌ Failed to fetch product ${slug}:`, error);
    return null;
  }
}
