require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('terminate')
    .setDescription('Issue a termination-related punishment to a user')
    .addUserOption(option =>
      option.setName('punished-agent')
        .setDescription('User to punish')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type-of-punishment')
        .setDescription('Type of punishment')
        .setRequired(true)
        .addChoices(
          { name: 'Termination', value: 'Termination' },
          { name: 'Termination + Blacklist', value: 'Termination + Blacklist' },
          { name: 'Permanent Blacklist', value: 'Permanent Blacklist' },
          { name: '1 week Blacklist', value: '1 week Blacklist' },
          { name: '2 week Blacklist', value: '2 week Blacklist' }
        ))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the termination')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('appealable')
        .setDescription('Is the punishment appealable?')
        .setRequired(true)
        .addChoices(
          { name: 'Yes', value: 'Yes' },
          { name: 'No', value: 'No' }
        ))
    .addStringOption(option =>
      option.setName('approved-by')
        .setDescription('Mention approvers (users or roles)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('proof')
        .setDescription('Proof (Text/Links)')
        .setRequired(false)),

  async execute(interaction, client) {
    const allowedRoleIds = process.env.TERMINATE_ALLOWED_ROLE_IDS?.split(',').map(id => id.trim()) || [];
    const logChannelId = process.env.TERMINATE_LOG_CHANNEL_ID;

    if (!interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id))) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const punishedUser = interaction.options.getUser('punished-agent');
    const punishmentType = interaction.options.getString('type-of-punishment');
    const reason = interaction.options.getString('reason');
    const appealable = interaction.options.getString('appealable');
    const approvedBy = interaction.options.getString('approved-by');
    const proof = interaction.options.getString('proof') || 'N/A.';

    const issuer = interaction.user;
    const timestamp = new Date().toLocaleString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const embed = new EmbedBuilder()
      .setTitle('Termination')
      .setDescription(
        `${'━'.repeat('Termination'.length)}\n` +
        'The Internal Affairs Team has completed its investigation and proceeded with a termination-related punishment. ' +
        'If you feel this decision is unjust, you may open an IA Ticket in <#1347205369545363528> with valid proof.\n\n' +
        `> **Punishment:** ${punishmentType}\n` +
        `> **Reason:** ${reason}\n` +
        `> **Proof:** ${proof}\n` +
        `> **Appealable:** ${appealable}\n` +
        `> **Approved by:** ${approvedBy}`
      )
      .setColor(0x3498db)
      .setFooter({
        text: `Signed by ${issuer.username} | On ${timestamp}`,
        iconURL: issuer.displayAvatarURL({ dynamic: true }),
      });

    await interaction.reply({
      content: '✅ Termination has been logged.',
      ephemeral: true,
    });

    try {
      const logChannel = await client.channels.fetch(logChannelId);
      if (!logChannel) {
        return interaction.followUp({
          content: '❌ Could not find the termination log channel.',
          ephemeral: true,
        });
      }

      await logChannel.send({
        content: `<@${punishedUser.id}>`,
        embeds: [embed],
      });

      try {
        const dm = await punishedUser.createDM();
        await dm.send({ embeds: [embed] });
      } catch (dmError) {
        console.log(`❌ Failed to DM punished user (${punishedUser.tag}):`, dmError);
      }

    } catch (error) {
      console.error('❌ Error logging termination:', error);
      await interaction.followUp({
        content: '❌ An error occurred while logging the termination.',
        ephemeral: true,
      });
    }
  },
};
