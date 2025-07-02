import { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder, REST, Routes } from 'discord.js';
import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(port, () => console.log(`Web server running on port ${port}`));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

let data = {};
if (fs.existsSync('data.json')) {
  data = JSON.parse(fs.readFileSync('data.json'));
}

function save() {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

function getUser(id) {
  if (!data[id]) {
    data[id] = {
      uang: 0,
      inv: {},
      rodLevel: 1,
      lastClaim: 0,
    };
  }
  return data[id];
}

const ikanList = [
  { nama: 'Lele', harga: 20, rarity: 'common' },
  { nama: 'Gurame', harga: 25, rarity: 'common' },
  { nama: 'Ikan Mas', harga: 30, rarity: 'common' },
  { nama: 'Nila', harga: 35, rarity: 'common' },
  { nama: 'Koi', harga: 40, rarity: 'rare' },
  { nama: 'Ikan Badut', harga: 60, rarity: 'rare' },
  { nama: 'Arwana', harga: 100, rarity: 'rare' },
  { nama: 'Ikan Hiu', harga: 1000, rarity: 'super' },
  { nama: 'Ikan Paus', harga: 2000, rarity: 'super' },
  { nama: 'Megalodon', harga: 3000, rarity: 'super' },
  { nama: 'Ikan Cupang', harga: 15, rarity: 'common' },
  { nama: 'Ikan Louhan', harga: 50, rarity: 'rare' },
  { nama: 'Ikan Terbang', harga: 45, rarity: 'rare' },
  { nama: 'Ikan Pari', harga: 75, rarity: 'rare' },
  { nama: 'Ikan Duyung', harga: 1500, rarity: 'super' },
  { nama: 'Ikan Monster', harga: 5000, rarity: 'super' },
  { nama: 'Ikan Sakura', harga: 120, rarity: 'rare' },
  { nama: 'Ikan Salju', harga: 140, rarity: 'rare' },
  { nama: 'Ikan Lava', harga: 170, rarity: 'rare' },
  { nama: 'Ikan Kristal', harga: 6000, rarity: 'super' }
];

function getRarityEmoji(rarity) {
  if (rarity === 'common') return '🐟';
  if (rarity === 'rare') return '🐠';
  return '🐉';
}

function getEmbedColor(rarity) {
  if (rarity === 'common') return 0x95a5a6;
  if (rarity === 'rare') return 0x3498db;
  return 0xf1c40f;
}

function mancing(uid) {
  const user = getUser(uid);
  const rodBonus = user.rodLevel * 0.5;
  const chance = Math.random() * 100;
  let filtered;
  if (chance < 0.5 + rodBonus) {
    filtered = ikanList.filter(i => i.rarity === 'super');
  } else if (chance < 10 + rodBonus) {
    filtered = ikanList.filter(i => i.rarity === 'rare');
  } else {
    filtered = ikanList.filter(i => i.rarity === 'common');
  }
  const ikan = filtered[Math.floor(Math.random() * filtered.length)];
  const berat = Math.floor(Math.random() * 100) + 1;
  const hasil = { nama: ikan.nama, harga: ikan.harga, rarity: ikan.rarity, berat };
  user.inv[ikan.nama] = (user.inv[ikan.nama] || 0) + 1;
  return hasil;
}

client.on('ready', () => {
  console.log(`Bot aktif sebagai ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const user = getUser(interaction.user.id);

  if (interaction.commandName === 'pemula') {
    if (user.inv['Umpan']) return interaction.reply({ content: 'Kamu sudah klaim!', ephemeral: true });
    user.inv['Umpan'] = 10;
    user.inv['Fishing Rod'] = 1;
    interaction.reply('🎣 Kamu mendapatkan 1 Fishing Rod dan 10 Umpan!');
  }

  if (interaction.commandName === 'uang') {
    interaction.reply(`💰 Uangmu: ${user.uang}`);
  }

  if (interaction.commandName === 'inv') {
    const list = Object.entries(user.inv).map(([item, jml]) => `- ${item}: ${jml}`).join('\n');
    interaction.reply(`🎒 Inventaris:\n${list}`);
  }

  if (interaction.commandName === 'jual') {
    let total = 0;
    for (const [nama, jml] of Object.entries(user.inv)) {
      const ikan = ikanList.find(i => i.nama === nama);
      if (ikan) total += ikan.harga * jml;
    }
    user.uang += total;
    user.inv = {};
    interaction.reply(`💵 Kamu menjual semua ikan dan mendapat ${total} uang!`);
  }

  if (interaction.commandName === 'mancing') {
    if (!user.inv['Umpan'] || user.inv['Umpan'] <= 0) return interaction.reply('🎯 Kamu kehabisan umpan!');
    user.inv['Umpan']--;
    const hasil = mancing(interaction.user.id);
    const embed = new EmbedBuilder()
      .setTitle(`${getRarityEmoji(hasil.rarity)} Kamu mendapatkan ${hasil.nama}!`)
      .setDescription(`Berat: ${hasil.berat}kg\nHarga: ${hasil.harga}`)
      .setColor(getEmbedColor(hasil.rarity));
    interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'leaderboard') {
    const sorted = Object.entries(data).sort((a, b) => b[1].uang - a[1].uang).slice(0, 10);
    const desc = sorted.map(([id, d], i) => `${i + 1}. <@${id}> - 💰 ${d.uang}`).join('\n');
    interaction.reply({ embeds: [new EmbedBuilder().setTitle('🏆 Top 10 Pemancing').setDescription(desc)] });
  }

  if (interaction.commandName === 'status') {
    const members = await interaction.guild.members.fetch();
    const counts = { online: 0, idle: 0, dnd: 0, offline: 0 };
    members.forEach(m => {
      if (!m.presence) counts.offline++;
      else counts[m.presence.status]++;
    });
    const embed = new EmbedBuilder()
      .setTitle('📊 Status Member')
      .addFields(
        { name: '🟢 Online', value: `${counts.online}`, inline: true },
        { name: '🌙 Idle', value: `${counts.idle}`, inline: true },
        { name: '⛔ DND', value: `${counts.dnd}`, inline: true },
        { name: '⚫ Offline', value: `${counts.offline}`, inline: true }
      )
      .setColor(0x7289da);
    interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'toko') {
    const embed = new EmbedBuilder()
      .setTitle('🎣 Fishing Shop')
      .setDescription('Beli alat & item:')
      .addFields(
        { name: '🎣 Fishing Rod', value: '20 uang', inline: true },
        { name: '🧲 Umpan', value: '5 uang', inline: true }
      )
      .setColor(0x2ecc71);
    interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'upgrade') {
    if (user.rodLevel >= 5) return interaction.reply('🎣 Rod kamu sudah maksimal!');
    const cost = user.rodLevel * 100;
    if (user.uang < cost) return interaction.reply(`💰 Butuh ${cost} uang untuk upgrade!`);
    user.uang -= cost;
    user.rodLevel++;
    interaction.reply(`🔧 Rod berhasil di-upgrade ke level ${user.rodLevel}!`);
  }

  if (interaction.commandName === 'bonus') {
    const now = Date.now();
    if (now - user.lastClaim < 86400000) return interaction.reply('⏰ Bonus hanya bisa diklaim 1x per 24 jam.');
    const bonus = Math.floor(Math.random() * 200) + 100;
    user.uang += bonus;
    user.lastClaim = now;
    interaction.reply(`🎁 Kamu klaim bonus harian sebesar 💰${bonus}`);
  }

  save();
});

const commands = [
  new SlashCommandBuilder().setName('pemula').setDescription('Dapatkan alat & umpan awal'),
  new SlashCommandBuilder().setName('toko').setDescription('Lihat item di toko'),
  new SlashCommandBuilder().setName('jual').setDescription('Jual semua ikan'),
  new SlashCommandBuilder().setName('uang').setDescription('Cek jumlah uangmu'),
  new SlashCommandBuilder().setName('inv').setDescription('Lihat isi inventarismu'),
  new SlashCommandBuilder().setName('mancing').setDescription('Mancing ikan dan dapatkan hadiah'),
  new SlashCommandBuilder().setName('leaderboard').setDescription('Lihat top 10 terkaya'),
  new SlashCommandBuilder().setName('status').setDescription('Lihat status member server'),
  new SlashCommandBuilder().setName('upgrade').setDescription('Upgrade fishing rod'),
  new SlashCommandBuilder().setName('bonus').setDescription('Klaim uang bonus harian')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
  .then(() => console.log('✅ Semua slash command telah di-register'))
  .catch(console.error);

client.login(TOKEN);
