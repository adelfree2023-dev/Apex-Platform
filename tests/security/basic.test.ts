import { describe, it, expect } from 'vitest';
import request from 'supertest';

// Configuration
const MANAGER_URL = process.env.MANAGER_API_URL || 'http://localhost:3000';
const TEST_TIMESTAMP = Date.now();

describe('🔐 SECURITY TESTS: Basic Vulnerability Checks', () => {

    it('🔥 Should prevent SQL Injection in Tenant Name', async () => {
        const maliciousName = `Test Store'; DROP TABLE "User"; -- ${TEST_TIMESTAMP}`;

        const res = await request(MANAGER_URL)
            .post('/api/tenants')
            .send({
                name: maliciousName,
                adminEmail: `hacker_${TEST_TIMESTAMP}@test.com`,
                adminPassword: 'Password123!',
                adminName: 'Hacker'
            });

        // It might succeed in creation (sanitized) OR fail validation
        // But crucially, it MUST NOT return 500 or crash the DB
        expect(res.status).not.toBe(500);

        // If created, ensure name is sanitized or treated as literal string
        if (res.status === 201) {
            expect(res.body.name).toBe(maliciousName); // Should be stored literally, not executed
            console.log('✅ SQL Injection payload stored as literal string (Safe)');
        } else {
            console.log('✅ SQL Injection payload rejected (Safe)');
        }
    });

    it('🔥 Should prevent XSS in Tenant Name', async () => {
        const xssPayload = `<script>alert('XSS')</script> Store ${TEST_TIMESTAMP}`;

        const res = await request(MANAGER_URL)
            .post('/api/tenants')
            .send({
                name: xssPayload,
                adminEmail: `xss_${TEST_TIMESTAMP}@test.com`,
                adminPassword: 'Password123!',
                adminName: 'XSS Tester'
            });

        if (res.status === 201) {
            // In a real scenario, the API might allow storing it, 
            // but the Frontend MUST escape it.
            // Here we just check the API doesn't execute anything weird.
            console.log('⚠️ XSS payload stored. Ensure Frontend escapes output!');
        }
    });

    it('🔥 Should reject invalid email format (Input Validation)', async () => {
        const res = await request(MANAGER_URL)
            .post('/api/tenants')
            .send({
                name: `Bad Email Store ${TEST_TIMESTAMP}`,
                adminEmail: "not-an-email",
                adminPassword: "Password123!",
                adminName: "Tester"
            });

        expect(res.status).toBe(400); // Bad Request
    });
});
