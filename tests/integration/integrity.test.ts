import { describe, it, expect } from 'vitest';
import request from 'supertest';

// Configuration
const MANAGER_URL = process.env.MANAGER_API_URL || 'http://localhost:3000';
const TEST_TIMESTAMP = Date.now();
const DUPLICATE_NAME = `Duplicate Store ${TEST_TIMESTAMP}`;

describe('🔨 INTEGRITY TESTS: Database Constraints', () => {

    it('🔥 Should prevent creating multiple tenants with the SAME Name/Slug', async () => {
        // 1. Create First Tenant
        const res1 = await request(MANAGER_URL)
            .post('/api/tenants')
            .send({
                name: DUPLICATE_NAME, // "Duplicate Store 123" -> slug: "duplicate-store-123"
                adminEmail: `owner1_${TEST_TIMESTAMP}@test.com`,
                adminPassword: 'Password123!',
                adminName: 'Owner 1'
            });

        expect(res1.status).toBe(201);
        console.log('✅ First tenant created');

        // 2. Try to create Second Tenant with SAME Name
        const res2 = await request(MANAGER_URL)
            .post('/api/tenants')
            .send({
                name: DUPLICATE_NAME, // Same name -> Same slug
                adminEmail: `owner2_${TEST_TIMESTAMP}@test.com`,
                adminPassword: 'Password123!',
                adminName: 'Owner 2'
            });

        // Should Fail with 409 Conflict or 400 Bad Request
        console.log('Duplicate Creation Status:', res2.status);
        expect([400, 409]).toContain(res2.status);

        // Ensure graceful error message
        // expect(res2.body.message).toMatch(/exists|unique/i);
    });

});
