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



// aggiorna saldo
function updateDisplay() {
    fetch("http://localhost:3000/account").then(r => r.json()).then(r => {
        balanceElement.textContent = `€ ${r["balance"]}`;
    })
}

// aggiorna orario
function updateLastUpdate() {
    const now = new Date();
    lastUpdateElement.textContent = now.toLocaleString('it-IT');
}



// gestione transazioni
function handleTransaction(type) {
    const data = {amount: parseFloat(amountInput.value)}

    fetch(`http://localhost:3000/account/${type}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
        body: JSON.stringify(data)
    }).then(r => r.json()).then(r => {
        
        if(r["success"]){

               
            if (type === 'deposit') {
                const overlay = document.getElementById('videoOverlay');
                const depositAmountText = document.getElementById('depositAmount');
                
                // deposito
                depositAmountText.textContent = formatCurrency(data.amount);

                createMoneyRain();
                overlay.style.display = 'flex';

            }
            else{
                const overlay = document.getElementById('withdrawOverlay');
                const withdrawAmountText = document.getElementById('withdrawAmount');
                
                withdrawAmountText.textContent = formatCurrency(data.amount);
                
                createMoneyDisappear();
                overlay.style.display = 'flex';
            }

            setTimeout(() => {
                type == "deposit" ? closeVideo() : closeWithdrawVideo();
                
                showAlert(`${type == "deposit" ? "Deposito" : "Prelievo"} di ${formatCurrency(data.amount)} effettuato con successo!`, type=="deposit" ? "success" : "danger");
                
                updateDisplay()
                updateLastUpdate()

            }, 1000);
        }

        else{
            showAlert(r["error"], 'danger');
        }

        amountInput.value = '';
    })
}


//formato valuta
function formatCurrency(amount) {
    return '€ ' + amount.toFixed(2).replace('.', ',');
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



    updateDisplay();
    updateLastUpdate();

    depositBtn.addEventListener('click', () => handleTransaction('deposit'));
    withdrawBtn.addEventListener('click', () => handleTransaction('withdraw'));


});

