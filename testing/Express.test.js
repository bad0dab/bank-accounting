const request = require('supertest');
// mock del modulo 'pg' per simulare il database
jest.mock('pg', () => {
    const mClient = {
        connect: jest.fn().mockResolvedValue(),
        query: jest.fn()
            .mockImplementation((sql, params) => {
                // qui si controlla quale query viene eseguita e si restituisce un risultato simulato
                if (sql.startsWith('SELECT * FROM account')) {
                    return Promise.resolve({ rows: [{ id: 1, username: 'Mario', balance: 1000 }] });
                }
                if (sql.startsWith('SELECT * from transactions')) {
                    return Promise.resolve({ rows: [
                        { id: 1, userid: 1, amount: 500, actiontype: 'deposit', actiondate: '01/01/2024' }
                    ] });
                }
                if (sql.startsWith('SELECT sum(amount) AS dailyWithdraw')) {
                    return Promise.resolve({ rows: [{ dailywithdraw: 500 }] });
                }
                if (sql.startsWith('UPDATE account SET balance')) {
                    return Promise.resolve();
                }
                if (sql.startsWith('INSERT INTO transactions')) {
                    return Promise.resolve();
                }
                return Promise.resolve();
            }),
        end: jest.fn()
    };
    return { Client: jest.fn(() => mClient) };
});
const app = require('../backend/Express');

describe('Account API', () => {
    test('deposita un numero di soldi compreso tra 200 e 2000', async () => {
        //deposito valido
        const response = await request(app)
            .post('/account/deposit')
            .send({ amount: 500 });
        expect(response.body).toEqual({ success: true });
    });

    test('deposito fallisce per importo troppo basso', async () => {
        // qui si testa un deposito con importo inferiore al minimo
        const response = await request(app)
            .post('/account/deposit')
            .send({ amount: 100 });
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/inferiore al Limite/);
    });

    test('deposito fallisce per importo troppo alto', async () => {
        // qui si testa un deposito con importo superiore al massimo
        const response = await request(app)
            .post('/account/deposit')
            .send({ amount: 3000 });
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/superiore al Limite/);
    });

    test('deposito fallisce per amount non valido', async () => {
        //deposito con importo non valido (negativo)
        const response = await request(app)
            .post('/account/deposit')
            .send({ amount: -10 });
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/non Valido/);
    });

    test('ritira dei soldi validi', async () => {
        //prelievo valido
        const response = await request(app)
            .post('/account/withdraw')
            .send({ amount: 500 });
        expect(response.body).toEqual({ success: true });
    });

    test('prelievo fallisce per fondi insufficienti', async () => {
        // simula un saldo basso per testare il caso di fondi insufficienti
        require('pg').Client.mockImplementation(() => ({
            connect: jest.fn().mockResolvedValue(),
            query: jest.fn()
                .mockImplementation((sql) => {
                    if (sql.startsWith('SELECT * FROM account')) {
                        return Promise.resolve({ rows: [{ id: 1, username: 'Mario', balance: 100 }] });
                    }
                    if (sql.startsWith('SELECT sum(amount) AS dailyWithdraw')) {
                        return Promise.resolve({ rows: [{ dailywithdraw: 0 }] });
                    }
                    return Promise.resolve();
                }),
            end: jest.fn()
        }));
        const app2 = require('../backend/Express');
        const response = await request(app2)
            .post('/account/withdraw')
            .send({ amount: 500 });
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/Fondi insufficienti/);
    });

    test('prelievo fallisce per superamento limite singolo', async () => {
        //superamento del limite massimo per singolo prelievo
        const response = await request(app)
            .post('/account/withdraw')
            .send({ amount: 2000 });
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/Limite Massimo/);
    });

    test('prelievo fallisce per superamento limite giornaliero', async () => {
        // qui si simula un prelievo che supera il limite giornaliero
        require('pg').Client.mockImplementation(() => ({
            connect: jest.fn().mockResolvedValue(),
            query: jest.fn()
                .mockImplementation((sql) => {
                    if (sql.startsWith('SELECT * FROM account')) {
                        return Promise.resolve({ rows: [{ id: 1, username: 'Mario', balance: 2000 }] });
                    }
                    if (sql.startsWith('SELECT sum(amount) AS dailyWithdraw')) {
                        return Promise.resolve({ rows: [{ dailywithdraw: 900 }] });
                    }
                    return Promise.resolve();
                }),
            end: jest.fn()
        }));
        const app3 = require('../backend/Express');
        const response = await request(app3)
            .post('/account/withdraw')
            .send({ amount: 200 });
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/Giornaliero/);
    });

    test('prelievo fallisce per amount non valido', async () => {
        // testa un prelievo con importo non valido (negativo)
        const response = await request(app)
            .post('/account/withdraw')
            .send({ amount: -10 });
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/non Valido/);
    });

    test('restituisce i dati account', async () => {
        // qui si verifica che l'endpoint restituisca i dati dell'account correttamente
        const response = await request(app)
            .get('/account');
        expect(response.body).toEqual({
            success: true,
            username: 'Mario',
            balance: 1000
        });
    });

    test('errore nel recupero dati account', async () => {
        // qui si simula un errore del database durante il recupero dei dati account
        require('pg').Client.mockImplementation(() => ({
            connect: jest.fn().mockResolvedValue(),
            query: jest.fn().mockRejectedValue(new Error('DB error')),
            end: jest.fn()
        }));
        const app4 = require('../backend/Express');
        const response = await request(app4)
            .get('/account');
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/Failed to fetch account/);
    });

    test('restituisce la cronologia delle transazioni', async () => {
        //verifica che venga restituita la cronologia delle transazioni
        const response = await request(app)
            .get('/account/history');
        expect(response.body).toEqual({
            success: true,
            history: [
                { id: 1, userid: 1, amount: 500, actiontype: 'deposit', actiondate: '01/01/2024' }
            ]
        });
    });

    test('errore nel recupero cronologia', async () => {
        // simula un errore del database durante il recupero della cronologia
        require('pg').Client.mockImplementation(() => ({
            connect: jest.fn().mockResolvedValue(),
            query: jest.fn().mockRejectedValue(new Error('DB error')),
            end: jest.fn()
        }));
        const app5 = require('../backend/Express');
        const response = await request(app5)
            .get('/account/history');
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/Failed to fetch history/);
    });
});