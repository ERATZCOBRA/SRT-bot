require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const BLUE_LINE = '━'.repeat(60); // Visual separator
const ENTRY_ROLE_ID = process.env.ENTRY_TRAINING_ROLE_ID;
const ENTRY_ACCESS_ROLES = process.env.ENTRY_TRAINING_ACCESS_ROLE_IDS?.split(',') || [];
const TRAINING_CHANNEL_ID = process.env.TRAINING_ANNOUNCE_CHANNEL_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('host-training')
    .setDescription('Announce an upcoming Entry Training')
    .setDefaultMemberPermissions(null)
    .setDMPermission(false)
    .addUserOption(opt =>
      opt.setName('co-host')
        .setDescription('Co-host of the training (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const user = interaction.user;
    const coHost = interaction.options.getUser('co-host');

    const hasAccess = ENTRY_ACCESS_ROLES.some(roleId => member.roles.cache.has(roleId));
    if (!hasAccess) {
      return interaction.reply({
        content: '❌ You do not have permission to host Entry Training.',
        ephemeral: true,
      });
    }

    if (!ENTRY_ROLE_ID) {
      return interaction.reply({
        content: '❌ Entry Training role is not configured properly.',
        ephemeral: true,
      });
    }

    const coHostText = coHost ? coHost.toString() : 'None';
    const centeredTitle = 'ㅤㅤㅤㅤㅤㅤㅤㅤEntry Trainingㅤㅤㅤㅤㅤㅤㅤㅤ';

    const embed = new EmbedBuilder()
      .setTitle(centeredTitle)
      .setDescription(
        `${BLUE_LINE}\n\n` +
        `An Entry Training will be beginning in a few minutes. Join up!\n\n` +
        `> **Host:** ${user}\n` +
        `> **Co-host:** ${coHostText}\n` +
        `> **Server Code:** zjBaf\n\n` +
        `React if joining`
      )
      .setColor(0x3498db);

    try {
      const guild = interaction.guild;
      const targetChannel = guild.channels.cache.get(TRAINING_CHANNEL_ID);
      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.reply({
          content: '❌ The training announcement channel is not found or is not a text channel.',
          ephemeral: true,
        });
      }

      const message = await targetChannel.send({
        content: `<@&${ENTRY_ROLE_ID}>`,
        embeds: [embed],
      });

      await message.react('✅');

      await message.startThread({
        name: `Entry Training - Hosted by ${user.username}`,
        autoArchiveDuration: 60,
        reason: 'Training session announcement thread',
      });

      await interaction.reply({
        content: `✅ Training announcement sent successfully in ${targetChannel}.`,
        ephemeral: true,
      });

    } catch (error) {
      console.error('Error sending host-training message:', error);
      await interaction.reply({
        content: '❌ Failed to send training announcement.',
        ephemeral: true,
      });
    }
  },
};
