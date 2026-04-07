const config = require('../config.json');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.content.startsWith(config.prefix)) return;

        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, client);
        } catch (error) {
            console.error(error);
            await message.reply({ content: `<a:carpi:1432011779222798376> Hata: ${error.message}`, allowedMentions: { repliedUser: false } });
        }
    }
};
