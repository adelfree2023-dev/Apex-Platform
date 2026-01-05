
import fetch from 'node-fetch';

const ADMIN_API = 'http://localhost:3001/admin-api';
const EMAIL = 'admin@apex.com';
const PASSWORD = 'admin123';

const PRODUCTS = [
  {
    name: 'Classic Leather Loafers',
    slug: 'leather-loafers',
    description: 'Handcrafted from premium Italian leather, these loafers offer both style and unmatched comfort. Perfect for formal occasions or casual office wear.',
    price: 12900,
  },
  {
    name: 'Minimalist Wristwatch',
    slug: 'minimalist-watch',
    description: 'A sleek, modern timepiece featuring a sapphire crystal face and a durable stainless steel strap. Water-resistant up to 50 meters.',
    price: 8900,
  },
  {
    name: 'Premium Denim Jacket',
    slug: 'denim-jacket',
    description: 'The ultimate wardrobe staple. Made with 100% organic cotton denim, featuring a vintage wash and robust copper hardware.',
    price: 14900,
  },
  {
    name: 'Urban Backpack',
    slug: 'urban-backpack',
    description: 'Designed for the modern commuter. Water-repellent fabric, padded laptop compartment, and multiple organizer pockets.',
    price: 7900,
  },
  {
    name: 'Wireless Noise-Canceling Headphones',
    slug: 'wireless-headphones',
    description: 'Immerse yourself in high-fidelity sound. Active noise cancellation blocks out the world, while the 30-hour battery keeps you going.',
    price: 19900,
  },
  {
    name: 'Organic Cotton T-Shirt',
    slug: 'cotton-t-shirt',
    description: 'Soft, breathable, and sustainable. A classic fit t-shirt made from GOTS certified organic cotton.',
    price: 3500,
  },
  {
    name: 'Smart Home Speaker',
    slug: 'smart-speaker',
    description: 'Voice-controlled, high-definition audio. Controls your smart home devices and fills your room with rich, 360-degree sound.',
    price: 9900,
  },
  {
    name: 'Polarized Sunglasses',
    slug: 'polarized-sunglasses',
    description: 'Protect your eyes in style. UV400 protection with glare-reducing polarized lenses and a lightweight acetate frame.',
    price: 11000,
  }
];

async function query(query, variables, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(ADMIN_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const body = await response.json();
  if (body.errors) {
    throw new Error(body.errors[0].message);
  }
  return body.data;
}

async function main() {
  console.log('🚀 Starting Seed Script...');

  // 1. Login
  console.log('🔑 Logging in...');
  const loginData = await query(`
    mutation Login($email: String!, $password: String!) {
      login(username: $email, password: $password) {
        ... on CurrentUser {
          id
        }
        ... on InvalidCredentialsError {
          message
        }
      }
    }
  `, { email: EMAIL, password: PASSWORD });

  // Note: Standard Vendure JWT is cookie-based usually, or via header. 
  // Let's assume standard cookie session or Header. 
  // Wait, default Vendure uses Cookie 'session-token'. Node-fetch doesn't save cookies automatically.
  // We need to capture the 'set-cookie' header.

  // Re-doing login with full response capture to get cookies
  const loginRes = await fetch(ADMIN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation Login($email: String!, $password: String!) {
        login(username: $email, password: $password) {
          ... on CurrentUser { id }
        }
      }`,
      variables: { email: EMAIL, password: PASSWORD }
    })
  });

  const authCookie = loginRes.headers.get('set-cookie');
  console.log('✅ Logged in!');

  const authorizedHeaders = {
    'Content-Type': 'application/json',
    'Cookie': authCookie
  };

  const authQuery = async (q, v) => {
    const r = await fetch(ADMIN_API, {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({ query: q, variables: v })
    });
    const b = await r.json();
    if (b.errors) throw new Error(JSON.stringify(b.errors));
    return b.data;
  };

  // 2. Create Products
  console.log('📦 Creating Products...');

  // Fetch existing to avoid duplicates? Nah, just create. 
  // Actually, better to check if slug exists but for speed we'll just try create.

  for (const p of PRODUCTS) {
    console.log(`   Processing: ${p.name}`);

    try {
      const createResult = await authQuery(`
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            slug
          }
        }
      `, {
        input: {
          translations: [{ languageCode: "en", name: p.name, slug: p.slug, description: p.description }],
        }
      });

      const productId = createResult.createProduct.id;

      // Create Variant (Required for price)
      await authQuery(`
        mutation CreateVariant($input: [CreateProductVariantInput!]!) {
          createProductVariants(input: $input) {
            ... on ProductVariant { id }
          }
        }
      `, {
        input: [{
          productId: productId,
          sku: p.slug,
          price: p.price,
          translations: [{ languageCode: "en", name: p.name }]
        }]
      });

      console.log(`   ✅ Created ${p.name}`);

    } catch (e) {
      console.log(`   ⚠️ Skipped ${p.name} (maybe exists?): ${e.message}`);
    }
  }

  console.log('🎉 Seeding Complete!');
}

main().catch(console.error);
