require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Deine Servers aus Frontend (vereinfacht hier)
const servers = [
  {
    displayName: "ASA: The Island",
    containerName: "asa_island",
    serverIp: "ark.voltagex.de",
  },
  {
    displayName: "ASA: Center",
    containerName: "asa_center",
    serverIp: "ark.voltagex.de",
  },
  {
    displayName: "ASA: Scorched Earth",
    containerName: "asa_scorched",
    serverIp: "ark.voltagex.de",
  },
  {
    displayName: "ASA: Aberration",
    containerName: "asa_aberration",
    serverIp: "ark.voltagex.de",
  },
  {
    displayName: "ASA: Extinction",
    containerName: "asa_extinction",
    serverIp: "ark.voltagex.de",
  },
  {
    containerName: "craftopia",
    displayName: "Craftopia",
    serverIp: "craftopia.voltagex.de",
  },
  {
    containerName: "enshrouded",
    displayName: "Enshrouded",
    serverIp: "enshrouded.voltagex.de",
  },
  {
    containerName: "palworld",
    displayName: "Palworld",
    serverIp: "palworld.voltagex.de",
  },
  {
    containerName: "satisfactory",
    displayName: "Satisfactory",
    serverIp: "satisfactory.voltagex.de",
  },
  {
    containerName: "valheim",
    displayName: "Valheim",
    serverIp: "valheim.voltagex.de",
  },
  {
    containerName: "minecraft",
    displayName: "Minecraft",
    serverIp: "mc.voltagex.de",
  },
];

let statusMessage = null;

client.once("ready", async () => {
  console.log(`✅ Bot ist online als ${client.user.tag}`);

  const channel = await client.channels.fetch(process.env.STATUS_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) {
    console.error("❌ Channel nicht gefunden oder nicht textbasiert.");
    return;
  }

  const fetchAndUpdateStatus = async () => {
    const statusLines = [];

    for (const server of servers) {
      try {
        const res = await axios.get(
          `http://localhost:3001/api/server/status/${server.containerName}`
        );
        const isOnline = res.data?.online ?? false;

        statusLines.push(
          `**${server.displayName}** (${server.serverIp}): ${
            isOnline ? "🟢 Online" : "🔴 Offline"
          }`
        );
      } catch (err) {
        console.error(`❌ Fehler bei ${server.containerName}:`, err.message);
        statusLines.push(
          `**${server.displayName}** (${server.serverIp}): ⚠️ Fehler`
        );
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("🖥️ Serverstatus")
      .setDescription(statusLines.join("\n"))
      .setColor(0x0099ff)
      .setTimestamp();

    if (statusMessage) {
      await statusMessage.edit({ embeds: [embed] });
    } else {
      statusMessage = await channel.send({ embeds: [embed] });
    }
  };

  await fetchAndUpdateStatus();
  setInterval(fetchAndUpdateStatus, 10 * 1000); // Alle 10 Sekunden
});

client.login(process.env.DISCORD_TOKEN);
