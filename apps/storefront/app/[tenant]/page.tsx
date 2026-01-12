import { Product } from '@/types/storefront'; // FIXED IMPORT
import { GridContainer } from '@/components/ui/grid-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // ADDED MISSING IMPORT
import Image from 'next/image';
import Link from 'next/link';
import { GetRichProducts } from '@/lib/api/products';

export default async function HomePage() {
  const products = await GetRichProducts();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <CardHeader className="p-6">
          <CardTitle className="text-2xl font-bold">Welcome to Apex Store</CardTitle>
          <p className="text-lg opacity-90">Discover premium products for every lifestyle.</p>
          <div className="mt-4 space-x-2">
            <Link href="/shop">
              <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Browse All Products
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Featured Products */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Featured Products</h2>
        </div>
        <GridContainer cols={4} gap={4}>
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="relative mb-4 h-48 rounded-lg overflow-hidden">
                  <Image
                    src={product.images[0]?.url || '/placeholder.jpg'}
                    alt={product.images[0]?.alt || product.name}
                    width={300}
                    height={300}
                    className="object-cover w-full h-full"
                  />
                  {product.salePrice && (
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white">Sale</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold">
                    {product.salePrice ? `$${product.salePrice.toFixed(2)}` : `$${product.price.toFixed(2)}`}
                  </span>
                </div>
                <Link href={`/product/${product.slug}`} className="mt-3 block">
                  <Button variant="outline" className="w-full mt-2">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </GridContainer>
      </div>
    </div>
  );
}