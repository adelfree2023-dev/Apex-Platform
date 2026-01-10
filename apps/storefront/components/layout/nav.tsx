'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTenant } from '@/lib/tenant-context';

const navItems = [
    { label: 'Home', path: '' },
    { label: 'Products', path: '/products' },
    { label: 'Search', path: '/search' },
    { label: 'Cart', path: '/cart' },
    { label: 'Account', path: '/account' },
];

export function Nav() {
    const { slug: tenant } = useTenant();
    const pathname = usePathname();

    return (
        <nav className="flex items-center space-x-6">
            {navItems.map((item) => {
                const href = `/${tenant}${item.path}`;
                const isActive = pathname === href || (item.path && pathname?.startsWith(href));

                return (
                    <Link
                        key={item.path}
                        href={href}
                        className={cn(
                            'text-sm font-medium transition-colors hover:text-primary',
                            isActive ? 'text-primary' : 'text-muted-foreground'
                        )}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
