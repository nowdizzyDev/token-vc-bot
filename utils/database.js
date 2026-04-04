const Database = require('better-sqlite3');
const path = require('path');

class DB {
    constructor(dbPath = './data.db') {
        this.db = new Database(path.resolve(dbPath));
        this.db.pragma('journal_mode = WAL');
        this.setup();
    }

    setup() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS user_packages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL UNIQUE,
                package_name TEXT NOT NULL,
                package_limit INTEGER NOT NULL,
                used INTEGER DEFAULT 0,
                role_id TEXT NOT NULL,
                assigned_by TEXT NOT NULL,
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS normal_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                token TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                discord_username TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS streamer_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                token TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                discord_username TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS presence_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                token TEXT NOT NULL,
                activity_name TEXT NOT NULL,
                details TEXT,
                state TEXT,
                activity_type INTEGER DEFAULT 0,
                status TEXT DEFAULT 'online',
                timestamp_start INTEGER,
                large_image TEXT,
                large_text TEXT,
                small_image TEXT,
                small_text TEXT,
                button1_label TEXT,
                button1_url TEXT,
                button2_label TEXT,
                button2_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            );
        `);

        const safe = (sql) => { try { this.db.exec(sql); } catch {} };
        safe('ALTER TABLE normal_tokens ADD COLUMN discord_username TEXT');
        safe('ALTER TABLE streamer_tokens ADD COLUMN discord_username TEXT');
    }

    getDatabase() {
        return this.db;
    }
}

module.exports = DB;
