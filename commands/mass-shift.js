require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('host-mass')
    .setDescription('Announce a mass shift operation')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('Location of the mass shift')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for hosting the mass')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('promotional')
        .setDescription('Is this shift promotional?')
        .setRequired(true)
        .addChoices(
          { name: 'Yes', value: 'Yes' },
          { name: 'No', value: 'No' }
        ))
    .addUserOption(option =>
      option.setName('co-host')
        .setDescription('User co-hosting the mass')
        .setRequired(false)),

  async execute(interaction, client) {
    const allowedRolesEnv = process.env.HOST_MASS_ALLOWED_ROLE_ID;
    const mentionRoleId = process.env.HOST_MASS_MENTION_ROLE_ID;
    const announceChannelId = process.env.HOST_MASS_ANNOUNCE_CHANNEL_ID;

    if (!allowedRolesEnv || !mentionRoleId || !announceChannelId) {
      console.warn('⚠️ Missing one or more required environment variables for host-mass command.');
      return interaction.reply({ content: '🚫 Server configuration error. Please contact an admin.', ephemeral: true });
    }

    const allowedRoleIds = allowedRolesEnv.split(',').map(id => id.trim()).filter(Boolean);

    if (allowedRoleIds.length === 0) {
      return interaction.reply({ content: '🚫 Server configuration error. Please contact an admin.', ephemeral: true });
    }

    const hasPermission = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));
    if (!hasPermission) {
      return interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
    }

    const coHost = interaction.options.getUser('co-host');
    const coHostDisplay = coHost ? `${coHost}` : 'N/A';
    const location = interaction.options.getString('location');
    const reason = interaction.options.getString('reason');
    const promotional = interaction.options.getString('promotional');

    const author = interaction.user.username;
    const authorAvatarURL = interaction.user.displayAvatarURL({ dynamic: true, size: 1024 });

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const blueLine = '━'.repeat(60);
    const centeredTitle = 'ㅤㅤㅤㅤㅤㅤㅤㅤMass Shiftㅤㅤㅤㅤㅤㅤㅤㅤ';

    const mentionRole = `<@&${mentionRoleId}>`;
    const channel = await client.channels.fetch(announceChannelId).catch(() => null);

    if (!channel) {
      console.warn('❌ Announcement channel not found.');
      return interaction.reply({ content: '❌ Announcement channel not found. Please contact an admin.', ephemeral: true });
    }

    await interaction.reply({ content: '✅ Mass hosting announcement posted.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle(centeredTitle)
      .setDescription(
        `${blueLine}\n` +
        `The Private Company is currently hosting a mass shift operation to enhance coordination and readiness across all active units. Personnel are required to report for duty as scheduled and carry out their assignments with full professionalism. This initiative is part of ongoing efforts to maintain peak operational efficiency within the Company.\n\n` +
        `> **Hosted by:** ${interaction.user}\n` +
        `> **Co-host:** ${coHostDisplay}\n` +
        `> **Location:** ${location}\n` +
        `> **Reason:** ${reason}\n` +
        `> **Promotional:** ${promotional}`
      )
      .setColor(0x3498db)
      .setFooter({
        text: `Signed by ${author} | ${dayOfWeek}, Time: ${time}`,
        iconURL: authorAvatarURL,
      });

    const message = await channel.send({
      content: mentionRole,
      embeds: [embed],
    });

    try {
      await message.react('✅');
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  },
};
