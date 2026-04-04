const WebSocket = require('ws');

class PresenceManager {
    constructor() {
        this.activeConnections = new Map();
        this.manuallyStoppedTokens = new Set();
        this.failedRetries = new Map();
    }

    createPresenceConnection(token, activityName, details, state, timestampStart, largeImage = null, largeText = null, smallImage = null, smallText = null, button1Label = null, button1Url = null, button2Label = null, button2Url = null, activityType = 0) {
        const connKey = `presence_${token}`;

        if (this.activeConnections.has(connKey)) {
            const existing = this.activeConnections.get(connKey);
            if (existing?.ws?.readyState === WebSocket.OPEN) return;
            this.activeConnections.delete(connKey);
        }

        this.manuallyStoppedTokens.delete(token);

        const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
        let heartbeatInterval = null;

        const auth = {
            op: 2,
            d: {
                token,
                capabilities: 30717,
                intents: 0,
                properties: {
                    os: 'Windows', browser: 'Discord', device: '',
                    system_locale: 'tr',
                    browser_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9163 Chrome/120.0.6099.291 Electron/28.2.10 Safari/537.36',
                    browser_version: '28.2.10', os_version: '10.0.19045',
                    release_channel: 'stable', client_build_number: 368929, native_build_number: 57008, client_event_source: null
                },
                presence: { since: null, activities: [this._buildActivity(activityName, activityType, details, state, timestampStart, largeImage, largeText, smallImage, smallText, button1Label, button1Url, button2Label, button2Url)], status: 'online', afk: false }
            }
        };

        const sendPresence = () => {
            if (ws.readyState !== WebSocket.OPEN) return;
            ws.send(JSON.stringify({
                op: 3,
                d: { since: null, activities: [this._buildActivity(activityName, activityType, details, state, timestampStart, largeImage, largeText, smallImage, smallText, button1Label, button1Url, button2Label, button2Url)], status: 'online', afk: false }
            }));
        };

        ws.on('message', (data) => {
            const { op, d, t } = JSON.parse(data);

            if (op === 10) {
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                const interval = Math.floor(d.heartbeat_interval * (Math.random() * 0.5 + 0.5));
                heartbeatInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 1, d: null }));
                }, interval);
                this.activeConnections.set(connKey, { ws, heartbeatInterval, settings: { activityName, activityType, details, state, timestampStart, largeImage, largeText, smallImage, smallText, button1Label, button1Url, button2Label, button2Url }, type: 'presence' });
                ws.send(JSON.stringify(auth));
            }

            if (op === 0 && t === 'READY') {
                sendPresence();
                const conn = this.activeConnections.get(connKey);
                if (conn) {
                    if (conn.presenceRefreshInterval) clearInterval(conn.presenceRefreshInterval);
                    conn.presenceRefreshInterval = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) sendPresence();
                    }, 30000);
                    this.activeConnections.set(connKey, conn);
                }
                console.log(`✅ Presence bağlandı: ${token.substring(0, 10)}...`);
            }
        });

        ws.on('close', (code) => {
            if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
            const conn = this.activeConnections.get(connKey);
            if (conn?.presenceRefreshInterval) clearInterval(conn.presenceRefreshInterval);

            if (conn?.manualStop || this.manuallyStoppedTokens.has(token) || code === 1001) {
                this.activeConnections.delete(connKey);
                return;
            }

            if (code === 4004) {
                this.activeConnections.delete(connKey);
                const retries = this.failedRetries.get(token) || 0;
                if (retries >= 3) { this.failedRetries.delete(token); this.manuallyStoppedTokens.add(token); return; }
                this.failedRetries.set(token, retries + 1);
                setTimeout(() => this._reconnect(token, conn?.settings || { activityName, activityType, details, state, timestampStart, largeImage, largeText, smallImage, smallText, button1Label, button1Url, button2Label, button2Url }), 10000);
                return;
            }

            this.activeConnections.delete(connKey);
            setTimeout(() => this._reconnect(token, conn?.settings || { activityName, activityType, details, state, timestampStart, largeImage, largeText, smallImage, smallText, button1Label, button1Url, button2Label, button2Url }), 5000);
        });

        ws.on('error', (err) => console.error(`Presence WS hatası (${token.substring(0, 10)}...):`, err.message));
    }

    _reconnect(token, s) {
        if (this.manuallyStoppedTokens.has(token)) return;
        this.createPresenceConnection(token, s.activityName, s.details, s.state, s.timestampStart, s.largeImage, s.largeText, s.smallImage, s.smallText, s.button1Label, s.button1Url, s.button2Label, s.button2Url, s.activityType);
    }

    _buildActivity(activityName, activityType, details, state, timestampStart, largeImage, largeText, smallImage, smallText, button1Label, button1Url, button2Label, button2Url) {
        const activity = { name: activityName, type: activityType || 0, details, state, timestamps: { start: timestampStart } };

        if (largeImage || smallImage) {
            const fmt = (url) => {
                if (!url) return null;
                if (url.startsWith('mp:') || !url.startsWith('http')) return url;
                return `mp:external/${url.replace(/^https?:\/\//, '')}`;
            };
            activity.assets = {};
            if (largeImage) { activity.assets.large_image = fmt(largeImage); if (largeText) activity.assets.large_text = largeText; }
            if (smallImage) { activity.assets.small_image = fmt(smallImage); if (smallText) activity.assets.small_text = smallText; }
        }

        if (button1Label && button1Url) {
            activity.buttons = [button1Label];
            activity.metadata = { button_urls: [button1Url] };
            if (button2Label && button2Url) { activity.buttons.push(button2Label); activity.metadata.button_urls.push(button2Url); }
        }

        return activity;
    }

    stopPresenceConnection(token) {
        const connKey = `presence_${token}`;
        const conn = this.activeConnections.get(connKey);
        if (conn) {
            conn.manualStop = true;
            this.activeConnections.set(connKey, conn);
            if (conn.heartbeatInterval) clearInterval(conn.heartbeatInterval);
            if (conn.presenceRefreshInterval) clearInterval(conn.presenceRefreshInterval);
            try { conn.ws.close(); } catch {}
            this.activeConnections.delete(connKey);
            this.manuallyStoppedTokens.add(token);
            return true;
        }
        return false;
    }
}

module.exports = PresenceManager;
