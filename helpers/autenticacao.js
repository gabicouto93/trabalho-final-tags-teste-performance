import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../utils/variaveis.js';

export function obterToken(usuario) {
    const payload = JSON.stringify({
        username: usuario.username,
        senha: usuario.senha,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(`${BASE_URL}/login`, payload, params);

    check(res, {
        'login realizado com sucesso': (r) => r.status === 200,
        'token presente': (r) => r.json('token') !== '',
    });

    return res.json('token');
}
