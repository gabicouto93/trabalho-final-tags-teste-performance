import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../utils/variaveis.js';
import { obterToken } from '../helpers/autenticacao.js';
import { SharedArray } from 'k6/data';

const usuarios = new SharedArray('usuarios', function () {
    return JSON.parse(open('../fixtures/usuarios.json'));
});

export const options = {
    // Cenário de Estresse: Aumenta a carga além do normal para achar o ponto de quebra
    stages: [
        { duration: '10s', target: 50 },  // Aquecimento rápido
        { duration: '30s', target: 100 }, // Carga alta
        { duration: '30s', target: 200 }, // Carga muito alta (Estresse)
        { duration: '10s', target: 0 },   // Resfriamento
    ],
    thresholds: {
        http_req_failed: ['rate<0.05'], // Aceita até 5% de erro no estresse
        http_req_duration: ['p(95)<1000'], // 95% das requisições abaixo de 1s
    },
};

export function setup() {
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
            name: 'StressExtrato'
        }
    };

    const res = http.get(`${BASE_URL}/transferencias`, params);

    check(res, {
        'status é 200': (r) => r.status === 200,
        'extrato é array': (r) => r.json().transferencias && Array.isArray(r.json().transferencias),
    });

    sleep(0.5); // Sleep menor para gerar mais pressão
}
