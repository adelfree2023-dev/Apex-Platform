'use client';

import { useTenants } from '@/hooks/use-tenants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function TenantsPage() {
    const { data: tenants, isLoading } = useTenants();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Tenants</h1>
                    <p className="text-muted-foreground">
                        Manage all your tenants and their stores
                    </p>
                </div>
                <Link href="/dashboard/tenants/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Tenant
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Tenants</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : tenants && tenants.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Channel ID</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell className="font-medium">{tenant.name}</TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                {tenant.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {tenant.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {tenant.vendureChannelId || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(tenant.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">
                                No tenants found. Create your first tenant to get started.
                            </p>
                            <Link href="/dashboard/tenants/new">
                                <Button>
                                    Create Tenant
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
