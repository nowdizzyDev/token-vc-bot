const WebSocket = require('ws');
const config = require('../config.json');
const { encryptToken, decryptToken } = require('./encryption');

const activeConnections = new Map();

function getHeaders(token) {
    return {
        'Authorization': token,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
}

async function validateToken(token) {
    const res = await fetch('https://discord.com/api/v10/users/@me', { headers: getHeaders(token) });
    if (!res.ok) return { valid: false, error: `HTTP ${res.status}` };
    const user = await res.json();
    return { valid: true, user };
}

function connectVoice(token, guildId, channelId, streamer = false) {
    const key = `${token.substring(0, 20)}_${guildId}`;

    if (activeConnections.has(key)) {
        try { activeConnections.get(key).close(); } catch {}
        activeConnections.delete(key);
    }

    const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
    let heartbeatInterval;

    ws.on('message', (data) => {
        const payload = JSON.parse(data.toString());

        if (payload.op === 10) {
            heartbeatInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 1, d: null }));
            }, payload.d.heartbeat_interval);

            ws.send(JSON.stringify({
                op: 2,
                d: {
                    token,
                    capabilities: 30717,
                    intents: 0,
                    properties: {
                        os: 'Windows',
                        browser: streamer ? 'Discord Client' : 'Chrome',
                        device: streamer ? 'discord-client' : ''
                    }
                }
            }));
        }

        if (payload.op === 0 && payload.t === 'READY') {
            ws.send(JSON.stringify({
                op: 4,
                d: {
                    guild_id: guildId,
                    channel_id: channelId,
                    self_mute: false,
                    self_deaf: false,
                    self_video: streamer,
                    self_stream: streamer
                }
            }));
        }
    });

    ws.on('close', () => {
        clearInterval(heartbeatInterval);
        activeConnections.delete(key);
    });

    ws.on('error', () => {
        clearInterval(heartbeatInterval);
        activeConnections.delete(key);
    });

    activeConnections.set(key, ws);
    return key;
}

function disconnectVoice(token) {
    const prefix = token.substring(0, 20);
    let disconnected = false;
    for (const [key, ws] of activeConnections.entries()) {
        if (key.startsWith(prefix + '_')) {
            try { ws.close(); } catch {}
            activeConnections.delete(key);
            disconnected = true;
        }
    }
    return disconnected;
}

