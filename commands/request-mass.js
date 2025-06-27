const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('request-mass')
    .setDescription('Request a mass shift'),
    
  async execute(interaction) {
    const massShiftRoleId = process.env.MASS_SHIFT_REQUEST_ROLE_ID;
    const channelId = process.env.MASS_SHIFT_REQUEST_CHANNEL_ID;
    const targetChannel = await interaction.client.channels.fetch(channelId);

    if (!targetChannel) {
      return interaction.reply({ content: '❌ Could not find the configured channel.', ephemeral: true });
    }

    const unicodeLine = '━'.repeat('Mass Shift Request'.length);

    const embed = new EmbedBuilder()
      .setTitle('Mass Shift Request')
      .setDescription(`${unicodeLine}\n\n${interaction.user} has requested for a mass shift.`)
      .setColor(0x3498db)
      .setTimestamp();

    await targetChannel.send({
      content: `<@&${massShiftRoleId}>`,
      embeds: [embed]
    });

    await interaction.reply({ content: '✅ Your mass shift request has been sent.', ephemeral: true });
  }
};
