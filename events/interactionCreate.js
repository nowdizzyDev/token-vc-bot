module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        const { customId } = interaction;
        const { handleVcJoin, handleVcDisconnect } = require('../utils/vcManager');

        if (customId === 'vc_join_streamer' || customId === 'vc_join_streamer_modal') {
            return handleVcJoin(interaction, client, true);
        }
        if (customId === 'vc_join_normal' || customId === 'vc_join_normal_modal') {
            return handleVcJoin(interaction, client, false);
        }
        if (customId === 'vc_disconnect' || customId === 'vc_disconnect_modal') {
            return handleVcDisconnect(interaction, client);
        }
    }
};
