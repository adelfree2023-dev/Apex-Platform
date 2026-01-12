// apps/storefront/components/ui/grid-container.tsx

import { GridContainerProps } from '@/types/grid-container.d.ts';

interface GridContainerProps {
  children: React.ReactNode;
  cols?: number;
  gap?: number;
  className?: string;
}

export default function GridContainer({
  children,
  cols = 4,
  gap = 4,
  className = '',
}: GridContainerProps) {
  // Calculate grid template columns based on the number of columns
  const gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

  // Calculate gap in rem units
  const gapRem = `${gap / 4}rem`;

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${cols} gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: gridTemplateColumns,
        gap: gapRem,
      }}
    >
      {children}
    </div>
  );
}