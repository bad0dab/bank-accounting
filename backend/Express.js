const express = require('express');
const { Client } = require('pg');

const app = express();
app.use(express.json());

const con = new Client({
    host: 'localhost',
    user: 'postgres',
    port: 8000,
    password: '1234',
    database: 'bankaccount'
});

con.connect()
    .then(() => console.log("Connected to DB"))
    .catch(err => console.error('DB connection error:', err));

// prende info account
app.get('/account', async (req, res) => {
    try {
        const result = await con.query('SELECT * FROM account WHERE id = 1');
        const account = result.rows[0];
        res.json({
            success: true,
            owner: account.owner,
            balance: account.balance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch account.'
        });
    }
});
//manda info account a frontend
app.post('/account/deposit', async (req, res) => {
    const { amount } = req.body;

    try {
        if (amount <= 0 || amount <= 200 || amount > 1000) {
            throw new Error('Errore di depositazione.');
        }

        const result = await con.query('SELECT balance FROM account WHERE id = 1');
        let currentBalance = result.rows[0].balance;
        const newBalance = currentBalance + amount;

        await con.query('UPDATE account SET balance = newBalance WHERE id = 1', [newBalance]);

        res.json({
            success: true,
            message: `Deposited ${amount}`,
            balance: newBalance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// manda info account a frontend
app.post('/account/withdraw', async (req, res) => {
    const { amount } = req.body;

    try {
        if (amount <= 0) {
            throw new Error('Errore di importazione.');
        }

        const result = await con.query('SELECT balance FROM account WHERE id = 1');
        let currentBalance = result.rows[0].balance;

        if (amount > currentBalance) {
            throw new Error('Fondi insufficienti.');
        }

        const newBalance = currentBalance - amount;
        await con.query('UPDATE account SET balance = newBalance WHERE id = 1', [newBalance]);

        res.json({
            success: true,
            message: `Withdrew ${amount}`,
            balance: newBalance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
