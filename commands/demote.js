require('dotenv').config(); // load .env variables
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('demote')
    .setDescription('Demote a user to a lower rank')
    .addUserOption(option =>
      option.setName('demoted-agent')
        .setDescription('User to demote')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('new-rank')
        .setDescription('New lower rank for the user')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the demotion')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('approved-by')
        .setDescription('Mention approvers (users or roles)')
        .setRequired(true)),

  async execute(interaction, client) {
    const allowedRolesEnv = process.env.DEMOTE_ALLOWED_ROLES;
    if (!allowedRolesEnv) {
      return interaction.reply({ content: '🚫 Server configuration error: DEMOTE_ALLOWED_ROLES not set.', ephemeral: true });
    }
    const allowedRoleIds = allowedRolesEnv.split(',').map(id => id.trim());

    const memberRoles = interaction.member.roles.cache.map(role => role.id);
    const hasPermission = memberRoles.some(roleId => allowedRoleIds.includes(roleId));
    if (!hasPermission) {
      return interaction.reply({ content: '🚫 You do not have permission to use this command.', ephemeral: true });
    }

    const demotedAgent = interaction.options.getUser('demoted-agent');
    const newRank = interaction.options.getRole('new-rank');
    const reason = interaction.options.getString('reason');
    const approvedBy = interaction.options.getString('approved-by');

    const author = interaction.user.username;
    const authorAvatarURL = interaction.user.displayAvatarURL({ dynamic: true, size: 1024 });

    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const blueLine = '━'.repeat(60);
    const centeredTitle = 'ㅤㅤㅤㅤㅤㅤㅤㅤDemotionㅤㅤㅤㅤㅤㅤㅤㅤ';

    await interaction.reply({ content: '✅ Demotion has been logged.', ephemeral: true });

    const logChannelId = process.env.DEMOTE_LOG_CHANNEL_ID;
    const logChannel = await interaction.client.channels.fetch(logChannelId);

    const embed = {
      title: centeredTitle,
      description:
        `\n${blueLine}\n\n` +
        `<@${demotedAgent.id}> has been officially demoted to the rank of <@&${newRank.id}>. This action was taken after careful evaluation of recent performance and conduct. We believe this step is necessary to uphold the standards and discipline of our organization. We expect improved performance and commitment moving forward.\n\n` +
        `**Reason for demotion:** ${reason}\n\n` +
        `**Approved by:** ${approvedBy}`,
      color: 0x3498db,
      footer: {
        text: `Signed by ${author} | On ${date} • ${time}`,
        icon_url: authorAvatarURL,
      },
    };

    if (logChannel) {
      await logChannel.send({
        content: `<@${demotedAgent.id}>`,
        embeds: [embed],
      });
    } else {
      console.log('❌ Error: Demotion log channel not found.');
    }

    try {
      const dmChannel = await demotedAgent.createDM();
      await dmChannel.send({ embeds: [embed] });
    } catch (error) {
      console.log(`❌ Could not send DM to ${demotedAgent.tag}:`, error);
    }
  },
};
