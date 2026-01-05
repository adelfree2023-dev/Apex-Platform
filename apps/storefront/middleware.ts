import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3002';
  
  // استخراج اسم المتجر من الرابط
  let tenant: string | null = null;
  
  // التحقق من الدومين الفرعي
  if (hostname !== baseDomain && !hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1) {
      tenant = parts[0];
    }
  }

  // للتجربة المحلية
  const testTenant = request.nextUrl.searchParams.get('tenant');
  if (testTenant) tenant = testTenant;

  // السماح بصفحة اختيار المتجر
  if (!tenant && request.nextUrl.pathname.startsWith('/select-store')) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  if (tenant) {
    requestHeaders.set('x-tenant-slug', tenant);
    
    // إعادة توجيه داخلية (Rewrite)
    const newUrl = request.nextUrl.clone();
    if (!newUrl.pathname.startsWith(`/${tenant}`)) {
       newUrl.pathname = `/${tenant}${newUrl.pathname}`;
       return NextResponse.rewrite(newUrl, {
         request: { headers: requestHeaders },
       });
    }
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
