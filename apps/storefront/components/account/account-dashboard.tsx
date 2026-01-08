"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { User, ShoppingBag, MapPin, CreditCard, LogOut, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AccountDashboardProps {
    tenantSlug: string;
    channelToken?: string;
}

interface CustomerData {
    id: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber?: string;
    // Vendure uses a different field for verification status
}

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

export function AccountDashboard({ tenantSlug, channelToken }: AccountDashboardProps) {
    const router = useRouter();
    const { user, setUser, logout } = useAuthStore(tenantSlug);
    const { resetLocalState } = useCartStore(tenantSlug);

    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch active customer from Vendure on mount
    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await fetch(VENDURE_API, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "vendure-token": channelToken || tenantSlug,
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        query: `
                            query ActiveCustomer {
                                activeCustomer {
                                    id
                                    firstName
                                    lastName
                                    emailAddress
                                    phoneNumber
                                }
                            }
                        `,
                    }),
                });

                const result = await response.json();
                const activeCustomer = result.data?.activeCustomer;

                if (activeCustomer) {
                    setCustomer(activeCustomer);
                    // Sync with auth store
                    setUser({
                        id: activeCustomer.id,
                        email: activeCustomer.emailAddress,
                        firstName: activeCustomer.firstName,
                        lastName: activeCustomer.lastName,
                    });
                } else {
                    // No active session - clear any stale local auth state
                    setCustomer(null);
                    logout(); // Clear zustand persist state
                }
            } catch (err) {
                console.error("Failed to fetch customer:", err);
                setError("Failed to load account data");
            } finally {
                setLoading(false);
            }
        };

        fetchCustomer();
    }, [tenantSlug, channelToken, setUser, logout]);

    const handleLogout = async () => {
        try {
            // Call Vendure logout mutation
            await fetch(VENDURE_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "vendure-token": channelToken || tenantSlug,
                },
                credentials: "include",
                body: JSON.stringify({
                    query: `mutation { logout { success } }`,
                }),
            });
        } catch (err) {
            console.error("Logout error:", err);
        }

        // Clear local auth and cart state
        // Cart stays on server for when user logs back in
        logout();
        resetLocalState();
        // Use window.location instead of router to avoid Server Action cache issues
        window.location.href = `/${tenantSlug}`;
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not logged in
    if (!customer) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl border p-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-4">Please sign in to view your account</h2>
                <Button asChild>
                    <Link href={`/${tenantSlug}/auth/login`}>Sign In</Link>
                </Button>
            </div>
        );
    }

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
                            {customer.firstName?.[0]?.toUpperCase() || "U"}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {customer.firstName} {customer.lastName}
                        </h2>
                        <p className="text-gray-600">{customer.emailAddress}</p>
                        {customer.phoneNumber && (
                            <p className="text-gray-500 text-sm">{customer.phoneNumber}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Verified
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
