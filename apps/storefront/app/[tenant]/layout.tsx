import { TenantProvider } from "@/lib/tenant-context";
import Link from "next/link";
import { ShoppingCart, Search, Menu, User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTenantBySlug } from "@/lib/manager-client";
import { notFound } from "next/navigation";
import { CartSheet } from "@/components/cart/cart-sheet";
import { SearchInput } from "@/components/search/search-input";
import { UserMenu } from "@/components/auth/user-menu";
import { TenantAuthGuardWrapper } from "@/components/auth/tenant-auth-guard-wrapper";

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
        <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href={`/${tenant}`} className="text-xl font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">
              {tenantData.name}
            </Link>

            {/* Navigation Links - Desktop */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href={`/${tenant}`} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Home
              </Link>
              <Link href={`/${tenant}/products`} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
                <Package className="h-4 w-4" />
                Products
              </Link>
            </nav>

            {/* Search - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchInput tenantSlug={tenant} className="w-full" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Cart Sheet - shows dropdown with cart link inside */}
              <CartSheet tenantSlug={tenant} />

              {/* User Menu - Smart (checks auth state) */}
              <UserMenu tenantSlug={tenant} />

              {/* Mobile Menu */}
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search - Mobile */}
          <div className="md:hidden px-4 pb-3">
            <SearchInput tenantSlug={tenant} className="w-full" />
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
          <TenantAuthGuardWrapper tenantSlug={tenant} channelToken={tenantData.vendureChannelToken || tenant}>
            {children}
          </TenantAuthGuardWrapper>
        </main>

        <footer className="bg-white border-t py-8 mt-auto">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <h3 className="font-bold text-lg mb-4">{tenantData.name}</h3>
                <p className="text-sm text-gray-500">Your trusted online store.</p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><Link href={`/${tenant}`} className="hover:text-primary">Home</Link></li>
                  <li><Link href={`/${tenant}/products`} className="hover:text-primary">Products</Link></li>
                  <li><Link href={`/${tenant}/cart`} className="hover:text-primary">Cart</Link></li>
                </ul>
              </div>

              {/* Account */}
              <div>
                <h4 className="font-semibold mb-4">Account</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><Link href={`/${tenant}/auth/login`} className="hover:text-primary">Login</Link></li>
                  <li><Link href={`/${tenant}/auth/register`} className="hover:text-primary">Register</Link></li>
                  <li><Link href={`/${tenant}/account`} className="hover:text-primary">My Account</Link></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><Link href={`/${tenant}/search`} className="hover:text-primary">Search</Link></li>
                </ul>
              </div>
            </div>

            <div className="text-center text-gray-400 text-sm border-t pt-8">
              © 2026 {tenantData.name}. Powered by Apex Platform.
            </div>
          </div>
        </footer>
      </div>
    </TenantProvider>
  );
}

