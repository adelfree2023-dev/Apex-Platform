"use client";

import { FolderClosed, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Collection {
    id: string;
    name: string;
    slug: string;
    color?: string;
    productCount?: number;
}

interface CollectionGridProps {
    collections: Collection[];
}

export function CollectionGrid({ collections }: CollectionGridProps) {
    if (!collections || collections.length === 0) return null;

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">Collections</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {collections.map((col) => (
                    <Link
                        key={col.id}
                        href={`/collections/${col.slug}`}
                        className={cn(
                            "p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all cursor-pointer group block"
                        )}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div
                                className="size-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${col.color || '#3b82f6'}15` }}
                            >
                                <FolderClosed
                                    className="size-5"
                                    style={{ color: col.color || '#3b82f6' }}
                                />
                            </div>
                        </div>
                        <p className="font-medium text-sm truncate mb-0.5">{col.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {col.productCount || 0} items
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
