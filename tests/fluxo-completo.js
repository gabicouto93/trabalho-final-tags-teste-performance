import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL } from '../utils/variaveis.js';
import { obterToken } from '../helpers/autenticacao.js';
import { SharedArray } from 'k6/data';
import { randomItem } from '../utils/faker.js';

const usuarios = new SharedArray('usuarios', function () {
    return JSON.parse(open('../fixtures/usuarios.json'));
});

export const options = {
    stages: [
        { duration: '10s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.5'], // Aceita falhas por saldo insuficiente
    },
};

export function setup() {
    const user = usuarios[0];
    const token = obterToken(user);
    return { token };
}

export default function (data) {
    const headers = {
        'Authorization': `Bearer ${data.token}`,
        'Content-Type': 'application/json',
    };

    let contaOrigemId;
    let contaDestinoId;

    // 1. Consulta Saldo (e pega IDs de contas)
    group('1. Consulta Contas', function () {
        const res = http.get(`${BASE_URL}/contas`, { headers: headers });
        
        check(res, {
            'status contas é 200': (r) => r.status === 200,
            'lista de contas não vazia': (r) => r.json().contas && r.json().contas.length >= 2
        });

        if (res.status === 200 && res.json().contas && res.json().contas.length >= 2) {
            const contas = res.json().contas;
            contaOrigemId = contas[0].id;
            contaDestinoId = contas[1].id;
        }
    });

    sleep(1);

    // 2. Realiza Transferência (se tivermos IDs)
    if (contaOrigemId && contaDestinoId) {
        group('2. Realiza Transferência', function () {
            const payload = JSON.stringify({
                contaOrigem: contaOrigemId,
                contaDestino: contaDestinoId,
                valor: 10.00
            });

            const res = http.post(`${BASE_URL}/transferencias`, payload, { headers: headers });

            check(res, {
                'transferencia realizada ou saldo insuficiente': (r) => 
                    r.status === 201 || 
                    r.status === 200 || 
                    (r.status === 422 && r.json().error && r.json().error.includes('Saldo insuficiente')),
            });
        });
    }

    sleep(1);

    // 3. Consulta Extrato
    group('3. Consulta Extrato', function () {
        const res = http.get(`${BASE_URL}/transferencias`, { headers: headers });

        check(res, {
            'status extrato é 200': (r) => r.status === 200,
            'extrato retornado': (r) => r.json().transferencias && Array.isArray(r.json().transferencias)
        });
    });

    sleep(1);
}
