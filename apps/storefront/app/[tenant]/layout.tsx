import { TenantProvider } from "@/lib/tenant-context";
import Link from "next/link";
import { ShoppingCart, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTenantBySlug } from "@/lib/manager-client"; 
import { notFound } from "next/navigation"; 

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  // 🛑 التفتيش: هل هذا المتجر موجود حقاً؟
  const tenantData = await getTenantBySlug(tenant);

  // إذا لم يكن موجوداً -> صفحة 404
  if (!tenantData) {
    notFound(); 
  }

  return (
    <TenantProvider tenant={tenantData}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <Link href={`/${tenant}`} className="text-xl font-bold uppercase tracking-wider">
              {tenantData.name} Store
            </Link>
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input placeholder="Search products..." className="pl-9 bg-gray-100 border-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Cart</span>
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="bg-white border-t py-8 mt-auto">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            © 2026 {tenantData.name}. Powered by Apex Platform.
          </div>
        </footer>
      </div>
    </TenantProvider>
  );
}
