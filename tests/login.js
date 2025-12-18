import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../utils/variaveis.js';
import { randomUUID } from '../utils/faker.js';

// 1. Data-Driven Testing: Carrega lista de usuários
const usuarios = new SharedArray('usuarios', function () {
    return JSON.parse(open('../fixtures/usuarios.json'));
});

// 3. Trends: Métrica customizada para tempo de login
const loginDuration = new Trend('login_duration');

export const options = {
    stages: [
        { duration: '10s', target: 50 }, // Ramp-up: Sobe para 50 VUs
        { duration: '30s', target: 50 }, // Platô: Mantém 50 VUs
        { duration: '10s', target: 0 },  // Ramp-down: Desce para 0 VUs
    ],
    thresholds: {
        http_req_duration: ['p(95)<3000', 'max<5000'], // 95% < 3s, Max < 5s
        http_req_failed: ['rate<0.01'],   // Menos de 1% de falhas
        login_duration: ['p(95)<2000'],   // Threshold na métrica customizada
    },
};

export default function () {
    // 2. Data-Driven Testing: Seleciona um usuário aleatório da lista
    const user = usuarios[Math.floor(Math.random() * usuarios.length)];
    
    // 4. Faker: Gera um ID de requisição aleatório
    const requestId = randomUUID();

    const payload = JSON.stringify(user);
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId, // Uso do dado fake
        },
        tags: {
            name: 'LoginRequest' // Tag para agrupar métricas se necessário
        }
    };

    // 5. Groups: Agrupa a requisição e os checks
    group('Autenticação', function () {
        const res = http.post(`${BASE_URL}/login`, payload, params);

        // Adiciona a duração à métrica customizada
        loginDuration.add(res.timings.duration);

        check(res, {
            'status é 200': (r) => r.status === 200,
            'token é string': (r) => typeof r.json('token') === 'string',
        });
    });

    sleep(1);
}
