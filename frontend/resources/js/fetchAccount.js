const { Client } = require('pg');

const con = new Client({
    host: 'localhost',
    user: 'postgres',
    port: 8000,
    password: '1234',
    database: 'bankaccount'
});

con.connect()
    .then(() => console.log("Connected"))
    .then(() => {
        con.query('SELECT * FROM account WHERE id=1', (err, res) => {
            if (err) {
                console.error('Errore nella query:', err);
            } else {
                console.log(JSON.stringify(res.rows, null, 2));
            }
            con.end();
        });
    })    .catch(err => console.error('Errore nella connessione:', err));
