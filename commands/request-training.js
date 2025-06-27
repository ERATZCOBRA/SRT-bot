require('dotenv').config();
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

// 56 characters wide for better embed width alignment
const BLUE_LINE = '━'.repeat(56);

const ROLE_IDS = {
  entry: {
    mention: process.env.REQ_ENTRY_ROLE_ID,
    access: process.env.REQ_ENTRY_ACCESS_ROLE_IDS
      ? process.env.REQ_ENTRY_ACCESS_ROLE_IDS.split(',').map(id => id.trim())
      : [],
    label: 'Entry Training',
  },
};

const TARGET_CHANNEL_ID = process.env.TRAINING_REQUEST_CHANNEL_ID;
const REVIEWER_ROLE_IDS = process.env.TRAINING_REVIEWER_ROLE_IDS
  ? process.env.TRAINING_REVIEWER_ROLE_IDS.split(',').map(id => id.trim())
  : [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('request-training')
    .setDescription('Submit a formal FBI training request')
    .setDefaultMemberPermissions(null)
    .setDMPermission(false)
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of training')
        .setRequired(true)
        .addChoices(
          { name: 'Entry Training', value: 'entry' }
        )
    )
    .addStringOption(option =>
      option.setName('available-time')
        .setDescription('Your available time for training')
        .setRequired(true)
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const availableTime = interaction.options.getString('available-time');
    const user = interaction.user;
    const member = interaction.member;

    const training = ROLE_IDS[type];
    if (!training) {
      return interaction.reply({
        content: '❌ Invalid training type selected.',
        ephemeral: true,
      });
    }

    const hasAccess = training.access.some(roleId => member.roles.cache.has(roleId));
    if (!hasAccess) {
      return interaction.reply({
        content: '❌ You do not have permission to request this type of training.',
        ephemeral: true,
      });
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const embed = new EmbedBuilder()
      .setTitle('ㅤㅤㅤㅤTRAINING REQUESTㅤㅤㅤㅤ')
      .setDescription(
        `${BLUE_LINE}\n\n` +
        `I hereby submit a formal request to participate in the upcoming training program within the Company. I am eager to enhance my skills and knowledge to better serve the company's mission.\n\n` +
        `> **Trainee:** ${user}\n` +
        `> **Type of Training:** ${training.label}\n` +
        `> **Available Time:** ${availableTime}\n` +
        `> **Status:** ⏳ Pending`
      )
      .setColor(0x3498db)
      .setFooter({
        text: `Signed by, ${member?.nickname || user.username} • Time: ${formattedTime}`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept_training')
        .setLabel('✅ Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('deny_training')
        .setLabel('❌ Deny')
        .setStyle(ButtonStyle.Danger)
    );

    try {
      const targetChannel = await interaction.client.channels.fetch(TARGET_CHANNEL_ID);
      if (!targetChannel) {
        return interaction.reply({
          content: '❌ Could not find the training request channel.',
          ephemeral: true,
        });
      }

      const message = await targetChannel.send({
        content: `<@&${training.mention}>`,
        embeds: [embed],
        components: [buttons],
      });

      await message.startThread({
        name: `${training.label} - ${user.username}`,
        autoArchiveDuration: 60,
        reason: 'Training request thread created',
      });

      await interaction.reply({
        content: '✅ Your training request has been submitted successfully.',
        ephemeral: true,
      });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      collector.on('collect', async i => {
        const isReviewer = REVIEWER_ROLE_IDS.some(roleId => i.member.roles.cache.has(roleId));
        if (!isReviewer) {
          return i.reply({
            content: '❌ You do not have permission to review training requests.',
            ephemeral: true,
          });
        }

        const decision = i.customId === 'accept_training' ? '✅ Accepted' : '❌ Denied';
        const color = i.customId === 'accept_training' ? 0x00ff00 : 0xff0000;

        const currentEmbed = EmbedBuilder.from(message.embeds[0]);
        const updatedDescription = currentEmbed.data.description.replace(
          /> \*\*Status:\*\* .*/g,
          `> **Status:** ${decision} by ${i.user}`
        );

        const updatedEmbed = currentEmbed
          .setColor(color)
          .setDescription(updatedDescription);

        await message.edit({ embeds: [updatedEmbed], components: [] });
        await i.reply({ content: `Training request has been ${decision.toLowerCase()}.`, ephemeral: true });

        collector.stop();
      });

    } catch (error) {
      console.error('Error while processing training request:', error);
      await interaction.reply({
        content: '❌ An unexpected error occurred while submitting your request.',
        ephemeral: true,
      });
    }
  },
};
