module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;

        const { customId } = interaction;
        const { handleVcJoin, handleVcDisconnect } = require('../utils/vcManager');

        if (customId === 'normal_single_token' || customId === 'vc_join_normal' || customId === 'vc_join_normal_modal') {
            return handleVcJoin(interaction, client, false);
        }

        if (customId === 'streamer_video' || customId === 'vc_join_streamer' || customId === 'vc_join_streamer_modal') {
            return handleVcJoin(interaction, client, true);
        }

        if (customId === 'multiple_tokens' || customId === 'multiple_tokens_modal') {
            return handleVcJoin(interaction, client, false, true);
        }

        if (customId === 'multiple_tokens_streamer' || customId === 'multiple_tokens_streamer_modal') {
            return handleVcJoin(interaction, client, true, true);
        }

        if (customId === 'remove_tokens' || customId === 'vc_disconnect' || customId === 'vc_disconnect_modal') {
            return handleVcDisconnect(interaction, client);
        }

        if (customId === 'package_select') {
            const { handlePackageSelect } = require('../utils/vcManager');
            if (handlePackageSelect) return handlePackageSelect(interaction, client);
        }
    }
};
