'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, Menu } from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';
import { Button } from '@/components/ui/button';

export function Header() {
    const { tenant } = useTenant();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo */}
                <Link href={`/${tenant}`} className="flex items-center space-x-2">
                    <span className="text-xl font-bold">{tenant || 'Store'}</span>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link href={`/${tenant}/products`} className="text-sm font-medium hover:text-primary">
                        Products
                    </Link>
                    <Link href={`/${tenant}/search`} className="text-sm font-medium hover:text-primary">
                        Search
                    </Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon">
                        <Search className="h-5 w-5" />
                    </Button>
                    <Link href={`/${tenant}/cart`}>
                        <Button variant="ghost" size="icon">
                            <ShoppingCart className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href={`/${tenant}/account`}>
                        <Button variant="ghost" size="icon">
                            <User className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
