import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTenantBySlug } from "@/lib/manager-client";
import { getProducts } from "@/lib/vendure-client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { AddToCartBtn } from "@/components/products/add-to-cart-btn";
export default async function StoreHomePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;

  // 1. Get Tenant Details (for Token)
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return null;

  // 2. Fetch Real Products from Vendure
  const products = await getProducts(tenant.vendureChannelToken || '');

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-sm border border-gray-100">
        <Badge variant="secondary" className="mb-4">New Arrival</Badge>
        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-gray-900">
          Welcome to <span className="text-primary">{tenant.name}</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover our amazing collection of premium products.
          Quality meets affordability in one place.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" className="rounded-full px-8">Shop Now</Button>
          <Button size="lg" variant="outline" className="rounded-full px-8">View Collections</Button>
        </div>
      </section>

      {/* Product Grid */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Featured Products</h2>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden group">
                <Link href={`/${slug}/products/${product.slug}`} className="block">
                  <CardHeader className="p-0 aspect-square relative bg-gray-100">
                    {product.featuredAsset ? (
                      <Image
                        src={product.featuredAsset.preview}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                    )}
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg leading-tight mb-2 truncate group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  </CardContent>
                </Link>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <span className="font-bold text-primary">
                    {(() => {
                      const variant = product.variants[0];
                      const price = variant?.priceWithTax || variant?.price || 0;
                      if (price > 0) {
                        return `${(price / 100).toFixed(2)} ${variant?.currencyCode || 'USD'}`;
                      }
                      return 'Price TBD';
                    })()}
                  </span>
                  <AddToCartBtn
                    tenantSlug={slug}
                    product={{
                      id: product.id,
                      variantId: product.variants[0]?.id || product.id,
                      name: product.name,
                      price: product.variants[0]?.priceWithTax || product.variants[0]?.price || 0,
                      currencyCode: product.variants[0]?.currencyCode || 'USD',
                      slug: product.slug,
                      image: product.featuredAsset?.preview
                    }}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
            <p className="text-gray-500 mb-2">No products found in this store.</p>
            <p className="text-xs text-gray-400">Go to Admin Dashboard to add products.</p>
          </div>
        )}

      </section>
    </div>
  );
}
