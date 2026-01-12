import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTenantBySlug } from "@/lib/manager-client";
import { getProducts } from "@/lib/vendure-client";
import { ProductGrid } from "@/components/products/product-grid";
import { CollectionGrid } from "@/components/products/collection-grid";

export default async function StoreHomePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;

  // 1. Get Tenant Details (for Token)
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return null;

  // 2. Fetch Real Products from Vendure
  const rawProducts = await getProducts(tenant.vendureChannelToken || '');

  // 3. Map Data to UI Component Shape
  const products = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.variants[0]?.priceWithTax || p.variants[0]?.price || 0,
    currencyCode: p.variants[0]?.currencyCode || 'USD',
    featuredAsset: p.featuredAsset
  }));

  // 4. Mock Collections (Until Phase 7)
  const collections = [
    { id: '1', name: 'Electronics', slug: 'electronics', color: '#3b82f6', productCount: 4 },
    { id: '2', name: 'Fashion', slug: 'fashion', color: '#ec4899', productCount: 8 },
    { id: '3', name: 'Home', slug: 'home', color: '#10b981', productCount: 3 },
  ];

  return (
    <div className="space-y-10">
      {/* Dynamic Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-8 md:p-16 text-center shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
        <div className="relative z-10">
          <Badge variant="secondary" className="mb-6 bg-white/10 text-white border-none hover:bg-white/20">
            Welcome to {tenant.name}
          </Badge>
          <h1 className="text-4xl md:text-7xl font-bold mb-6 tracking-tighter">
            Premium Deals
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover our curated collection of high-quality products.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 bg-white text-gray-900 hover:bg-gray-100">
              Shop Now
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 border-white/20 text-white hover:bg-white/10">
              Collections
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section>
        <CollectionGrid collections={collections} />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
          <Button variant="ghost">View All</Button>
        </div>

        <ProductGrid products={products} />
      </section>
    </div>
  );
}
