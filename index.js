import { Client, GatewayIntentBits, Partials, Collection, SlashCommandBuilder, REST, Routes, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const app = express();
app.get('/', (req, res) => res.send('Bot aktif!'));
app.listen(3000, () => console.log('Web server aktif di port 3000'));

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
let data = fs.existsSync('./data.json') ? JSON.parse(fs.readFileSync('./data.json')) : { users: {} };

const saveData = () => fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));

const items = {
  tools: [
    { name: 'Pancing Kayu', price: 0, rarity: 0 },
    { name: 'Pancing Besi', price: 500, rarity: 2 },
    { name: 'Pancing Emas', price: 1500, rarity: 5 },
    { name: 'Pancing Kristal', price: 5000, rarity: 7 },
    { name: 'Pancing Legendaris', price: 10000, rarity: 10 }
  ],
  baits: [
    { name: 'Umpan Biasa', price: 10 },
    { name: 'Umpan Uang', price: 30 },
    { name: 'Umpan Keberuntungan', price: 115 }
  ]
};

const fishes = [
  { name: 'Ikan Cupang', rarity: 'umum', price: 10 },
  { name: 'Ikan Nila', rarity: 'umum', price: 12 },
  { name: 'Ikan Lele', rarity: 'umum', price: 15 },
  { name: 'Ikan Gabus', rarity: 'umum', price: 18 },
  { name: 'Ikan Mujair', rarity: 'umum', price: 20 },
  { name: 'Ikan Mas', rarity: 'umum', price: 22 },
  { name: 'Ikan Gurame', rarity: 'umum', price: 25 },
  { name: 'Ikan Koi', rarity: 'umum', price: 30 },
  { name: 'Ikan Salmon', rarity: 'langka', price: 80 },
  { name: 'Ikan Tuna', rarity: 'langka', price: 90 },
  { name: 'Ikan Paus Kecil', rarity: 'langka', price: 120 },
  { name: 'Ikan Duyung', rarity: 'super', price: 1000 },
  { name: 'Ikan Legenda', rarity: 'super', price: 2000 },
  { name: 'Ikan Hiu', rarity: 'super', price: 2500 },
  { name: 'Ikan Emas Raksasa', rarity: 'super', price: 5000 },
  { name: 'Ikan Naga Air', rarity: 'super', price: 7000 },
  { name: 'Ikan Dewa Laut', rarity: 'super', price: 10000 }
];

const getRandomFish = () => {
  const chance = Math.random() * 100;
  let pool;
  if (chance <= 0.5) pool = fishes.filter(f => f.rarity === 'super');
  else if (chance <= 20) pool = fishes.filter(f => f.rarity === 'langka');
  else pool = fishes.filter(f => f.rarity === 'umum');
  const fish = pool[Math.floor(Math.random() * pool.length)];
  const weight = Math.floor(Math.random() * 100) + 1;
  const totalValue = fish.price + weight;
  return { ...fish, weight, totalValue };
};

const ensureUser = (id) => {
  if (!data.users[id]) {
    data.users[id] = { uang: 0, inv: {}, alat: 'Pancing Kayu', bait: 0, claimed: false };
  }
};

const commands = [
  new SlashCommandBuilder().setName('pemula').setDescription('Ambil alat & umpan awal'),
  new SlashCommandBuilder().setName('toko').setDescription('Lihat isi toko memancing'),
  new SlashCommandBuilder().setName('jual').setDescription('Jual semua ikan di inventaris'),
  new SlashCommandBuilder().setName('uang').setDescription('Cek jumlah uangmu'),
  new SlashCommandBuilder().setName('inv').setDescription('Lihat inventarismu'),
  new SlashCommandBuilder().setName('mancing').setDescription('Memancing ikan!'),
  new SlashCommandBuilder().setName('leaderboard').setDescription('Lihat top 10 terkaya'),
  new SlashCommandBuilder().setName('status').setDescription('Lihat status member server')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
console.log('✅ Slash commands berhasil di-register!');

client.on('ready', () => {
  console.log(`Bot siap sebagai ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { user } = interaction;
  ensureUser(user.id);
  const u = data.users[user.id];

  if (interaction.commandName === 'pemula') {
    if (u.claimed) return interaction.reply({ content: '🎣 Kamu sudah pernah klaim starter pack!', ephemeral: true });
    u.alat = 'Pancing Kayu';
    u.bait += 5;
    u.claimed = true;
    saveData();
    interaction.reply('🎁 Kamu mendapatkan Pancing Kayu dan 5 Umpan Biasa!');
  }

  else if (interaction.commandName === 'toko') {
    const embed = new EmbedBuilder()
      .setTitle('🎣 Toko Pancing')
      .setColor('Green')
      .setDescription(items.tools.map(t => `🎣 **${t.name}** - 💰 ${t.price}`).join('\n') + '\n\n' +
                      items.baits.map(b => `🪱 **${b.name}** - 💰 ${b.price}`).join('\n'));

    interaction.reply({ embeds: [embed] });
  }

  else if (interaction.commandName === 'jual') {
    let total = 0;
    for (let i in u.inv) {
      total += u.inv[i];
    }
    u.uang += total;
    u.inv = {};
    saveData();
    interaction.reply(`💰 Kamu menjual semua ikan dan mendapatkan **${total}** uang!`);
  }

  else if (interaction.commandName === 'uang') {
    interaction.reply(`💸 Uangmu: **${u.uang}**`);
  }

  else if (interaction.commandName === 'inv') {
    const inv = Object.entries(u.inv).map(([name, val]) => `🐟 ${name}: ${val}`).join('\n') || '❌ Tidak ada ikan';
    interaction.reply(`🎒 Inventaris kamu:\n${inv}`);
  }

  else if (interaction.commandName === 'mancing') {
    if (u.bait <= 0) return interaction.reply('🪱 Kamu tidak punya umpan!');
    u.bait--;
    const fish = getRandomFish();
    u.inv[`${fish.name} (${fish.weight}kg)`] = (u.inv[`${fish.name} (${fish.weight}kg)`] || 0) + fish.totalValue;
    saveData();
    interaction.reply(`🎣 Kamu mendapatkan **${fish.name}** seberat **${fish.weight}kg** senilai **${fish.totalValue}**!`);
  }

  else if (interaction.commandName === 'leaderboard') {
    const lb = Object.entries(data.users)
      .map(([id, u]) => ({ id, uang: u.uang }))
      .sort((a, b) => b.uang - a.uang)
      .slice(0, 10);
    const text = lb.map((u, i) => `#${i + 1} <@${u.id}> - 💰 ${u.uang}`).join('\n');
    interaction.reply({ content: `🏆 Leaderboard Pemancing:\n${text}`, allowedMentions: { users: [] } });
  }

  else if (interaction.commandName === 'status') {
    const members = interaction.guild.members.cache.filter(m => !m.user.bot);
    const statusList = members.map(m => ({
      name: m.user.username,
      status: m.presence?.status || 'offline'
    }));
    const sorted = statusList.sort((a, b) => a.status.localeCompare(b.status));
    const embed = new EmbedBuilder()
      .setTitle('📶 Status Member')
      .setColor('Blue')
      .setDescription(sorted.map(u => `**${u.name}** - \`${u.status}\``).join('\n'));
    interaction.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);