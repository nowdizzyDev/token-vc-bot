const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function createVcJoinModal(streamer) {
    return new ModalBuilder()
        .setCustomId(streamer ? 'vc_join_streamer_modal' : 'vc_join_normal_modal')
        .setTitle(streamer ? 'Streamer Olarak Bağlan' : 'Normal Olarak Bağlan')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('user_token').setLabel('Discord Token').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('guild_id').setLabel('Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('channel_id').setLabel('Ses Kanalı ID').setStyle(TextInputStyle.Short).setRequired(true)
            )
        );
}

function createVcDisconnectModal() {
    return new ModalBuilder()
        .setCustomId('vc_disconnect_modal')
        .setTitle('Kanaldan Çık')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('user_token').setLabel('Discord Token').setStyle(TextInputStyle.Short).setRequired(true)
            )
        );
}

function createMultipleTokensModal(streamer) {
    return new ModalBuilder()
        .setCustomId(streamer ? 'multiple_tokens_streamer_modal' : 'multiple_tokens_modal')
        .setTitle(streamer ? 'Toplu Streamer Ekle' : 'Toplu Token Ekle')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('tokens_list').setLabel('Tokenlar (her satıra bir token)').setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder('token1\ntoken2\ntoken3')
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('guild_id').setLabel('Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('channel_id').setLabel('Ses Kanalı ID').setStyle(TextInputStyle.Short).setRequired(true)
            )
        );
}

module.exports = { createVcJoinModal, createVcDisconnectModal, createMultipleTokensModal };
