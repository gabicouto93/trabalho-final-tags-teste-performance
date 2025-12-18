const mockData = {
    usuarios: [
        { id: 1, username: 'admin', senha: 'senha123' },
        { id: 2, username: 'usuario', senha: '123' }
    ],
    contas: [
        { id: 1, titular: 'Admin', saldo: 1000.00, ativa: 1 },
        { id: 2, titular: 'Usuario', saldo: 500.00, ativa: 1 }
    ],
    transferencias: []
};

console.log('⚠️  USANDO MOCK DATABASE (Em Memória) ⚠️');

const db = {
    query: async (sql, params) => {
        const sqlLower = sql.toLowerCase().trim();
        
        // 1. Login: SELECT * FROM usuarios WHERE username = ? AND senha = ?
        if (sqlLower.includes('from usuarios') && sqlLower.includes('username = ?')) {
            const user = mockData.usuarios.find(u => u.username === params[0] && u.senha === params[1]);
            return [user ? [user] : [], null];
        }

        // 2. Listar Contas: SELECT id, titular, saldo, ativa FROM contas ORDER BY titular ASC
        if (sqlLower.includes('from contas') && sqlLower.includes('order by titular')) {
            return [mockData.contas, null];
        }

        // 3. Obter Conta por ID: SELECT id, titular, saldo, ativa FROM contas WHERE id = ?
        if (sqlLower.includes('from contas') && sqlLower.includes('where id = ?')) {
            const conta = mockData.contas.find(c => c.id === params[0]);
            return [conta ? [conta] : [], null];
        }

        // 4. Atualizar Saldo: UPDATE contas SET saldo = saldo + ? WHERE id = ?
        if (sqlLower.includes('update contas set saldo')) {
            const conta = mockData.contas.find(c => c.id === params[1]);
            if (conta) {
                conta.saldo += params[0];
                return [{ affectedRows: 1 }, null];
            }
            return [{ affectedRows: 0 }, null];
        }

        // 5. Inserir Transferência
        if (sqlLower.includes('insert into transferencias')) {
            const newId = mockData.transferencias.length + 1;
            const novaTransferencia = {
                id: newId,
                conta_origem_id: params[0],
                conta_destino_id: params[1],
                valor: params[2],
                autenticada: params[3],
                data: new Date()
            };
            mockData.transferencias.push(novaTransferencia);
            return [{ insertId: newId }, null];
        }

        // 6. Listar Transferências (Simplificado)
        if (sqlLower.includes('from transferencias') && sqlLower.includes('limit')) {
            return [mockData.transferencias, null];
        }

        // 7. Total Transferências
        if (sqlLower.includes('count(*) as total from transferencias')) {
            return [[{ total: mockData.transferencias.length }], null];
        }

        return [[], null];
    },
    end: () => {}
};

module.exports = db;