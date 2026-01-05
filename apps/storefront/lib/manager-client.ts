const MANAGER_API = 'http://127.0.0.1:3000/api'; // تصحيح البورت إلى 3000

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  vendureChannelToken?: string;
}

export async function getTenants(): Promise<Tenant[]> {
  console.log(`🔌 Fetching tenants from: ${MANAGER_API}/tenants`);
  const res = await fetch(`${MANAGER_API}/tenants`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch tenants');
  return res.json();
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  if (slug.includes('.') || slug.startsWith('_')) return null;

  console.log(`🔍 Verifying tenant: ${slug}`);
  try {
    const res = await fetch(`${MANAGER_API}/tenants/slug/${slug}`, { 
      cache: 'no-store',
      next: { revalidate: 60 } 
    });
    
    if (res.status === 404) return null;
    if (!res.ok) return null;
    
    return res.json();
  } catch (e) {
    console.error(`❌ Check failed for ${slug}`, e);
    return null;
  }
}
