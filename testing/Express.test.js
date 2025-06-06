const request = require('supertest');
jest.mock('pg', () => {
    const mClient = {
        connect: jest.fn().mockResolvedValue(),
        query: jest.fn().mockResolvedValue({ rows: [{ id: 1, username: 'Mario', balance: 1000 }] }),
        end: jest.fn()
    };
    return { Client: jest.fn(() => mClient) };
});

const app = require('../backend/Express');

    
// beforeEach(() => {
//     jest.resetAllMocks(); // Resetta tutte le funzioni mockate
// });


describe('Account API', () => {


    test('deposito tra 200 e 2000', async () => {
        const response = await request(app)
            .post('/account/deposit')
            .send({ amount: 500 });
            expect(response.body.success).toBe(true);
        });
        
    test('deposito fallisce per importo troppo basso', async () => {
        // qui si testa un deposito con importo inferiore al minimo
        const response = await request(app)
            .post('/account/deposit')
            .send({ amount: 100 });
        expect(response.body.success).toBe(false);
    });

    test('deposito fallisce per importo troppo alto', async () => {
        // qui si testa un deposito con importo superiore al massimo
        const response = await request(app)
            .post('/account/deposit')
            .send({ amount: 3000 });
        expect(response.body.success).toBe(false);
    });

    test('deposito fallisce per amount non valido', async () => {
        //deposito con importo non valido (negativo)
        const response = await request(app)
            .post('/account/deposit')
            .send({ amount: -10 });
        expect(response.body.success).toBe(false);
    });

    test('ritira dei soldi validi', async () => {
        //prelievo valido
        const response = await request(app)
            .post('/account/withdraw')
            .send({ amount: 500 });
        expect(response.body.success).toBe(true);
    });
    

    test('prelievo fallisce per fondi insufficienti', async () => {
        const response = await request(app)
            .post('/account/withdraw')
            .send({ amount: 1500 });
        expect(response.body.success).toBe(false);
    });

    
    test('prelievo fallisce per superamento limite singolo', async () => {
        //superamento del limite massimo per singolo prelievo
        const response = await request(app)
            .post('/account/withdraw')
            .send({ amount: 1500 });
        expect(response.body.success).toBe(false);
    });

    test('prelievo fallisce per superamento limite giornaliero', async () => {
        // Reset dei moduli per applicare il nuovo mock
        jest.resetModules();

        // Mock pg prima di importare Express
        jest.mock('pg', () => {
            return {
                Client: jest.fn(() => ({
                    connect: jest.fn().mockResolvedValue(),
                    query: jest.fn().mockImplementation((sql) => {
                        if (sql.startsWith('SELECT * FROM account')) {
                            return Promise.resolve({ rows: [{ id: 1, username: 'Mario', balance: 2000 }] });
                        }
                        if (sql.startsWith('SELECT sum(amount) AS dailyWithdraw')) {
                            return Promise.resolve({ rows: [{ dailywithdraw: 900 }] }); // quasi al limite
                        }
                        return Promise.resolve({ rows: [] });
                    }),
                    end: jest.fn()
                }))
            };
        });

        // Ora che il mock è impostato, importiamo Express
        const app = require('../backend/Express');

        const response = await request(app)
            .post('/account/withdraw')
            .send({ amount: 200 }); // 900 + 200 = 1100, supera il limite giornaliero

        expect(response.body.success).toBe(false);
    });


    test('prelievo fallisce per amount non valido', async () => {
        // testa un prelievo con importo non valido (negativo)
        const response = await request(app)
            .post('/account/withdraw')
            .send({ amount: -10 });
        expect(response.body.success).toBe(false);
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
        jest.resetModules();

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
    });


    test('restituisce la cronologia delle transazioni', async () => {
        // Reset dei moduli per applicare il nuovo mock
        jest.resetModules();

        // Mock pg prima di importare Express
        jest.mock('pg', () => {
            return {
                Client: jest.fn(() => ({
                    connect: jest.fn().mockResolvedValue(),
                    query: jest.fn().mockImplementation((sql) => {
                        if (sql.startsWith('SELECT * FROM transactions')) {
                            return Promise.resolve({ rows: [{ id: 1, userid: 1, amount: 500, actiontype: 'deposit', actiondate: '01/01/2024' }] });
                        }
                        return Promise.resolve({ rows: [] });
                    }),
                    end: jest.fn()
                }))
            };
        });

        const app2 = require("../backend/Express")
        const response = await request(app2)
            .get('/account/history');
        expect(response.body.success).toBe(true)
        });
    });

    
    test('errore nel recupero cronologia', async () => {
        jest.resetModules();
        
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
    });