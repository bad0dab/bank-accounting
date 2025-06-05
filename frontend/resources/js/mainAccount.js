// Dati account
let accountData = {
    balance: 1500.00,
    dailyWithdrawn: 0,
    lastWithdrawDate: null
};

const balanceElement = document.getElementById('balance');
const lastUpdateElement = document.getElementById('last-update');
const amountInput = document.getElementById('amount');
const depositBtn = document.getElementById('deposit-btn');
const withdrawBtn = document.getElementById('withdraw-btn');
const alertContainer = document.getElementById('alert-container');

// start pagina
function init() {
    updateDisplay();
    updateLastUpdate();

    depositBtn.addEventListener('click', () => handleTransaction('deposit'));
    withdrawBtn.addEventListener('click', () => handleTransaction('withdraw'));

    checkSundayRestriction();
}

// aggiorna saldo
function updateDisplay() {
    balanceElement.textContent = `€ ${accountData.balance.toFixed(2).replace('.', ',')}`;
}

// aggiorna orario
function updateLastUpdate() {
    const now = new Date();
    lastUpdateElement.textContent = now.toLocaleString('it-IT');
}

// controlla domenica
function checkSundayRestriction() {
    const today = new Date();
    const isSunday = today.getDay() === 0;

    if (isSunday) {
        depositBtn.disabled = true;
        withdrawBtn.disabled = true;
        showAlert('Le operazioni bancarie non sono disponibili la domenica.', 'warning');
    } else {
        depositBtn.disabled = false;
        withdrawBtn.disabled = false;
    }
}

// gestione transazioni
function handleTransaction(type) {
    const amount = parseFloat(amountInput.value);

    // controllo dell'input
    if (!amount || amount <= 0) {
        showAlert('Inserisci un importo valido maggiore di zero.', 'danger');
        return;
    }

    // controllo domenica
    if (new Date().getDay() === 0) {
        showAlert('Le operazioni non sono permesse la domenica.', 'warning');
        return;
    }

    if (type === 'deposit') {
        handleDeposit(amount);
    } else if (type === 'withdraw') {
        handleWithdraw(amount);
    }
}
// gestione deposito
function handleDeposit(amount) {
    // controlo min/max
    if (amount < 200) {
        showAlert('Il deposito minimo è di €200!', 'danger');
        return;
    }

    if (amount > 2000) {
        showAlert('Il deposito massimo è di €2,000!', 'danger');
        return;
    }

    // new saldo
    accountData.balance += amount;
    updateDisplay();
    updateLastUpdate();
    amountInput.value = '';

    // animazione
    playDepositVideo(amount);
}

//formato valuta
function formatCurrency(amount) {
    return '€ ' + amount.toFixed(2).replace('.', ',');
}

function playDepositVideo(amount) {
    const overlay = document.getElementById('videoOverlay');
    const depositAmountText = document.getElementById('depositAmount');
    
    // deposito
    depositAmountText.textContent = formatCurrency(amount);

    createMoneyRain();

    overlay.style.display = 'flex';

    setTimeout(() => {
        closeVideo();
        showAlert(`Deposito di ${formatCurrency(amount)} effettuato con successo!`, 'success');
    }, 3000);
}
// rain of money
function createMoneyRain() {
    const moneyRain = document.getElementById('moneyRain');
    moneyRain.innerHTML = ''; 
    
    for (let i = 0; i < 15; i++) {
        const bill = document.createElement('div');
        bill.className = 'money-bill';
        bill.style.left = Math.random() * 100 + '%';
        bill.style.animationDelay = Math.random() * 2 + 's';
        bill.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
        moneyRain.appendChild(bill);
    }
}

function closeVideo() {
    const overlay = document.getElementById('videoOverlay');
    overlay.style.display = 'none';
}
// gestione prelievo
function handleWithdraw(amount) {
    // saldo < 0 con prelievo
    if (amount > accountData.balance) {
        showAlert('Saldo insufficiente per effettuare il prelievo.', 'danger');
        return;
    }

    // limite giornaliero (<1000)
    const today = new Date().toDateString();
    if (accountData.lastWithdrawDate !== today) {
        accountData.dailyWithdrawn = 0;
        accountData.lastWithdrawDate = today;
    }

    if (accountData.dailyWithdrawn + amount > 1000) {
        const remaining = 1000 - accountData.dailyWithdrawn;
        showAlert(`Limite giornaliero di prelievo superato. Puoi prelevare ancora €${remaining.toFixed(2).replace('.', ',')}.`, 'danger');
        return;
    }

    // saldo < 0
    if (accountData.balance - amount < 0) {
        showAlert('Il saldo non può diventare negativo.', 'danger');
        return;
    }

    // prelievo
    accountData.balance -= amount;
    accountData.dailyWithdrawn += amount;
    updateDisplay();
    updateLastUpdate();
    amountInput.value = '';

    //video animation
    playWithdrawVideo(amount);

    showAlert(`Prelievo di €${amount.toFixed(2).replace('.', ',')} effettuato con successo!`, 'success');
}
//animazione prelievo
function playWithdrawVideo(amount) {
    const overlay = document.getElementById('withdrawOverlay');
    const withdrawAmountText = document.getElementById('withdrawAmount');
    
    withdrawAmountText.textContent = formatCurrency(amount);
    createMoneyDisappear();

    overlay.style.display = 'flex';

    setTimeout(() => {
        closeWithdrawVideo();
        showAlert(`Prelievo di ${formatCurrency(amount)} effettuato con successo!`, 'success');
    }, 3000);
}
//scompaiono i soldi
function createMoneyDisappear() {
    const moneyDisappear = document.getElementById('moneyDisappear');
    moneyDisappear.innerHTML = '';
    
    for (let i = 0; i < 15; i++) {
        const bill = document.createElement('div');
        bill.className = 'money-bill-withdraw';
        bill.style.left = Math.random() * 100 + '%';
        bill.style.top = Math.random() * 100 + '%';
        bill.style.animationDelay = Math.random() * 0.5 + 's';
        moneyDisappear.appendChild(bill);
    }
}

function closeWithdrawVideo() {
    const overlay = document.getElementById('withdrawOverlay');
    overlay.style.display = 'none';
}
// alert vari
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    // rimozione degli alert
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
//video background
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('bgVideo');
    
    
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            video.muted = true;
            video.play();
        });
    }
    //controllo vari dispositivi
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        video.src = './resources/videos/bank-bg-mobile.mp4';
    }
});
document.addEventListener('DOMContentLoaded', init);