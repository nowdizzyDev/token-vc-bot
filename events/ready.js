const { ActivityType } = require('discord.js');
const config = require('../config.json');
const { connectVoice } = require('../utils/vcManager');
const { decryptToken } = require('../utils/encryption');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} aktif`);

        const p = config.presence;
        client.user.setPresence({
            activities: [{ name: p.activityName, type: ActivityType[p.activityType] ?? ActivityType.Playing }],
            status: p.status || 'online'
        });

        await reconnectAll(client);
    }
};

async function reconnectAll(client) {
    const db = client.db.getDatabase();

    const normalTokens = db.prepare('SELECT * FROM normal_tokens WHERE is_active = 1').all();
    for (const row of normalTokens) {
        try {
            const token = decryptToken(row.token);
            connectVoice(token, row.guild_id, row.channel_id, false);
            console.log(`✅ Normal token yeniden bağlandı: ${row.discord_username || row.user_id}`);
            await delay(2000);
        } catch (e) {
            console.error(`❌ Normal token hatası (silinecek):`, e.message);
            db.prepare('DELETE FROM normal_tokens WHERE id = ?').run(row.id);
        }
    }

    const streamerTokens = db.prepare('SELECT * FROM streamer_tokens WHERE is_active = 1').all();
    for (const row of streamerTokens) {
        try {
            const token = decryptToken(row.token);
            connectVoice(token, row.guild_id, row.channel_id, true);
            console.log(`✅ Streamer token yeniden bağlandı: ${row.discord_username || row.user_id}`);
            await delay(2000);
        } catch (e) {
            console.error(`❌ Streamer token hatası (silinecek):`, e.message);
            db.prepare('DELETE FROM streamer_tokens WHERE id = ?').run(row.id);
        }
    }

    const presenceRows = db.prepare('SELECT * FROM presence_settings WHERE is_active = 1').all();
    for (const row of presenceRows) {
        try {
            const token = decryptToken(row.token);
            client.presenceManager.createPresenceConnection(
                token,
                row.activity_name, row.details, row.state, row.timestamp_start,
                row.large_image, row.large_text, row.small_image, row.small_text,
                row.button1_label, row.button1_url, row.button2_label, row.button2_url,
                row.activity_type ?? 0
            );
            console.log(`✅ Presence yeniden bağlandı: ${row.user_id}`);
            await delay(2000);
        } catch (e) {
            console.error(`❌ Presence hatası (silinecek):`, e.message);
            db.prepare('DELETE FROM presence_settings WHERE id = ?').run(row.id);
        }
    }
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));
