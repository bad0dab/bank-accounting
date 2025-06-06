const express = require('express');
const { Client } = require('pg');

const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());


const DISABLED_ACTION = "domenica"
const LOGGED_USERID = 1

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


function getCurrentDate(){
    return new Date().toLocaleDateString()
}


function bankBasicCheck(amount){
    if(new Date().toLocaleDateString('it-IT', {weekday: "long"}) == DISABLED_ACTION){
        throw new Error(`Operazioni disabilitate la ${DISABLED_ACTION[0].toUpperCase()+DISABLED_ACTION.substr(1,DISABLED_ACTION.length)}`)
    }
    
    if(amount <= 0){
        throw new Error("Amount non Valido")
    }
}


async function getUserInfo(id){
    const result = await con.query('SELECT * FROM account WHERE id = $1', [id]);
    return result.rows[0];
}

async function addHistory(amount, type){
    await con.query("INSERT INTO transactions (userid, amount, actiontype, actiondate) VALUES ($1, $2, $3, $4)", [LOGGED_USERID, amount, type, getCurrentDate()]);   
}

// prende info account
app.get('/account', async (req, res) => {
    try {
        const account = await getUserInfo(LOGGED_USERID)
        res.json({
            success: true,
            owner: account.owner,
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
        
        if (amount <= 200) {
            throw new Error('Errore di Deposito. Importo inferiore al Limite');
        }

        if (amount > 2000) {
            throw new Error('Errore di Deposito. Importo superiore al Limite');
        }

        let currentBalance = (await getUserInfo(LOGGED_USERID))["balance"]
        const newBalance = currentBalance + amount;

        addHistory(amount, "deposit")
        await con.query("UPDATE account SET balance = $1 WHERE id = 1", [newBalance]);

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
        res.json({
            success: true,
            // owner: account.owner,
            // balance: account.balance
        });
    } catch (error) {
        res.json({
            success: false,
            error: 'Failed to fetch account.'
        });
    }
});

// manda info account a frontend
app.post('/account/withdraw', async (req, res) => {
    const { amount } = req.body;

    try {

        bankBasicCheck(amount)

        const currentBalance = (await getUserInfo(LOGGED_USERID))["balance"]

        if (amount > currentBalance) {
            throw new Error('Fondi insufficienti.');
        }

        const dailyWithdraw = ((await con.query("SELECT sum(amount) AS dailyWithdraw FROM transactions WHERE userid = $1 and actiontype='withdraw' and actiondate=$2", [LOGGED_USERID, getCurrentDate()])).rows[0]).dailywithdraw;
        if(dailyWithdraw+amount > 1000){
            throw new Error("Limite giornaliero raggiunto");
        }


        const newBalance = currentBalance - amount;
        await con.query("UPDATE account SET balance = $1 WHERE id = 1", [newBalance]);

        addHistory(amount, "withdraw")

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

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
