"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, DollarSign, Activity } from "lucide-react";
import { useTenants } from "@/hooks/use-tenants";

export default function DashboardPage() {
  const { tenants } = useTenants();

  const stats = [
    {
      title: "Total Tenants",
      value: tenants?.length || 0,
      icon: Store,
      description: "+2 from last month",
    },
    {
      title: "Active Users",
      value: "+2350",
      icon: Users,
      description: "+180.1% from last month",
    },
    {
      title: "Total Revenue",
      value: "$45,231.89",
      icon: DollarSign,
      description: "+20.1% from last month",
    },
    {
      title: "Active Now",
      value: "+573",
      icon: Activity,
      description: "+201 since last hour",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
