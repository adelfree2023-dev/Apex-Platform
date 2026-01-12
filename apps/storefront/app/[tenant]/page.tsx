import { Product } from '@/types/storefront';
import GridContainer from '@/components/ui/grid-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { GetRichProducts } from '@/lib/api/products'; // Real GraphQL query

// Apply Square UI - LNFiles pattern: Dashboard-style homepage with cards and grid
export default async function HomePage() {
  // Fetch real data using the actual GraphQL query
  const products = await GetRichProducts();

  return (
    <div className="space-y-8">
      {/* Hero Section - Compact card-based hero (Square UI style) */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg border-none">
        <CardHeader className="p-8 md:p-12">
          <CardTitle className="text-3xl font-bold mb-2">Welcome to Apex Store</CardTitle>
          <p className="text-lg opacity-90 mb-6">Discover premium products for every lifestyle.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/shop">
              <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6">
                Browse All Products
              </Button>
            </Link>
            <Link href="/deals">
              <Button variant="outline" className="border-white text-white hover:bg-white/20 hover:text-white px-6">
                View Deals
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Featured Products Grid - Square UI - LNFiles grid pattern */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Featured Products</h2>
          <Link href="/shop?category=featured" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
            View All →
          </Link>
        </div>

        {products.length > 0 ? (
          <GridContainer cols={4} gap={6}>
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-gray-200">
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {product.images?.[0]?.url ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No Image
                      </div>
                    )}
                    {product.salePrice && product.price > product.salePrice && (
                      <Badge className="absolute top-2 left-2 bg-red-600 text-white shadow-sm">Sale</Badge>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-gray-900">
                          {product.salePrice ? `$${(product.salePrice / 100).toFixed(2)}` : `$${(product.price / 100).toFixed(2)}`}
                        </span>
                        {product.salePrice && product.price > product.salePrice && (
                          <span className="text-xs text-gray-500 line-through">
                            ${(product.price / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="rounded-full hover:bg-black hover:text-white transition-colors">
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </GridContainer>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 text-lg">No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
