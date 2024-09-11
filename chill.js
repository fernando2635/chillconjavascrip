const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// Directorio para guardar los binarios de FFmpeg
const ffmpegBinPath = path.join(__dirname, 'ffmpeg_bin');
const ffmpegExecutable = path.join(ffmpegBinPath, 'ffmpeg');

// Verificar y configurar FFmpeg
const setupFFmpeg = () => {
  if (!fs.existsSync(ffmpegBinPath)) {
    fs.mkdirSync(ffmpegBinPath);
    console.log('Creando directorio ffmpeg_bin...');
  }

  if (!fs.existsSync(ffmpegExecutable)) {
    console.log('FFmpeg no encontrado. Instala FFmpeg manualmente en Railway.');
  } else {
    console.log('FFmpeg encontrado.');
  }
};

// Función para conectarse a un canal de voz y reproducir audio
async function connectAndPlay(channel) {
  try {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();

    connection.subscribe(player);

    const stream = ytdl('https://www.youtube.com/watch?v=jfKfPfyJRdk', {
      filter: 'audioonly',
      quality: 'highestaudio',
    });

    const resource = createAudioResource(stream, {
      inputType: 'arbitrary',
      inlineVolume: true,
    });

    player.play(resource);

    player.on(AudioPlayerStatus.Idle, () => {
      console.log('Reproducción terminada.');
      player.play(resource); // Repetir la canción
    });

    player.on('error', error => {
      console.error(`Error de reproducción: ${error.message}`);
      player.stop();
    });
  } catch (error) {
    console.error(`Error al conectarse y reproducir: ${error.message}`);
  }
}

client.on('ready', async () => {
  console.log(`Bot ${client.user.tag} está listo y conectado!`);
  setupFFmpeg(); // Verificar que FFmpeg está configurado

  const voiceChannel = client.channels.cache.get(process.env.VOICE_CHANNEL_ID);
  if (voiceChannel) {
    await connectAndPlay(voiceChannel);
  } else {
    console.error('Canal de voz no encontrado. Verifica el ID del canal en tu archivo .env.');
  }
});

// Iniciar el bot
client.login(process.env.DISCORD_TOKEN);
