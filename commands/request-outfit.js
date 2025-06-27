require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('request-outfit')
    .setDescription('Request custom outfit permission.')
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('How long are you requesting the permission for?')
        .setRequired(true)
        .addChoices(
          { name: 'Only this shift', value: 'Only this shift' },
          { name: 'Permanent', value: 'Permanent' }
        )
    )
    .addAttachmentOption(option =>
      option.setName('proof')
        .setDescription('Attach a screenshot or document as proof/justification')
        .setRequired(true)
    ),

  async execute(interaction) {
    const duration = interaction.options.getString('duration');
    const proof = interaction.options.getAttachment('proof');
    const requester = interaction.user;

    const embed = new EmbedBuilder()
      .setTitle('Custom Outfit Permission Request')
      .setDescription(
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `A personnel has requested custom outfit permission within the SRT.\n\n` +
        `**Requested by:** ${requester}\n` +
        `**Duration:** ${duration}\n` +
        `**Proof/Justification:** [Click to view attachment](${proof.url})`
      )
      .setColor(0x3498db)
      .setImage(proof.url)
      .setTimestamp();

    const logChannel = interaction.client.channels.cache.get(process.env.OUTFIT_REQUEST_LOG_CHANNEL_ID);
    const pingRole = process.env.OUTFIT_REQUEST_PING_ROLE_ID;

    if (!logChannel || !pingRole) {
      return interaction.reply({
        content: '❌ Log channel or ping role not found. Please check your `.env` file.',
        ephemeral: true,
      });
    }

    await logChannel.send({
      content: `<@&${pingRole}> 📥 New outfit request from ${requester}`,
      embeds: [embed],
    });

    await interaction.reply({
      content: '✅ Your outfit permission request has been submitted successfully.',
      ephemeral: true,
    });
  },
};
