const {
    MessageFlags,
    TextDisplayBuilder,
    ButtonStyle,
    ContainerBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ComponentType,
} = require('discord.js');
const config = require('../config.json');
const emoji = require('../emoji.json');

module.exports = {
    name: 'paket-tanımla',
    description: 'Kullanıcılara paket tanımlar',
    async execute(message, client) {
        if (message.author.id !== config.ownerId) {
            return message.reply({ content: `${emoji.carpi} Bu komutu kullanma yetkiniz yok!`, allowedMentions: { repliedUser: false } });
        }

        const userMention = message.mentions.users.first();
        if (!userMention) {
            return message.reply({ content: `${emoji.carpi} Kullanım: \`.paket-tanımla @kullanıcı\``, allowedMentions: { repliedUser: false } });
        }

        try {
            const member = await message.guild.members.fetch(userMention.id);
            const packageRoles = config.packageRoles || {};

            const currentPackages = Object.keys(packageRoles)
                .filter(roleId => member.roles.cache.has(roleId))
                .map(roleId => `<@&${roleId}>`);

            const packageList = Object.entries(packageRoles)
                .map(([roleId, pkg]) => `${emoji.yildiz} <@&${roleId}> → **${pkg.limit}** token`)
                .join('\n');

            const sep = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${emoji.settings} Paket Yönetimi\n${emoji.acik} **Sistem Durumu:** \`Aktif / Çevrimiçi\``
                ))
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${emoji.nokta} **Kullanıcı Bilgisi**\n` +
                    `> ${emoji.tac4} **Hedef:** ${userMention}\n` +
                    `> ${emoji.tac4} **ID:** ${userMention.id}\n` +
                    `> ${emoji.tac4} **Mevcut Paket:** ${currentPackages.length > 0 ? currentPackages.join(', ') : 'Yok'}`
                ))
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${emoji.onay} **Mevcut Paketler:**\n${packageList || 'Paket bulunamadı'}`
                ))
                .addSeparatorComponents(sep)
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('package_select')
                            .setPlaceholder('📦 Paket seçiniz...')
                            .addOptions(
                                Object.entries(packageRoles).map(([roleId, pkg]) => ({
                                    label: pkg.name,
                                    description: `${pkg.limit} token limiti`,
                                    value: roleId,
                                    emoji: { id: '1435337481821224960', name: 'yildiz', animated: true }
                                }))
                            )
                    )
                );

            const response = await message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container],
                allowedMentions: { repliedUser: false }
            });

            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: `${emoji.carpi} Bu menüyü sadece komutu kullanan kişi kullanabilir!`, flags: 64 });
                }

                const selectedRoleId = interaction.values[0];
                const packageInfo = packageRoles[selectedRoleId];

                try {
                    const role = await message.guild.roles.fetch(selectedRoleId);
                    if (!role) return interaction.reply({ content: `${emoji.carpi} Rol bulunamadı!`, flags: 64 });

                    const oldPackages = [];
                    for (const roleId of Object.keys(packageRoles)) {
                        if (member.roles.cache.has(roleId) && roleId !== selectedRoleId) {
                            const oldRole = await message.guild.roles.fetch(roleId);
                            if (oldRole) { await member.roles.remove(oldRole); oldPackages.push(`<@&${roleId}>`); }
                        }
                    }

                    await member.roles.add(role);

                    const db = client.db.getDatabase();
                    db.prepare(`INSERT OR REPLACE INTO user_packages (user_id, package_name, package_limit, role_id, assigned_by, assigned_at, is_active) VALUES (?, ?, ?, ?, ?, datetime('now'), 1)`)
                        .run(userMention.id, packageInfo.name, packageInfo.limit, selectedRoleId, message.author.id);

                    const successContainer = new ContainerBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `## ${emoji.tik} Paket Başarıyla Atandı!\n` +
                            `> ${emoji.tac4} **Kullanıcı:** ${userMention}\n` +
                            `> ${emoji.yildiz} **Paket:** <@&${selectedRoleId}>\n` +
                            `> ${emoji.stats} **Limit:** ${packageInfo.limit} token\n` +
                            `> ${emoji.yesil} **Kaldırılan:** ${oldPackages.length > 0 ? oldPackages.join(', ') : 'Yok'}\n` +
                            `> ${emoji.tac4} **Zaman:** <t:${Math.floor(Date.now() / 1000)}:f>`
                        ));

                    await interaction.update({ flags: MessageFlags.IsComponentsV2, components: [successContainer] });
                } catch (error) {
                    console.error('[paket-tanımla]', error);
                    await interaction.reply({ content: `${emoji.carpi} Hata: ${error.message}`, flags: 64 });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    try { await response.edit({ components: [] }); } catch {}
                }
            });

        } catch (error) {
            console.error('[paket-tanımla]', error);
            await message.reply(`${emoji.carpi} Hata: ${error.message}`);
        }
    }
};
