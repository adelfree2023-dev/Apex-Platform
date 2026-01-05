'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateTenant } from '@/hooks/use-tenants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateTenantPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const { mutate: createTenant, isPending, isSuccess } = useCreateTenant();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        createTenant({ name }, {
            onSuccess: () => {
                setTimeout(() => {
                    router.push('/dashboard/tenants');
                }, 2000);
            },
            onError: (error: any) => {
                setError(error?.response?.data?.message || 'Failed to create tenant');
            },
        });
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <Link href="/dashboard/tenants">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Tenants
                    </Button>
                </Link>
            </div>

            <div>
                <h1 className="text-3xl font-bold">Create New Tenant</h1>
                <p className="text-muted-foreground">
                    Add a new tenant to your platform
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tenant Information</CardTitle>
                    <CardDescription>
                        Enter the tenant name. The system will automatically create a Vendure channel.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {isSuccess && (
                            <Alert className="bg-green-50 text-green-900 border-green-200">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    Tenant created successfully! Redirecting...
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Tenant Name</Label>
                            <Input
                                id="name"
                                placeholder="My Awesome Store"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isPending || isSuccess}
                            />
                            <p className="text-xs text-muted-foreground">
                                Slug will be auto-generated
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                disabled={isPending || isSuccess || !name}
                            >
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPending ? 'Creating...' : 'Create Tenant'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
