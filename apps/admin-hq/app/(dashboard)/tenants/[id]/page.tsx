"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Store, Globe, Calendar, RefreshCw, Trash2, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface Tenant {
    id: string;
    slug: string;
    name: string;
    domain: string | null;
    type: string;
    status: string;
    vendureChannelId: string | null;
    vendureChannelToken: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function TenantDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const response = await apiClient.get(`/api/tenants/${params.id}`);
                setTenant(response.data);
            } catch (error) {
                console.error("Failed to fetch tenant:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTenant();
    }, [params.id]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this tenant? This cannot be undone.")) return;

        setIsDeleting(true);
        try {
            await apiClient.delete(`/api/tenants/${params.id}`);
            router.push("/tenants");
        } catch (error) {
            console.error("Failed to delete tenant:", error);
            alert("Failed to delete tenant");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSeedProducts = async () => {
        try {
            await apiClient.post(`/api/tenants/slug/${tenant?.slug}/seed`);
            alert("Products seeded successfully!");
        } catch (error) {
            console.error("Failed to seed products:", error);
            alert("Failed to seed products");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Tenant not found</p>
                <Button variant="link" onClick={() => router.push("/tenants")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/tenants")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{tenant.name}</h1>
                        <p className="text-gray-500">{tenant.slug}</p>
                    </div>
                </div>
                <Badge variant={tenant.status === "ACTIVE" ? "default" : "secondary"}>
                    {tenant.status}
                </Badge>
            </div>

            {/* Info Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" /> Store Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">{tenant.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Slug</p>
                            <p className="font-medium">{tenant.slug}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="font-medium">{tenant.type}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Vendure Integration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" /> Vendure Integration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Channel ID</p>
                            <p className="font-medium">{tenant.vendureChannelId || "Not linked"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Channel Token</p>
                            <p className="font-medium font-mono text-xs">{tenant.vendureChannelToken || "—"}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Dates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" /> Dates
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Created</p>
                            <p className="font-medium">{new Date(tenant.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Updated</p>
                            <p className="font-medium">{new Date(tenant.updatedAt).toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Manage this tenant</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <Button onClick={handleSeedProducts}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Seed Products
                    </Button>
                    <Button variant="outline" asChild>
                        <a href={`http://34.18.154.179:3002/${tenant.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> View Store
                        </a>
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        <Trash2 className="mr-2 h-4 w-4" /> {isDeleting ? "Deleting..." : "Delete Tenant"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
