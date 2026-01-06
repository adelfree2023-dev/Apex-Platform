"use client";

import Link from "next/link";
import { useTenants } from "@/hooks/use-tenants";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TenantsPage() {
  const { tenants, isLoading } = useTenants();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
        <Link href="/tenants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Tenant
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Loading tenants...</p>
        ) : tenants?.map((tenant: any) => (
          <Link key={tenant.id} href={`/tenants/${tenant.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">{tenant.name}</CardTitle>
                <span className={`px-2 py-1 rounded text-xs ${tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {tenant.status}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{tenant.slug}</p>
                <div className="text-xs text-gray-400">
                  Created on {new Date(tenant.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!isLoading && tenants?.length === 0 && (
          <p className="text-gray-500 col-span-3 text-center py-10">No tenants found. Create your first one!</p>
        )}
      </div>
    </div>
  );
}
