# 🎨 UI_SYSTEM.md - The Frontend Standard
## Apex Platform System Constitution - Part 3

**Version:** 1.0 (Post-Operation Phoenix)  
**Last Updated:** 2026-01-09  
**Authors:** Virtual CTO + Operation Phoenix Team

---

## 🧠 AI Context Rules

> [!CAUTION]
> **FOR AI ASSISTANTS:** Read this section BEFORE writing frontend code.

1. **EVERY page MUST have an `error.tsx`** boundary (already created).

2. **EVERY page MUST have a `loading.tsx`** skeleton (already created).

3. **NEVER use `console.log`** in components. Use error boundaries.

4. **ALWAYS check tenant context** before rendering tenant-specific data.

5. **Use Zustand for client state, React Query for server state.**

6. **All UI components MUST be responsive.** Use the responsive utilities.

---

## 🏗️ Frontend Architecture

### Application Structure

```
apps/
├── admin-hq/            # Super Admin Dashboard (Next.js 14)
│   └── app/
│       ├── error.tsx    # ⭐ Global error boundary
│       ├── loading.tsx  # ⭐ Loading skeleton
│       ├── login/
│       └── dashboard/
│
└── storefront/          # Tenant Stores (Next.js 16)
    └── app/
        ├── error.tsx    # ⭐ Global error boundary
        ├── loading.tsx  # ⭐ Loading skeleton
        └── [tenant]/    # Dynamic tenant routes
            ├── page.tsx
            ├── products/
            ├── cart/
            └── checkout/
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 14 (admin), 16 (store) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui + Radix | Latest |
| State (Client) | Zustand | 4.x |
| State (Server) | React Query | 5.x |
| Forms | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| Icons | Lucide React | Latest |

---

## 🛡️ Safety Mechanisms

### Error Boundary (Already Implemented)

```tsx
// apps/storefront/app/error.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log to Sentry
        Sentry.captureException(error);
    }, [error]);

    return (
        <div className="error-container">
            <h1>عفواً، حدث خطأ</h1>
            <button onClick={reset}>إعادة المحاولة</button>
            <button onClick={() => window.location.href = '/'}>
                الصفحة الرئيسية
            </button>
            {process.env.NODE_ENV === 'development' && (
                <pre>{error.message}</pre>
            )}
        </div>
    );
}
```

### Loading State (Already Implemented)

```tsx
// apps/storefront/app/loading.tsx

export default function Loading() {
    return (
        <div className="loading-container animate-pulse">
            {/* Header skeleton */}
            <div className="h-16 bg-gray-200 w-full" />
            
            {/* Content skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-48 bg-gray-200 rounded-lg" />
                ))}
            </div>
        </div>
    );
}
```

---

## 🔄 State Management

### When to Use What

| Use Case | Solution | Example |
|----------|----------|---------|
| Cart items | Zustand (persisted) | `useCartStore` |
| User session | Zustand | `useAuthStore` |
| Server data | React Query | `useProducts()` |
| Form state | React Hook Form | `useForm()` |
| URL filters | URL state | `?category=phones` |
| Theme | CSS variables | `--primary-color` |

### Cart Store (Zustand)

```tsx
// apps/storefront/stores/cart-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    productId: string;
    variantId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
}

interface CartState {
    items: CartItem[];
    isLoading: boolean;
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],
            isLoading: false,
            addItem: (item) => set((state) => {
                const existing = state.items.find(
                    i => i.variantId === item.variantId
                );
                if (existing) {
                    return {
                        items: state.items.map(i =>
                            i.variantId === item.variantId
                                ? { ...i, quantity: i.quantity + item.quantity }
                                : i
                        )
                    };
                }
                return { items: [...state.items, item] };
            }),
            removeItem: (id) => set((state) => ({
                items: state.items.filter(i => i.id !== id)
            })),
            updateQuantity: (id, quantity) => set((state) => ({
                items: state.items.map(i =>
                    i.id === id ? { ...i, quantity } : i
                )
            })),
            clearCart: () => set({ items: [] }),
        }),
        { name: 'cart-storage' }
    )
);
```

### Optimistic Updates Hook

```tsx
// apps/storefront/hooks/use-optimistic-cart.ts

import { useCallback, useTransition } from 'react';
import { useCartStore, type CartItem } from '@/stores/cart-store';

export function useOptimisticCart() {
    const [isPending, startTransition] = useTransition();
    const { addItem, removeItem, updateQuantity } = useCartStore();

    const optimisticAddItem = useCallback(async (item: CartItem) => {
        // Immediate UI update
        startTransition(() => {
            addItem(item);
        });
        
        // Sync with server (fire and forget)
        try {
            await fetch('/api/cart/add', {
                method: 'POST',
                body: JSON.stringify(item),
            });
        } catch (error) {
            // Rollback on failure
            removeItem(item.id);
        }
    }, [addItem, removeItem]);

    return {
        addItem: optimisticAddItem,
        isPending,
    };
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* apps/storefront/styles/responsive.css */

/* Mobile first approach */
.container-responsive {
    width: 100%;
    padding: 1rem;
}

@media (min-width: 640px) {  /* sm */
    .container-responsive { max-width: 640px; margin: 0 auto; }
}

@media (min-width: 768px) {  /* md */
    .container-responsive { max-width: 768px; }
}

@media (min-width: 1024px) { /* lg */
    .container-responsive { max-width: 1024px; }
}

@media (min-width: 1280px) { /* xl */
    .container-responsive { max-width: 1280px; }
}
```

### Utility Classes

```css
/* Hide on mobile, show on desktop */
.hide-mobile { display: none; }
@media (min-width: 768px) {
    .hide-mobile { display: block; }
}

/* Show on mobile, hide on desktop */
.show-mobile { display: block; }
@media (min-width: 768px) {
    .show-mobile { display: none; }
}

/* Grid columns */
.grid-responsive {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
}

@media (min-width: 640px) {
    .grid-responsive { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
    .grid-responsive { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 🎨 Component Guidelines

### Component Template

```tsx
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
    title: string;
    className?: string;
    children?: React.ReactNode;
}

export function Component({ title, className, children }: ComponentProps) {
    const [isLoading, setIsLoading] = useState(false);

    if (isLoading) {
        return <ComponentSkeleton />;
    }

    return (
        <div className={cn('component-base', className)}>
            <h2>{title}</h2>
            {children}
        </div>
    );
}

// Skeleton for loading state
function ComponentSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-32 bg-gray-200 rounded" />
        </div>
    );
}
```

---

## 🔌 API Integration

### Fetch with Timeout

```tsx
// packages/shared/src/utils/fetch.ts

export async function fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 10000
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}
```

---

## 🧪 Testing Checklist

Before deploying, verify:

- [ ] `pnpm build` passes without errors
- [ ] All pages have `error.tsx`
- [ ] All pages have `loading.tsx`
- [ ] Responsive on mobile (320px - 768px)
- [ ] Responsive on tablet (768px - 1024px)
- [ ] No console.log in production
- [ ] Cart persists on refresh
- [ ] Error boundary catches errors

---

## 📌 Quick Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

---

**Previous:** [SERVER_MECHANICS.md](./SERVER_MECHANICS.md)  
**See Also:** [DATA_PROTOCOL.md](./DATA_PROTOCOL.md)
