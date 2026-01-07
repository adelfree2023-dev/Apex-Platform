"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ShoppingBag, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserMenuProps {
    tenantSlug: string;
}

export function UserMenu({ tenantSlug }: UserMenuProps) {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore(tenantSlug);
    const { clearCart } = useCartStore(tenantSlug);

    const handleLogout = () => {
        logout();
        clearCart();
        router.refresh();
    };

    // Not authenticated - show login link
    if (!isAuthenticated || !user) {
        return (
            <Button variant="ghost" size="icon" asChild>
                <Link href={`/${tenantSlug}/auth/login`}>
                    <User className="h-5 w-5" />
                </Link>
            </Button>
        );
    }

    // Authenticated - show dropdown
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                            {user.firstName?.[0]?.toUpperCase() || "U"}
                        </span>
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                        {user.firstName}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={`/${tenantSlug}/account`} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        My Account
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/${tenantSlug}/account/orders`} className="cursor-pointer">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Order History
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
