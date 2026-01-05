'use client';

import { useTenants } from '@/hooks/use-tenants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, Activity, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
    const { data: tenants, isLoading } = useTenants();

    const stats = [
        {
            title: 'Total Tenants',
            value: tenants?.length || 0,
            icon: Users,
            change: '+12%',
        },
        {
            title: 'Active Stores',
            value: tenants?.filter((t) => t.status === 'ACTIVE').length || 0,
            icon: Store,
            change: '+8%',
        },
        {
            title: 'Trial Accounts',
            value: tenants?.filter((t) => t.status === 'TRIAL').length || 0,
            icon: Activity,
            change: '+23%',
        },
        {
            title: 'Revenue (MRR)',
            value: '$0',
            icon: TrendingUp,
            change: '+0%',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back! Here's what's happening with your platform.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-green-600">{stat.change}</span> from last month
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
