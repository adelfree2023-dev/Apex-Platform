export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    featuredAsset?: Asset;
    assets: Asset[];
    variants: ProductVariant[];
}

export interface ProductVariant {
    id: string;
    name: string;
    sku?: string;
    price: number;
    priceWithTax: number;
    currencyCode: string;
    stockLevel?: string;
    options?: VariantOption[];
}

export interface VariantOption {
    id: string;
    code: string;
    name: string;
}

export interface Asset {
    id: string;
    preview: string;
}
