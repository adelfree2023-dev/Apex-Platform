import { AccountDashboard } from "@/components/account/account-dashboard";
import { getTenantBySlug } from "@/lib/manager-client";
import { notFound } from "next/navigation";

export default async function AccountPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const { tenant: tenantSlug } = await params;

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>
            <AccountDashboard tenantSlug={tenantSlug} />
        </div>
    );
}