async function handleVcJoin(interaction, client, streamer, bulk = false) {
    const { createVcJoinModal, createMultipleTokensModal } = require('./modals');

    if (interaction.isButton()) {
        return await interaction.showModal(bulk ? createMultipleTokensModal(streamer) : createVcJoinModal(streamer));
    }

    if (interaction.isModalSubmit()) {
        await interaction.deferReply({ flags: 64 });
        const db = client.db.getDatabase();
        const userId = interaction.user.id;

        const userPackage = db.prepare('SELECT * FROM user_packages WHERE user_id = ? AND is_active = 1').get(userId);
        if (!userPackage) {
            return await interaction.editReply({ content: '<a:carpi:1432011779222798376> Aktif bir paketin bulunmuyor!' });
        }

        const usedCount = (db.prepare('SELECT COUNT(*) as c FROM normal_tokens WHERE user_id = ? AND is_active = 1').get(userId)?.c || 0)
            + (db.prepare('SELECT COUNT(*) as c FROM streamer_tokens WHERE user_id = ? AND is_active = 1').get(userId)?.c || 0);

        if (bulk) {
            const tokensRaw = interaction.fields.getTextInputValue('tokens_list').trim();
            const guildId = interaction.fields.getTextInputValue('guild_id').trim();
            const channelId = interaction.fields.getTextInputValue('channel_id').trim();
            const tokens = tokensRaw.split('\n').map(t => t.trim()).filter(Boolean);

            const available = userPackage.package_limit - usedCount;
            if (available <= 0) {
                return await interaction.editReply({ content: `<a:carpi:1432011779222798376> Paket limitine ulaştın! (${usedCount}/${userPackage.package_limit})` });
            }

            const toProcess = tokens.slice(0, available);
            let success = 0, fail = 0;

            for (const token of toProcess) {
                try {
                    const validation = await validateToken(token);
                    if (!validation.valid) { fail++; continue; }

                    const encryptedToken = encryptToken(token);
                    const existing = db.prepare('SELECT id FROM normal_tokens WHERE token = ? AND is_active = 1').get(encryptedToken)
                        || db.prepare('SELECT id FROM streamer_tokens WHERE token = ? AND is_active = 1').get(encryptedToken);
                    if (existing) { fail++; continue; }

                    connectVoice(token, guildId, channelId, streamer);
                    const table = streamer ? 'streamer_tokens' : 'normal_tokens';
                    db.prepare(`INSERT INTO ${table} (user_id, token, guild_id, channel_id, discord_username) VALUES (?, ?, ?, ?, ?)`)
                        .run(userId, encryptedToken, guildId, channelId, validation.user.username);

                    const p = config.userPresence;
                    db.prepare(`INSERT OR REPLACE INTO presence_settings (user_id, token, activity_name, details, state, activity_type, status, timestamp_start, large_image, large_text, small_image, small_text, button1_label, button1_url, button2_label, button2_url, is_active) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
                        .run(userId, encryptedToken, p.activityName, p.details || null, p.state || null, p.status || 'online', Date.now(), p.largeImage || null, p.largeText || null, p.smallImage || null, p.smallText || null, p.button1Label || null, p.button1Url || null, p.button2Label || null, p.button2Url || null);

                    client.presenceManager.createPresenceConnection(token, p.activityName, p.details || null, p.state || null, Date.now(), p.largeImage || null, p.largeText || null, p.smallImage || null, p.smallText || null, p.button1Label || null, p.button1Url || null, p.button2Label || null, p.button2Url || null, 0);
                    success++;
                } catch { fail++; }
            }

            const skipped = tokens.length - toProcess.length;
            return await interaction.editReply({
                content: `<a:tik:1436983254929510400> Toplu ekleme tamamlandı!\n> ✅ Başarılı: **${success}**\n> ❌ Başarısız: **${fail}**${skipped > 0 ? `\n> ⚠️ Limit nedeniyle atlandı: **${skipped}**` : ''}`
            });
        }

        const token = interaction.fields.getTextInputValue('user_token').trim();
        const guildId = interaction.fields.getTextInputValue('guild_id').trim();
        const channelId = interaction.fields.getTextInputValue('channel_id').trim();

        if (usedCount >= userPackage.package_limit) {
            return await interaction.editReply({ content: `<a:carpi:1432011779222798376> Paket limitine ulaştın! (${usedCount}/${userPackage.package_limit})` });
        }

        const validation = await validateToken(token);
        if (!validation.valid) {
            return await interaction.editReply({ content: `<a:carpi:1432011779222798376> Geçersiz token: ${validation.error}` });
        }

        const username = validation.user.username;
        const encryptedToken = encryptToken(token);

        const existing = db.prepare('SELECT id FROM normal_tokens WHERE token = ? AND is_active = 1').get(encryptedToken)
            || db.prepare('SELECT id FROM streamer_tokens WHERE token = ? AND is_active = 1').get(encryptedToken);
        if (existing) {
            return await interaction.editReply({ content: '<a:carpi:1432011779222798376> Bu token zaten aktif olarak kullanılıyor!' });
        }

        connectVoice(token, guildId, channelId, streamer);

        const table = streamer ? 'streamer_tokens' : 'normal_tokens';
        db.prepare(`INSERT INTO ${table} (user_id, token, guild_id, channel_id, discord_username) VALUES (?, ?, ?, ?, ?)`)
            .run(userId, encryptedToken, guildId, channelId, username);

        const p = config.userPresence;
        db.prepare(`INSERT OR REPLACE INTO presence_settings (user_id, token, activity_name, details, state, activity_type, status, timestamp_start, large_image, large_text, small_image, small_text, button1_label, button1_url, button2_label, button2_url, is_active) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
            .run(userId, encryptedToken, p.activityName, p.details || null, p.state || null, p.status || 'online', Date.now(), p.largeImage || null, p.largeText || null, p.smallImage || null, p.smallText || null, p.button1Label || null, p.button1Url || null, p.button2Label || null, p.button2Url || null);

        client.presenceManager.createPresenceConnection(token, p.activityName, p.details || null, p.state || null, Date.now(), p.largeImage || null, p.largeText || null, p.smallImage || null, p.smallText || null, p.button1Label || null, p.button1Url || null, p.button2Label || null, p.button2Url || null, 0);

        await interaction.editReply({
            content: `<a:tik:1436983254929510400> **${username}** ${streamer ? 'streamer' : 'normal'} modda ses kanalına bağlandı ve presence ayarlandı!`
        });
    }
}

async function handleVcDisconnect(interaction, client) {
    const { createVcDisconnectModal } = require('./modals');

    if (interaction.isButton()) {
        return await interaction.showModal(createVcDisconnectModal());
    }

    if (interaction.isModalSubmit()) {
        await interaction.deferReply({ flags: 64 });
        const token = interaction.fields.getTextInputValue('user_token').trim();

        const disconnected = disconnectVoice(token);
        client.presenceManager.stopPresenceConnection(token);
        const db = client.db.getDatabase();
        const encryptedToken = encryptToken(token);
        const existed = db.prepare('SELECT id FROM normal_tokens WHERE token = ?').get(encryptedToken)
            || db.prepare('SELECT id FROM streamer_tokens WHERE token = ?').get(encryptedToken);

        db.prepare('DELETE FROM normal_tokens WHERE token = ?').run(encryptedToken);
        db.prepare('DELETE FROM streamer_tokens WHERE token = ?').run(encryptedToken);
        db.prepare('DELETE FROM presence_settings WHERE token = ?').run(encryptedToken);

        await interaction.editReply({
            content: (disconnected || existed)
                ? `<a:tik:1436983254929510400> Token kaldırıldı, bağlantılar kesildi!`
                : `<a:warning:1438236166552944724> Bu token için aktif bağlantı bulunamadı.`
        });
    }
}

module.exports = { handleVcJoin, handleVcDisconnect, connectVoice };
