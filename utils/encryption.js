const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEY_FILE = path.join(__dirname, '../.encryption_key');

function getOrCreateKey() {
    try {
        if (fs.existsSync(KEY_FILE)) {
            return fs.readFileSync(KEY_FILE);
        } else {
            const key = crypto.randomBytes(32);
            fs.writeFileSync(KEY_FILE, key);
            console.log('🔐 Yeni şifreleme anahtarı oluşturuldu ve kaydedildi.');
            return key;
        }
    } catch (error) {
        console.error('Şifreleme anahtarı yüklenirken hata:', error);
        throw error;
    }
}

const ENCRYPTION_KEY = getOrCreateKey();

function encryptToken(token) {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedToken) {
    if (!encryptedToken || typeof encryptedToken !== 'string') throw new Error('Geçersiz token verisi');
    const algorithm = 'aes-256-cbc';
    const parts = encryptedToken.split(':');
    if (parts.length !== 2) throw new Error('Token formatı hatalı');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    if (iv.length !== 16) throw new Error('IV uzunluğu hatalı');
    const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    encryptToken,
    decryptToken
};
