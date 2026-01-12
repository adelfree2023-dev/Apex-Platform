import { Product } from '@/types/storefront';
import { gql } from 'graphql-request';

// GraphQL query to fetch rich product data from Vendure
const GET_RICH_PRODUCTS = gql`
  query GetRichProducts($limit: Int, $offset: Int) {
    products(options: { take: $limit, skip: $offset }) {
      items {
        id
        name
        slug
        description
        variants {
          id
          sku
          price
          priceWithTax
          stockLevel
        }
        featuredAsset {
           id
           preview
       }
       assets {
         id
         preview
       }
       collections {
        id
        name
        slug
      }
      }
      totalItems
    }
  }
`;

// Function to fetch products from Vendure Shop API
export async function GetRichProducts(limit = 8, offset = 0): Promise<Product[]> {
    const endpoint = process.env.NEXT_PUBLIC_VENDURE_API_URL;
    if (!endpoint) {
        throw new Error('NEXT_PUBLIC_VENDURE_API_URL is not defined');
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
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data } = await response.json();

        // Transform Vendure response to our clean Product[] type
        return data.products.items.map((product: any): Product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            images: product.assets ? product.assets.map((asset: any) => ({
                url: asset.preview,
                alt: product.name || '',
            })) : (product.featuredAsset ? [{ url: product.featuredAsset.preview, alt: product.name }] : []),
            variants: product.variants.map((variant: any) => ({
                id: variant.id,
                sku: variant.sku,
                price: variant.price,
                salePrice: variant.priceWithTax, // Using tax price as sale price for now
                stock: variant.stockLevel === 'IN_STOCK' ? 100 : 0, // Simplified stock
                attributes: [] // Vendure variants structured differently, skipping attributes for now
            })),
            categories: product.collections ? product.collections.map((collection: any) => ({
                id: collection.id,
                name: collection.name,
                slug: collection.slug,
            })) : [],
            reviews: [],
            price: product.variants[0]?.price || 0,
            salePrice: product.variants[0]?.priceWithTax || null
        }));
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}
