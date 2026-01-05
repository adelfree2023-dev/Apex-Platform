import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTenants } from "@/lib/manager-client";
import { Store } from "lucide-react";

export default async function LandingPage() {
  let tenants = [];
  try {
    tenants = await getTenants();
  } catch (error) {
    console.error("Failed to load tenants:", error);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Apex Platform</h1>
        <p className="text-gray-500">Multi-Tenant E-commerce Engine</p>
      </div>
      
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-black">
        <CardHeader>
          <CardTitle>Select a Store</CardTitle>
          <CardDescription>
            {tenants.length > 0 
              ? "Choose one of the active stores below:" 
              : "No active stores found. Please create one in Admin HQ."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tenants.map((tenant: any) => (
            <Link key={tenant.id} href={`/${tenant.slug}`} className="block">
              <Button className="w-full justify-between group h-14" variant="outline">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Store className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">{tenant.name}</span>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-black">/{tenant.slug}</span>
              </Button>
            </Link>
          ))}

          {tenants.length === 0 && (
             <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed">
               <p className="text-sm text-gray-500">No stores available yet.</p>
             </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 text-xs text-gray-400">
        Connected to Manager API: {process.env.NEXT_PUBLIC_MANAGER_URL || 'http://localhost:3003'}
      </div>
    </div>
  );
}
