import { RegisterForm } from "@/components/auth/register-form";
import { getTenantBySlug } from "@/lib/manager-client";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function RegisterPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const { tenant: tenantSlug } = await params;

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) notFound();

    return (
        <div className="max-w-md mx-auto py-12 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                <p className="text-gray-500">
                    Join us and start shopping today
                </p>
            </div>

            <RegisterForm tenantSlug={tenantSlug} channelToken={tenant.vendureChannelToken || ""} />

            <div className="mt-6 text-center text-sm">
                <p className="text-gray-500">
                    Already have an account?{" "}
                    <Link href={`/${tenantSlug}/auth/login`} className="text-primary font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
