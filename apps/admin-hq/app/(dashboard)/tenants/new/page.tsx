"use client";
import { useState } from "react";
import { useTenants } from "@/hooks/use-tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
export default function CreateTenantPage() {
  const { createTenant, isCreating } = useTenants();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    password: "",
    adminName: "",
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await createTenant({
        name: formData.name,
        slug: formData.slug,
        adminName: formData.adminName,
        adminEmail: formData.email,
        adminPassword: formData.password,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create tenant");
    }
  };
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Tenant Store</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Store Information */}
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                required
                placeholder="My Awesome Store"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Store Slug (URL)</Label>
              <Input
                placeholder="my-store (auto-generated if empty)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <hr className="my-4" />

            {/* Admin User Information */}
            <div className="space-y-2">
              <Label>Admin Name</Label>
              <Input
                placeholder="John Doe"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Admin Email (Login)</Label>
              <Input
                required
                type="email"
                placeholder="admin@store.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Store & Admin"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
