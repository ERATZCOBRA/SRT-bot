require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Promote a user to a new rank')
    .addUserOption(option =>
      option.setName('promoted-agent')
        .setDescription('User to promote')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('new-rank')
        .setDescription('New rank for the user')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('approved-by')
        .setDescription('Mention approvers (users/roles), separated by spaces or commas')
        .setRequired(true))
    .setDefaultMemberPermissions(null)
    .setDMPermission(false),

  async execute(interaction, client) {
    const allowedRoleIds = process.env.PROMOTE_ALLOWED_ROLE_IDS
      ? process.env.PROMOTE_ALLOWED_ROLE_IDS.split(',').map(id => id.trim())
      : [];

    const channelId = process.env.PROMOTE_LOG_CHANNEL_ID;
    const requester = interaction.user;

    const hasPermission = interaction.member.roles.cache.some(role =>
      allowedRoleIds.includes(role.id)
    );

    if (!hasPermission) {
      return interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
    }

    const promotedAgent = interaction.options.getUser('promoted-agent');
    const newRank = interaction.options.getRole('new-rank');
    const approvedByRaw = interaction.options.getString('approved-by');
    const time = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const horizontalLine = '━'.repeat(50);
    const centeredTitle = 'ㅤㅤㅤㅤㅤPROMOTIONㅤㅤㅤㅤㅤ';

    let channel;
    try {
      channel = await client.channels.fetch(channelId);
    } catch (error) {
      console.error('Failed to fetch promotion log channel:', error);
      return interaction.reply({
        content: '❌ Failed to find the promotion log channel.',
        ephemeral: true,
      });
    }

    if (!channel) {
      return interaction.reply({
        content: '❌ Promotion log channel not found.',
        ephemeral: true,
      });
    }

    try {
      await interaction.reply({
        content: '✅ Promotion has been completed.',
        ephemeral: true,
      });
    } catch {
      console.warn('Interaction already replied or deferred.');
    }

    const embed = new EmbedBuilder()
      .setTitle(centeredTitle)
      .setDescription([
        `${horizontalLine}`,
        ``,
        `We are proud to recognize outstanding service and dedication within the Company.`,
        `Effective immediately, <@${promotedAgent.id}> is promoted to the rank of <@&${newRank.id}>.`,
        `Continue to serve with integrity, discipline, and honor.`,
        ``,
        `> **Approved by:** ${approvedByRaw}`,
      ].join('\n'))
      .setColor(0x3498db)
      .setFooter({
        text: `Signed by ${requester.username} | On ${time}`,
        iconURL: requester.displayAvatarURL({ dynamic: true }),
      });

    await channel.send({
      content: `<@${promotedAgent.id}>`,
      embeds: [embed],
    });
  },
};
