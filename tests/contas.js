import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../utils/variaveis.js';
import { obterToken } from '../helpers/autenticacao.js';
import { SharedArray } from 'k6/data';

// Carrega usuários para autenticação
const usuarios = new SharedArray('usuarios', function () {
    return JSON.parse(open('../fixtures/usuarios.json'));
});

export const options = {
    stages: [
        { duration: '10s', target: 20 }, // Ramp-up
        { duration: '30s', target: 20 }, // Carga constante
        { duration: '10s', target: 0 },  // Ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // Leitura deve ser rápida (<500ms)
        http_req_failed: ['rate<0.01'],
    },
};

export function setup() {
    // Pega um usuário aleatório para gerar o token do teste
    const user = usuarios[0]; 
    const token = obterToken(user);
    return { token };
}

export default function (data) {
    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
        tags: {
            name: 'GetContas'
        }
    };

    const res = http.get(`${BASE_URL}/contas`, params);

    check(res, {
        'status é 200': (r) => r.status === 200,
        'retornou lista de contas': (r) => r.json().contas && Array.isArray(r.json().contas) && r.json().contas.length > 0,
        'tempo de resposta < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}
