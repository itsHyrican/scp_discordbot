require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs/promises");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

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
    displayName: "ASA: Aquatica",
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

  // 🧠 Versuche, alte Nachricht-ID aus Datei zu laden
  try {
    const lastId = await fs.readFile("lastMessageId.txt", "utf-8");
    const msg = await channel.messages.fetch(lastId);
    if (msg && msg.author.id === client.user.id) {
      statusMessage = msg;
      console.log("🔁 Vorherige Nachricht wiederverwendet.");
    }
  } catch (err) {
    console.log(
      "ℹ️ Keine alte Nachricht gefunden oder konnte sie nicht laden."
    );
  }

  const lastKnownStates = new Map();

  const updateStatus = async () => {
    const fields = [];

    for (const server of servers) {
      let isOnline = false;

      try {
        const res = await axios.get(
          `${process.env.API_BASE_URL}/server/status/${server.containerName}`
        );
        isOnline = res.data?.state === "running";
      } catch (err) {
        console.error(`❌ Fehler bei ${server.containerName}:`, err.message);
      }

      // Vergleiche mit vorherigem Zustand
      const previousState = lastKnownStates.get(server.containerName);

      if (previousState !== undefined && previousState !== isOnline) {
        // Statusänderung erkannt → Nachricht senden
        const alertMsg = isOnline
          ? `✅ **${server.displayName}** ist jetzt online!`
          : `❌ **${server.displayName}** ist offline gegangen!`;

        await channel.send(alertMsg);
      }

      // Update speichern
      lastKnownStates.set(server.containerName, isOnline);

      // Feld für Embed aufbauen
      fields.push({
        name: `🖥️ ${server.displayName}`,
        value: `${isOnline ? "🟢 **Online**" : "🔴 **Offline**"}`,
        inline: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🎮 Serverstatus Übersicht")
      .setDescription("Letzter bekannter Status aller Server")
      .addFields(fields)
      .setColor(0x00bfff)
      .setFooter({ text: "Letztes Update" })
      .setTimestamp();

    if (statusMessage) {
      await statusMessage.edit({ embeds: [embed] });
    } else {
      statusMessage = await channel.send({ embeds: [embed] });
      await fs.writeFile("lastMessageId.txt", statusMessage.id, "utf-8");
      console.log("💾 Nachricht-ID gespeichert.");
    }
  };

  // Erste Ausführung
  await updateStatus();

  // Wiederholen alle 10 Sekunden
  setInterval(updateStatus, 30 * 1000);
});

client.login(process.env.DISCORD_TOKEN);
