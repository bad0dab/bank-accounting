const express = require('express');
const { Client } = require('pg');

const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());


const DISABLED_ACTION = "domenica"
const LOGGED_USERID = 1

const limitVars = {
    "minDeposit" : 200,
    "maxDeposit" : 2000,

    "maxDailyWithdraw" : 1000
}

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


function getCurrentDate(){ return new Date().toLocaleDateString() }

//function getCurrentDate() { return "07/06/2025" }


function bankBasicCheck(amount){
    if(new Date().toLocaleDateString('it-IT', {weekday: "long"}) == DISABLED_ACTION){
        throw new Error(`Operazioni disabilitate la ${DISABLED_ACTION[0].toUpperCase()+DISABLED_ACTION.substr(1,DISABLED_ACTION.length)}`)
    }
    
    if(amount <= 0){
        throw new Error("Amount non Valido")
    }
}

async function addHistory(amount, type){
    await con.query("INSERT INTO transactions (userid, amount, actiontype, actiondate) VALUES ($1, $2, $3, $4)", [LOGGED_USERID, amount, type, getCurrentDate()]);   
}

// prende info account
app.get('/account', async (req, res) => {
    try {
        let account = await con.query('SELECT * FROM account WHERE id = $1', [LOGGED_USERID])
        account = account.rows[0]

        res.json({
            success: true,
            username: account.username,
            balance: account.balance
        });
    } catch (error) {
        res.json({
            success: false,
            error: 'Failed to fetch account.'
        });
    }
});
//manda info account a frontend
app.post('/account/deposit', async (req, res) => {
    const { amount } = req.body;

    try {
        bankBasicCheck(amount)
        
        if (amount < limitVars.minDeposit) {
            throw new Error('Errore di Deposito. Importo inferiore al Limite');
        }

        if (amount > limitVars.maxDeposit) {
            throw new Error('Errore di Deposito. Importo superiore al Limite');
        }

        let currentBalance = await con.query('SELECT * FROM account WHERE id = $1', [LOGGED_USERID])
        currentBalance = currentBalance.rows[0]["balance"]
        
        const newBalance = currentBalance + amount;

        await addHistory(amount, "deposit")
        await con.query("UPDATE account SET balance = $1 WHERE id = $2", [newBalance, LOGGED_USERID]);

        res.json({
            success: true,
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});


//dd/mm/yyyy
app.get('/account/history', async (req, res) => {
    try {  
        const fetchHistory = (await con.query("SELECT * from transactions WHERE userid = $1", [LOGGED_USERID])).rows
        res.json({
            success: true,
            history: fetchHistory
        });
    } catch (error) {
        res.json({
            success: false,
            error: 'Failed to fetch history.'
        });
    }
});

// manda info account a frontend
app.post('/account/withdraw', async (req, res) => {
    const { amount } = req.body;

    try {

        bankBasicCheck(amount)

        let currentBalance = await con.query('SELECT * FROM account WHERE id = $1', [LOGGED_USERID])
        currentBalance = currentBalance.rows[0]["balance"]

        if (amount > currentBalance) {
            throw new Error('Fondi insufficienti.');
        }

        if(amount > limitVars.maxDailyWithdraw){
            throw new Error("Errore di Prelievo. Limite Massimo Raggiunto")
        }

        let dailyWithdraw = (await con.query("SELECT sum(amount) AS dailyWithdraw FROM transactions WHERE userid = $1 and actiontype='withdraw' and actiondate=$2", [LOGGED_USERID, getCurrentDate()])).rows[0]["dailywithdraw"]
        dailyWithdraw = dailyWithdraw == null ? 0 : dailyWithdraw

        if(dailyWithdraw+amount > limitVars.maxDailyWithdraw){
            throw new Error("Limite Giornaliero Raggiunto !");
        }


        const newBalance = currentBalance - amount;
        await con.query("UPDATE account SET balance = $1 WHERE id = $2", [newBalance, LOGGED_USERID]);

        await addHistory(amount, "withdraw")

        res.json({
            success: true,
            balance: dailyWithdraw
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

module.exports = app;
