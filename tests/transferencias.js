import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../utils/variaveis.js';
import { obterToken } from '../helpers/autenticacao.js';

const usuario = JSON.parse(open('../fixtures/postLogin.json'));

export const options = {
    stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 5 },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.01'],
    },
};

export function setup() {
    const token = obterToken(usuario);
    return { token };
}

export default function (data) {
    // IDs de contas devem existir no banco de dados para o teste funcionar
    const payload = JSON.stringify({
        contaOrigem: 1, 
        contaDestino: 2,
        valor: 100
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
        },
    };

    const res = http.post(`${BASE_URL}/transferencias`, payload, params);

    check(res, {
        'status é 201 ou 200': (r) => r.status === 201 || r.status === 200,
    });

    sleep(1);
}
