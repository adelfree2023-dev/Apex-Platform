import { CheckoutContent } from "@/components/checkout/checkout-content";
import { getTenantBySlug } from "@/lib/manager-client";
import { notFound } from "next/navigation";

export default async function CheckoutPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const { tenant: tenantSlug } = await params;

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    return (
        <div className="animate-fade-in">
            <CheckoutContent tenantSlug={tenantSlug} channelToken={tenantSlug} />
        </div>
    );
}
