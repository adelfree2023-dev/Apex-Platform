"use client";

import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { User, ShoppingBag, MapPin, CreditCard, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AccountDashboardProps {
    tenantSlug: string;
}

export function AccountDashboard({ tenantSlug }: AccountDashboardProps) {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore(tenantSlug);

    // Not logged in
    if (!isAuthenticated || !user) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold mb-4">Please sign in to view your account</h2>
                <Button asChild>
                    <Link href={`/${tenantSlug}/auth/login`}>Sign In</Link>
                </Button>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push(`/${tenantSlug}`);
        router.refresh();
    };

    const menuItems = [
        {
            title: "Profile Settings",
            description: "Update your personal information",
            icon: User,
            href: `/${tenantSlug}/account/profile`,
        },
        {
            title: "Order History",
            description: "View your past orders",
            icon: ShoppingBag,
            href: `/${tenantSlug}/account/orders`,
        },
        {
            title: "Addresses",
            description: "Manage your saved addresses",
            icon: MapPin,
            href: `/${tenantSlug}/account/addresses`,
        },
        {
            title: "Payment Methods",
            description: "Manage your payment options",
            icon: CreditCard,
            href: `/${tenantSlug}/account/payments`,
        },
    ];

    return (
        <div className="space-y-8">
            {/* User Info Card */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                            {user.firstName?.[0]?.toUpperCase() || "U"}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {user.firstName} {user.lastName}
                        </h2>
                        <p className="text-gray-600">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-primary/10 transition-colors">
                                <item.icon className="h-6 w-6 text-gray-600 group-hover:text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-primary">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t">
                <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
