const {
    MessageFlags,
    TextDisplayBuilder,
    ButtonStyle,
    ContainerBuilder,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
} = require('discord.js');
const config = require('../config.json');
const e = require('../emoji.json');

module.exports = {
    name: 'streamer-menu',
    description: 'Streamer token yönetim menüsünü gösterir',
    async execute(message, client) {
        try {
            const sep = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${e.settings} Gelişmiş Yayın & Video Modülü\n${e.acik} **Sistem Durumu:** \`Aktif / Çevrimiçi\``
                ))
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${e.nokta} **Sistem Açıklaması**\n` +
                    `Bu panel ile Discord hesaplarınızda otomatik olarak yayın başlatabilirsiniz. Birden fazla token ve kanal ID'si girerek toplu yayıncı işlemi başlatın.`
                ))
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${e.onay} **Özellikler:**\n` +
                    `> ${e.ok} **Çoklu Token:** Birden fazla hesapla aynı anda işlem başlatın\n` +
                    `> ${e.ok} **Toplu Ekleme:** Birden fazla yayıncı hesabı ekleyin\n` +
                    `> ${e.ok} **İlerleme Takibi:** Başarılı/başarısız istek sayılarını görün\n` +
                    `> ${e.ok} **Anında Durdurma:** İstediğiniz zaman işlemi sonlandırın`
                ))
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${e.X} **Uyarı:**\nÇok fazla istek göndermek hesabınızın kısıtlanmasına neden olabilir!\n\n${e.saat} İşlem yapmak için aşağıdaki butonları kullanın.`
                ))
                .addSeparatorComponents(sep)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `### ${e.artı} Tek Yayıncı Ekle\nBir yayıncı hesabı ekleyin.`
                        ))
                        .setButtonAccessory(b => b.setCustomId('streamer_video').setLabel('Ekle').setStyle(ButtonStyle.Success).setEmoji({ id: '1436983254929510400', name: 'tik', animated: true }))
                )
                .addSeparatorComponents(sep)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `### ${e.member} Çoklu Yayıncı Ekle\nBirden fazla yayıncı hesabı ekleyin.`
                        ))
                        .setButtonAccessory(b => b.setCustomId('multiple_tokens_streamer').setLabel('Toplu Ekle').setStyle(ButtonStyle.Primary).setEmoji({ id: '1438239802381308045', name: 'helpers', animated: true }))
                )
                .addSeparatorComponents(sep)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `### ${e.X} Yayıncı Kaldır\nBelirli veya tüm yayıncı işlemlerini sonlandırın.`
                        ))
                        .setButtonAccessory(b => b.setCustomId('remove_tokens').setLabel('Kaldır').setStyle(ButtonStyle.Danger).setEmoji({ id: '1432011779222798376', name: 'carpi', animated: true }))
                )
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `**${e.onay} Destek:** Sorularınız için geliştiricilerimizle iletişime geçin: <@${config.ownerId}>`
                ));

            await message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
        } catch (error) {
            console.error('[streamer-menu]', error);
            await message.reply({ content: `${e.carpi} Hata: ${error.message}`, allowedMentions: { repliedUser: false } });
        }
    }
};
