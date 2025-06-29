require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('outfit-perm')
    .setDescription('Grants a custom outfit permission to a personnel.')
    .addUserOption(option =>
      option.setName('agent')
        .setDescription('The agent receiving the permission')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('How long is the permission valid?')
        .setRequired(true)
        .addChoices(
          { name: 'Only this shift', value: 'Only this shift' },
          { name: 'Permanent', value: 'Permanent' }
        )
    )
    .addAttachmentOption(option =>
      option.setName('proof')
        .setDescription('Attach proof of permission')
        .setRequired(true)
    ),

  async execute(interaction) {
    const requiredRoleId = process.env.OUTFIT_ACCESS_ROLE_ID;
    const member = interaction.member;

    if (!interaction.member.roles.cache.hasAny(...allowedRoles)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const agent = interaction.options.getUser('agent');
    const duration = interaction.options.getString('duration');
    const proof = interaction.options.getAttachment('proof');

    const embed = new EmbedBuilder()
      .setTitle('Custom Outfit Permission')
      .setDescription(
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Custom outfit permission has been officially granted for the personnel within the SRT.\n\n` +
        `This approval allows the agent to wear the designated custom attire in accordance with SRT guidelines. The privilege is granted based on trust, professionalism, and adherence to uniform standards.\n\n` +
        `**Duration:** ${duration}\n` +
        `**Custom Outfit Proof:** [Click to view attachment](${proof.url})\n\n` +
        `**Signed by:** ${interaction.user}`
      )
      .setColor(0x3498db)
      .setImage(proof.url)
      .setTimestamp();

    const logChannel = interaction.client.channels.cache.get(process.env.OUTFIT_LOG_CHANNEL_ID);
    if (!logChannel) {
      return interaction.reply({
        content: '❌ Log channel not found. Please check `OUTFIT_LOG_CHANNEL_ID` in your .env file.',
        ephemeral: true,
      });
    }

    await logChannel.send({ content: `${agent}`, embeds: [embed] });

    try {
      await agent.send({ embeds: [embed] });
    } catch (error) {
      console.warn(`Could not send DM to ${agent.tag}: ${error}`);
    }

    await interaction.reply({
      content: '✅ Custom outfit permission granted, logged, and DM sent successfully.',
      ephemeral: true,
    });
  },
};
