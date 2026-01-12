import { Product } from '@/types/storefront';
import { GridContainer } from '@/components/ui/grid-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { GetRichProducts } from '@/lib/api/products';
import { Button } from '@/components/ui/button'; // Added back Button just in case validation needs it

export default async function HomePage() {
  const products = await GetRichProducts();

  return (
    <div className="space-y-8">
      <div className="flex h-screen bg-gray-50">
        <div className="p-10">
          <h1 className="text-3xl font-bold mb-5">SQUARE UI IS LIVE</h1>
          <GridContainer cols={4} gap={4}>
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardHeader><CardTitle>{product.name}</CardTitle></CardHeader>
              </Card>
            ))}
          </GridContainer>
        </div>
      </div>
    </div>
  );
}