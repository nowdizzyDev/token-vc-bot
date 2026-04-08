# altyapi-ez

Discord ses kanalı ve yayın yönetim botu. Birden fazla Discord hesabını (token) otomatik olarak ses kanalına bağlar, yayın başlatır ve özel presence ayarları yapar.

---

## Kurulum

**Gereksinim:** Node.js 18+

```bash
npm install
node index.js
```

---

## Yapılandırma

`config.example.json` dosyasını `config.json` olarak kopyalayın ve doldurun:


| Alan | Açıklama |
|------|----------|
| `token` | Discord bot tokeni |
| `prefix` | Komut öneki (varsayılan: `.`) |
| `ownerId` | Bot sahibinin Discord ID'si |
| `packages` | Rol ID → paket adı ve token limiti eşleşmesi |

### `presence` — Botun kendi durumu
Botun Discord'da görünen aktivitesi.
`activityType` değerleri: `Playing`, `Streaming`, `Listening`, `Watching`, `Competing`

### `userPresence` — Kullanıcı hesaplarının durumu
Token eklenen Discord hesaplarına uygulanacak Rich Presence ayarları.

| Alan | Açıklama |
|------|----------|
| `applicationId` | Discord Developer Portal'dan alınan uygulama ID'si (ikon için) |
| `status` | Hesabın durumu: `online`, `idle`, `dnd` |
| `activityName` | Aktivite başlığı |
| `details` | İkinci satır metin |
| `state` | Üçüncü satır metin |
| `timestamp` | `true` ise bağlanma zamanından itibaren süre sayacı gösterir |
| `largeImage` | Burayı Boş Bırakın Icon için |
| `largeText` | Büyük resmin üzerine gelindiğinde çıkan yazı |
| `button1Label` / `button1Url` | Birinci buton |
| `button2Label` / `button2Url` | İkinci buton |

---

## Komutlar

Prefix varsayılan olarak `.` dir.

### `.token-menu`
Ses Afk sistemi panelini açar.

- **Tekli Hesap Ekle** → Tek bir Discord tokenini ses kanalına bağlar
- **Toplu Hesap Ekle** → Birden fazla tokeni aynı anda bağlar
- **Hesap Çıkar** → Bağlı hesapları kanaldan çıkarır

### `.streamer-menu`
Yayın (streamer) sistemi panelini açar.

- **Tek Yayıncı Ekle** → Bir tokeni yayın modunda ses kanalına bağlar
- **Çoklu Yayıncı Ekle** → Birden fazla tokeni yayın modunda bağlar
- **Yayıncı Kaldır** → Yayın bağlantılarını sonlandırır

### `.paket-tanımla @kullanıcı`
*(Sadece bot sahibi kullanabilir)*

Kullanıcıya paket atar. Paket, o kullanıcının kaç token ekleyebileceğini belirler.

```
.paket-tanımla @kullanıcı
```

Açılan menüden paket seçilir. Eski paket rolü otomatik kaldırılır, yeni paket rolü atanır.

![Resim](https://i.ibb.co/SwgRKWR4/Screenshot-20260408-210500-Discord.jpg)

---

## Nasıl Çalışır

1. Kullanıcı `.token-menu` veya `.streamer-menu` komutunu çalıştırır
2. Açılan panelden **Ekle** butonuna tıklar
3. Açılan formda Discord token, sunucu ID ve kanal ID girilir
4. Bot, girilen token ile Discord'a WebSocket bağlantısı kurar ve hesabı ses kanalına bağlar
5. Bağlantılar veritabanına kaydedilir; bot yeniden başlatıldığında otomatik olarak yeniden bağlanır

**Token limiti:** Her kullanıcının ekleyebileceği maksimum token sayısı, kendisine atanan pakete göre belirlenir.

---

## Veritabanı

SQLite (`data.db`) kullanılır.

| Tablo | İçerik |
|-------|--------|
| `user_packages` | Kullanıcı paket bilgileri ve token limitleri |
| `normal_tokens` | Ses kanalına bağlı normal tokenler |
| `streamer_tokens` | Yayın modunda bağlı tokenler |
| `presence_settings` | Özel presence ayarları |

---

## Proje Yapısı

```
altyapi-ez/
├── index.js                  # Bot giriş noktası
├── config.json               # Yapılandırma (gitignore'da)
├── config.example.json       # Yapılandırma şablonu
├── commands/
│   ├── token-menu.js         # Ses afk paneli
│   ├── streamer-menu.js      # Yayın paneli
│   └── paket-tanımla.js      # Paket atama
├── events/
│   ├── ready.js              # Bot hazır olduğunda çalışır
│   ├── messageCreate.js      # Komut işleyici
│   └── interactionCreate.js  # Buton/modal işleyici
└── utils/
    ├── database.js           # SQLite yönetimi
    ├── vcManager.js          # Ses kanalı bağlantı yönetimi
    ├── presence.js           # Presence yönetimi
    ├── encryption.js         # Token şifreleme/çözme
    └── modals.js             # Discord modal formları
```
