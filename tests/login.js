import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../utils/variaveis.js';

const data = JSON.parse(open('../fixtures/postLogin.json'));

export const options = {
    stages: [
        { duration: '30s', target: 10 }, // Ramp-up
        { duration: '1m', target: 10 },  // Stable
        { duration: '10s', target: 0 },  // Ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% das requisições devem ser menores que 500ms
        http_req_failed: ['rate<0.01'],   // Menos de 1% de falhas
    },
};

export default function () {
    const payload = JSON.stringify(data);
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(`${BASE_URL}/login`, payload, params);

    check(res, {
        'status é 200': (r) => r.status === 200,
        'token retornado': (r) => r.json('token') !== undefined,
    });

    sleep(1);
}
