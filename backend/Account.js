class Account {
    constructor(owner, balance = 0) {
        this.owner = owner;
        this.balance = balance;
    }

    deposit(amount) {
        if (amount <= 0) {
            throw new Error('L\'importo del deposito deve essere positivo.');
        }
        this.balance += amount;
    }

    withdraw(amount) {
        if (amount <= 0) {
            throw new Error('L\'importo del prelievo deve essere positivo.');
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