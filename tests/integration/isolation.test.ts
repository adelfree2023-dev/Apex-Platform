import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Configuration
const MANAGER_URL = process.env.MANAGER_API_URL || 'http://localhost:3000';
const VENDURE_URL = process.env.VENDURE_API_URL || 'http://localhost:3001/shop-api';

const TEST_TIMESTAMP = Date.now();
const TENANT_A_NAME = `Nuclear Test A ${TEST_TIMESTAMP}`;
const TENANT_B_NAME = `Nuclear Test B ${TEST_TIMESTAMP}`;
const SHARED_CUSTOMER_EMAIL = `shared_customer_${TEST_TIMESTAMP}@test.com`;
const CUSTOMER_PASSWORD = 'Password123!';

// Helper to register customer in Vendure
async function registerCustomer(token: string, email: string) {
    const query = `
        mutation Register {
            registerCustomerAccount(input: {
                emailAddress: "${email}",
                password: "${CUSTOMER_PASSWORD}",
                firstName: "Shared",
                lastName: "Customer"
            }) {
                ... on Success { success }
                ... on ErrorResult { errorCode message }
            }
        }
    `;

    const res = await fetch(VENDURE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'vendure-token': token
        },
        body: JSON.stringify({ query })
    });
    return res.json();
}

describe('💣 NUCLEAR TEST: Multi-Tenant Data Isolation', () => {
    let tenantA: any;
    let tenantB: any;

    beforeAll(async () => {
        console.log('🚀 Starting Nuclear Test Setup...');

        // 1. Create Tenant A
        const resA = await request(MANAGER_URL).post('/api/tenants').send({
            name: TENANT_A_NAME,
            adminEmail: `adminA_${TEST_TIMESTAMP}@test.com`,
            adminPassword: 'Password123!',
            adminName: 'Admin A'
        });
        tenantA = resA.body;
        console.log('✅ Tenant A Created:', tenantA.slug);

        // 2. Create Tenant B
        const resB = await request(MANAGER_URL).post('/api/tenants').send({
            name: TENANT_B_NAME,
            adminEmail: `adminB_${TEST_TIMESTAMP}@test.com`,
            adminPassword: 'Password123!',
            adminName: 'Admin B'
        });
        tenantB = resB.body;
        console.log('✅ Tenant B Created:', tenantB.slug);
    }, 60000); // Higher timeout for creation

    it('🔥 Should create separate unique Slugs', () => {
        expect(tenantA.slug).not.toBe(tenantB.slug);
    });

    it('🔥 Should have different Vendure Channel Tokens', () => {
        expect(tenantA.vendureChannelToken).not.toBe(tenantB.vendureChannelToken);
    });

    it('🔥 CUSTOMER ISOLATION: Same email should register in BOTH stores', async () => {
        console.log(`Testing registration for ${SHARED_CUSTOMER_EMAIL}...`);

        // Register in Store A
        const resA = await registerCustomer(tenantA.vendureChannelToken, SHARED_CUSTOMER_EMAIL);
        console.log('Store A Register Result:', JSON.stringify(resA.data));
        expect(resA.data.registerCustomerAccount.success).toBe(true);

        // Register in Store B (Should SUCCEED if isolated, FAIL if shared DB)
        const resB = await registerCustomer(tenantB.vendureChannelToken, SHARED_CUSTOMER_EMAIL);
        console.log('Store B Register Result:', JSON.stringify(resB.data)); // Should be Success

        expect(resB.data.registerCustomerAccount.success).toBe(true);

        console.log('✅ SUCCESS: Customer registered in both stores independently!');
    });

    afterAll(async () => {
        console.log('✨ Test Complete');
    });
});
