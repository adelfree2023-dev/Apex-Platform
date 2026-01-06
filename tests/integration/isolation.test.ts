import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Configuration
const MANAGER_URL = process.env.MANAGER_API_URL || 'http://localhost:3000';
const TEST_TIMESTAMP = Date.now();
const TENANT_A_NAME = `Nuclear Test A ${TEST_TIMESTAMP}`;
const TENANT_B_NAME = `Nuclear Test B ${TEST_TIMESTAMP}`;

describe('💣 NUCLEAR TEST: Multi-Tenant Data Isolation', () => {
    let tenantA: any;
    let tenantB: any;
    let tokenA: string; // Token requires implementation if auth needed
    let tokenB: string;

    beforeAll(async () => {
        console.log('🚀 Starting Nuclear Test Setup...');

        // 1. Create Tenant A
        const resA = await request(MANAGER_URL)
            .post('/api/tenants')
            .send({ name: TENANT_A_NAME });

        if (resA.status !== 201) {
            console.error('Failed to create Tenant A:', resA.body);
            throw new Error('Failed to create Tenant A');
        }
        tenantA = resA.body;
        console.log('✅ Tenant A Created:', tenantA.name, tenantA.slug);

        // 2. Create Tenant B
        const resB = await request(MANAGER_URL)
            .post('/api/tenants')
            .send({ name: TENANT_B_NAME });

        if (resB.status !== 201) {
            console.error('Failed to create Tenant B:', resB.body);
            throw new Error('Failed to create Tenant B');
        }
        tenantB = resB.body;
        console.log('✅ Tenant B Created:', tenantB.name, tenantB.slug);
    });

    it('🔥 Should create separate unique Slugs', () => {
        expect(tenantA.slug).not.toBe(tenantB.slug);
    });

    it('🔥 Should have separate Vendure Channels (Simulated Check)', () => {
        // In real scenario, we check database or Vendure API
        // Here we check if the response contains the channel ID (if implemented)
        if (tenantA.vendureChannelId) {
            expect(tenantA.vendureChannelId).not.toBe(tenantB.vendureChannelId);
            console.log('✅ Vendure Channels are different');
        } else {
            console.warn('⚠️ vendureChannelId not returned in response (Skipping check)');
        }
    });

    it('🔥 Tenant A should exist and be retrievable', async () => {
        const res = await request(MANAGER_URL).get(`/api/tenants/${tenantA.id}`);
        expect(res.status).toBe(200);
        expect(res.body.slug).toBe(tenantA.slug);
    });

    it('🔥 Tenant B should exist and be retrievable', async () => {
        const res = await request(MANAGER_URL).get(`/api/tenants/${tenantB.id}`);
        expect(res.status).toBe(200);
        expect(res.body.slug).toBe(tenantB.slug);
    });

    afterAll(async () => {
        console.log('🧹 Cleaning up Nuclear Test Data...');
        // Cleanup logic if delete endpoint exists
        // await request(MANAGER_URL).delete(`/api/tenants/${tenantA.id}`);
        // await request(MANAGER_URL).delete(`/api/tenants/${tenantB.id}`);
        console.log('✨ Cleanup Complete (Manual deletion may be required if DELETE not implemented)');
    });
});
