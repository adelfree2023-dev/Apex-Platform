'use client';

import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';

export function Footer() {
    const { tenant } = useTenant();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t bg-background">
            <div className="container py-8 md:py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="font-semibold mb-4">About</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href={`/${tenant}/about`} className="hover:text-primary">About Us</Link></li>
                            <li><Link href={`/${tenant}/contact`} className="hover:text-primary">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Shop */}
                    <div>
                        <h3 className="font-semibold mb-4">Shop</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href={`/${tenant}/products`} className="hover:text-primary">All Products</Link></li>
                            <li><Link href={`/${tenant}/search`} className="hover:text-primary">Search</Link></li>
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h3 className="font-semibold mb-4">Account</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href={`/${tenant}/account`} className="hover:text-primary">My Account</Link></li>
                            <li><Link href={`/${tenant}/cart`} className="hover:text-primary">Cart</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href={`/${tenant}/privacy`} className="hover:text-primary">Privacy</Link></li>
                            <li><Link href={`/${tenant}/terms`} className="hover:text-primary">Terms</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>&copy; {currentYear} {tenant || 'Store'}. All rights reserved.</p>
                    <p className="mt-1">Powered by Apex Platform</p>
                </div>
            </div>
        </footer>
    );
}
