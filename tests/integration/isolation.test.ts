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

// Helper sleep
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
        console.log('Creating Tenant A...');
        const resA = await request(MANAGER_URL).post('/api/tenants').send({
            name: TENANT_A_NAME,
            adminEmail: `adminA_${TEST_TIMESTAMP}@test.com`,
            adminPassword: 'Password123!',
            adminName: 'Admin A'
        });

        if (resA.status !== 201) {
            console.error('Failed to create Tenant A:', resA.body);
            throw new Error('Failed to create Tenant A');
        }
        tenantA = resA.body;
        console.log('✅ Tenant A Created:', tenantA.slug);

        console.log('⏳ Waiting 5s...');
        await sleep(5000);

        // 2. Create Tenant B
        console.log('Creating Tenant B...');
        const resB = await request(MANAGER_URL).post('/api/tenants').send({
            name: TENANT_B_NAME,
            adminEmail: `adminB_${TEST_TIMESTAMP}@test.com`,
            adminPassword: 'Password123!',
            adminName: 'Admin B'
        });

        if (resB.status !== 201) {
            console.error('Failed to create Tenant B:', resB.body);
            throw new Error('Failed to create Tenant B');
        }
        tenantB = resB.body;
        console.log('✅ Tenant B Created:', tenantB.slug);

        console.log('⏳ Waiting 5s before tests...');
        await sleep(5000);

    }, 120000); // Higher timeout

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

        console.log('⏳ Waiting 5s...');
        await sleep(5000);

        // Register in Store B
        const resB = await registerCustomer(tenantB.vendureChannelToken, SHARED_CUSTOMER_EMAIL);
        console.log('Store B Register Result:', JSON.stringify(resB.data));
        expect(resB.data.registerCustomerAccount.success).toBe(true);

        console.log('✅ SUCCESS: Customer registered in both stores independently!');
    });

    afterAll(async () => {
        console.log('✨ Test Complete');
    });
});
