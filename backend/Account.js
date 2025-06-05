class Account {
    constructor(owner, balance = 0) {
        this.owner = owner;
        this.balance = balance;
    }

    deposit(amount) {
        if (amount <= 0 || amount <= 200 || amount > 1000) {
            throw new Error('Errore di depositazione.');
        }
        this.balance += amount;
    }

    withdraw(amount) {
        if (amount <= 0) {
            throw new Error('Errore di importazione.');
        }
        if (amount > this.balance) {
            throw new Error('Fondi insufficienti.');
        }
        this.balance -= amount;
    }

    getBalance() {
        return this.balance;
    }
}

module.exports = Account;