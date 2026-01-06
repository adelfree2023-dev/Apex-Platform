"use client";

import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore } from "@/lib/cart-store";
import Image from "next/image";
import { useState, useEffect } from "react";

interface CartSheetProps {
    tenantSlug: string; // 🔥 Required for tenant isolation
}

export function CartSheet({ tenantSlug }: CartSheetProps) {
    const [mounted, setMounted] = useState(false);

    // 🔥 Use tenant-specific cart store
    const { items, removeItem, updateQuantity, getSummary } = useCartStore(tenantSlug);
    const { totalPrice, totalItems } = getSummary();

    useEffect(() => {
        setMounted(true);
    }, []);

    // 🔥 Prevent hydration mismatch - only render Sheet on client
    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Cart</span>
            </Button>
        );
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                            {totalItems}
                        </span>
                    )}
                    <span className="sr-only">Cart</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Your Shopping Cart ({items.length})</SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6 my-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                            <ShoppingCart className="h-16 w-16 text-gray-200" />
                            <div className="text-xl font-medium text-gray-900">Your cart is empty</div>
                            <p className="text-sm text-gray-500">Looks like you haven't added anything yet.</p>
                            <SheetClose asChild>
                                <Button variant="link" className="text-primary">
                                    Continue Shopping
                                </Button>
                            </SheetClose>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="relative h-20 w-20 rounded-md overflow-hidden bg-gray-100 border flex-shrink-0">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-xs text-gray-400">No Img</div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-medium text-sm line-clamp-2 leading-tight">
                                                {item.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Variant: {item.slug}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2 border rounded-md p-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => {
                                                        if (item.quantity === 1) removeItem(item.id);
                                                        else updateQuantity(item.id, item.quantity - 1);
                                                    }}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-xs w-4 text-center font-medium">{item.quantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">
                                            {((item.price * item.quantity) / 100).toFixed(2)} USD
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            ({(item.price / 100).toFixed(2)} each)
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {items.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>{(totalPrice / 100).toFixed(2)} USD</span>
                        </div>
                        <SheetFooter className="flex-col gap-3 sm:flex-col sm:space-x-0">
                            <Button className="w-full h-12 text-base shadow-xl bg-gradient-to-r from-primary to-primary/80">
                                Checkout Now
                            </Button>
                            <SheetClose asChild>
                                <Button variant="outline" className="w-full">
                                    Continue Shopping
                                </Button>
                            </SheetClose>
                        </SheetFooter>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
