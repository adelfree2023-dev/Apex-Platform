'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Key,
    CreditCard,
    BarChart3,
    Settings,
} from 'lucide-react';

const navItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Tenants',
        href: '/dashboard/tenants',
        icon: Users,
    },
    {
        title: 'Licenses',
        href: '/dashboard/licenses',
        icon: Key,
    },
    {
        title: 'Billing',
        href: '/dashboard/billing',
        icon: CreditCard,
    },
    {
        title: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r bg-background h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                        <span className="text-lg font-bold text-white">A</span>
                    </div>
                    <span className="font-bold text-lg">Apex HQ</span>
                </div>
            </div>

            <nav className="px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.title}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
