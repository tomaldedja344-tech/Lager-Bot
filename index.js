const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const waffenListe = [
    "Pistole",
    "50 Kaliber",
    "Taschenlampe",
    "Schlagring",
    "Baseballschläger",
    "SNS Pistole",
    "Schwerer Revolver",
    "Pistole MK2",
    "Fallschirm",
    "Langwaffe"
];

// 📦 Lager laden
let lager = require('./lager.json');

// 🔥 Lager sauber halten
function sanitizeLager() {
    for (const key of Object.keys(lager)) {
        if (!waffenListe.includes(key)) {
            delete lager[key];
        }
    }

    for (const w of waffenListe) {
        if (lager[w] === undefined) {
            lager[w] = 0;
        }
    }

    fs.writeFileSync('./lager.json', JSON.stringify(lager, null, 2));
}

client.once('ready', async () => {
    console.log(`${client.user.tag} ist online!`);

    sanitizeLager();

    const commands = [
        new SlashCommandBuilder()
            .setName('lager')
            .setDescription('Zeigt Waffenlager mit Buttons')
    ];

    await client.application.commands.set(commands);
});

client.on('interactionCreate', async interaction => {

    // 📦 COMMAND
    if (interaction.commandName === 'lager') {

        let text = Object.entries(lager)
            .map(([w, a]) => `🔫 ${w}: ${a}`)
            .join('\n');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('einlagern')
                .setLabel('Einlagern')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('auslagern')
                .setLabel('Auslagern')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
            content: `📦 **Waffenlager**\n\n${text}`,
            components: [row]
        });
    }

    // 🔘 BUTTONS
    if (interaction.isButton()) {

        const modal = new ModalBuilder()
            .setCustomId(interaction.customId)
            .setTitle('Waffen Lager System');

        const waffeInput = new TextInputBuilder()
            .setCustomId('waffe')
            .setLabel('Waffenname (genau schreiben)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const anzahlInput = new TextInputBuilder()
            .setCustomId('anzahl')
            .setLabel('Anzahl')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(waffeInput),
            new ActionRowBuilder().addComponents(anzahlInput)
        );

        await interaction.showModal(modal);
    }

    // 📝 MODAL
    if (interaction.isModalSubmit()) {

        const waffe = interaction.fields.getTextInputValue('waffe');
        const anzahl = parseInt(interaction.fields.getTextInputValue('anzahl'));

        if (!waffenListe.includes(waffe)) {
            return interaction.reply({
                content: "❌ Diese Waffe existiert nicht im System.",
                ephemeral: true
            });
        }

        if (interaction.customId === 'einlagern') {

            lager[waffe] += anzahl;

            fs.writeFileSync('./lager.json', JSON.stringify(lager, null, 2));

            return interaction.reply(`✅ ${anzahl}x ${waffe} eingelagert.`);
        }

        if (interaction.customId === 'auslagern') {

            if (lager[waffe] < anzahl) {
                return interaction.reply(`❌ Nicht genug ${waffe} im Lager.`);
            }

            lager[waffe] -= anzahl;

            fs.writeFileSync('./lager.json', JSON.stringify(lager, null, 2));

            return interaction.reply(`📤 ${anzahl}x ${waffe} ausgelagert.`);
        }
    }
});

client.login(process.env.TOKEN);
