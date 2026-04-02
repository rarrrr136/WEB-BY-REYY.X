// ============================================
// 🔥 REYY.X - BOT COMMAND CENTER
// ============================================

class BotManager {
    constructor() { this.bots = []; }
    
    addBot(bot) { this.bots.push(bot); }
    
    removeBot(botId) {
        const idx = this.bots.findIndex(b=>b.id===botId);
        if(idx!==-1){ this.bots[idx].stop(); this.bots.splice(idx,1); }
    }
    
    getStats() {
        return { alive: this.bots.filter(b=>b.alive).length, dead: this.bots.filter(b=>!b.alive).length };
    }
}

const botManager = new BotManager();
window.botManager = botManager;

addLog('🤖 BOT COMMAND CENTER ONLINE', 'bot');