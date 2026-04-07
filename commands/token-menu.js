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
    name: 'token-menu',
    description: 'Token yönetim menüsünü gösterir',
    async execute(message, client) {
        try {
            const sep = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${e.settings} Ses Afk Sistemi\n${e.acik} **Sistem Durumu:** \`Aktif / Çevrimiçi\``
                ))
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${e.nokta} **Sistem Açıklaması**\n` +
                    `Bu panel ile Discord hesaplarınızı otomatik olarak sesli kanala bağlayabilirsiniz. Birden fazla token ve kanal ID'si girerek toplu hesap bağlama işlemi başlatın.`
                ))
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${e.onay} **Özellikler:**\n` +
                    `> ${e.ok} **Çoklu Token:** Birden fazla hesapla aynı anda işlem başlatın\n` +
                    `> ${e.ok} **Toplu Ekleme:** Birden fazla hesabı aynı anda bağlayın\n` +
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
                            `### ${e.artı} Tekli Hesap Ekle\nTek bir Discord hesabını sisteme ekleyin.`
                        ))
                        .setButtonAccessory(b => b.setCustomId('normal_single_token').setLabel('Ekle').setStyle(ButtonStyle.Success).setEmoji({ id: '1436983254929510400', name: 'tik', animated: true }))
                )
                .addSeparatorComponents(sep)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `### ${e.member} Toplu Hesap Ekle\nBirden fazla Discord hesabını aynı anda ekleyin.`
                        ))
                        .setButtonAccessory(b => b.setCustomId('multiple_tokens').setLabel('Toplu Ekle').setStyle(ButtonStyle.Primary).setEmoji({ id: '1438239802381308045', name: 'helpers', animated: true }))
                )
                .addSeparatorComponents(sep)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `### ${e.X} Hesap Çıkar\nBelirli veya tüm hesap işlemlerini sonlandırın.`
                        ))
                        .setButtonAccessory(b => b.setCustomId('remove_tokens').setLabel('Çıkar').setStyle(ButtonStyle.Danger).setEmoji({ id: '1432011779222798376', name: 'carpi', animated: true }))
                )
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `**${e.onay} Destek:** Sorularınız için geliştiricilerimizle iletişime geçin: <@${config.ownerId}>`
                ));

            await message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
        } catch (error) {
            console.error('[token-menu]', error);
            await message.reply({ content: `${e.carpi} Hata: ${error.message}`, allowedMentions: { repliedUser: false } });
        }
    }
};
