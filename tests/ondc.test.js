const request = require('supertest');
const app = require('../app');

describe('ONDC Integration Tests', () => {
    
    // Test health endpoint
    test('GET /health should return healthy status', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('healthy');
    });

    // Test verification page
    test('GET /ondc-site-verification.html should return HTML', async () => {
        const response = await request(app).get('/ondc-site-verification.html');
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');
    });

    // Test subscription endpoint
    test('POST /on_subscribe should decrypt challenge', async () => {
        const challenge = 'test_challenge_base64';
        const response = await request(app)
            .post('/on_subscribe')
            .send({ challenge });
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('answer');
    });

    // Test search API
    test('POST /ondc/buyer/search should initiate search', async () => {
        const searchData = {
            keyword: 'laptop',
            gps: '12.9716,77.5946',
            areaCode: '560001'
        };
        
        const response = await request(app)
            .post('/ondc/buyer/search')
            .send(searchData);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('transactionId');
    });

    // Test callback with invalid signature
    test('POST /ondc/on_search without auth should return 401', async () => {
        const response = await request(app)
            .post('/ondc/on_search')
            .send({ context: {}, message: {} });
        
        expect(response.statusCode).toBe(401);
        expect(response.body.message.ack.status).toBe('NACK');
    });
});