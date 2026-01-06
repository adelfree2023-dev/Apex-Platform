import { CartPageContent } from "@/components/cart/cart-page-content";

export default async function CartPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const { tenant: tenantSlug } = await params;

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
            <CartPageContent tenantSlug={tenantSlug} />
        </div>
    );
}
