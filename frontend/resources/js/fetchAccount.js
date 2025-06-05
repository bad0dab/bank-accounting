const {Client} = require('pg')

const con = new Client( {
    host : 'localhost',
    user : "postgres",
    port : 8000,
    password : '1234',
    database : 'bankaccount'

})
con.connect().then(()=> console.log("Connected"))
    con.query('SELECT * FROM account', (err, res) => {
    if (err) {
        console.error('Errore nella query:', err);
    } else {
        console.table(res.rows);
    }
    con.end();
});
/*
fetch('http://localhost:3000/api/accounts')
    .then(response => {
        if (!response.ok) {
            throw new Error('Errore nella risposta della rete');
        }
        return response.json();
    })
    .then(data => {
        console.table(data);
    })
    .catch(error => {
        console.error('Errore nella fetch:', error);
    });*/