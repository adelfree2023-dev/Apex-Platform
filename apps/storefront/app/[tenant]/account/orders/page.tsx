"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Loader2, Package, Truck, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

interface Order {
    id: string;
    code: string;
    state: string;
    total: number;
    currencyCode: string;
    createdAt: string;
    lines: Array<{
        productVariant: { name: string };
        quantity: number;
    }>;
}

export default function OrdersPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const router = useRouter();
    const [tenantSlug, setTenantSlug] = useState("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        params.then(p => setTenantSlug(p.tenant));
    }, [params]);

    useEffect(() => {
        if (!tenantSlug) return;

        const fetchOrders = async () => {
            try {
                const response = await fetch(VENDURE_API, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "vendure-token": tenantSlug,
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        query: `
                            query GetOrders {
                                activeCustomer {
                                    orders {
                                        items {
                                            id
                                            code
                                            state
                                            total
                                            currencyCode
                                            createdAt
                                            lines {
                                                productVariant { name }
                                                quantity
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                    }),
                });

                const result = await response.json();
                const orderItems = result.data?.activeCustomer?.orders?.items || [];
                setOrders(orderItems);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [tenantSlug]);

    const getStatusIcon = (state: string) => {
        switch (state) {
            case "Delivered": return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "Shipped": return <Truck className="h-5 w-5 text-blue-500" />;
            default: return <Package className="h-5 w-5 text-gray-500" />;
        }
    };

    const formatPrice = (amount: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
        }).format(amount / 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-6">
                <Button variant="ghost" asChild>
                    <Link href={`/${tenantSlug}/account`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Account
                    </Link>
                </Button>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-8">Order History</h1>

            {orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                    <p className="text-gray-500 mb-4">Start shopping to see your orders here</p>
                    <Button asChild>
                        <Link href={`/${tenantSlug}/products`}>Browse Products</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Order #{order.code}</h3>
                                    <p className="text-sm text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(order.state)}
                                    <span className="text-sm font-medium">{order.state}</span>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        {order.lines.map((line, i) => (
                                            <span key={i}>
                                                {line.quantity}x {line.productVariant.name}
                                                {i < order.lines.length - 1 && ", "}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="font-semibold">
                                        {formatPrice(order.total, order.currencyCode)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
