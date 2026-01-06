"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
    tenantSlug: string;
    className?: string;
}

export function SearchInput({ tenantSlug, className }: SearchInputProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) return;

        const timer = setTimeout(() => {
            // Only show loading indicator, don't navigate until Enter/submit
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsSearching(true);
            router.push(`/${tenantSlug}/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleClear = () => {
        setQuery("");
        inputRef.current?.focus();
    };

    // Listen for route changes to hide loading
    useEffect(() => {
        setIsSearching(false);
    }, []);

    return (
        <form onSubmit={handleSubmit} className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                ref={inputRef}
                type="search"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
            />
            {query && !isSearching && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
            {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
            )}
        </form>
    );
}
