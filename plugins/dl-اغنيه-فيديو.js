
import axios from 'axios'
import crypto from 'crypto'
import yts from 'yt-search'

const handler = async (m, { conn, args, command }) => {
  if (args.length < 1) return m.reply(`🔎 *بحث في يوتيوب:*\n- *.شغل < اسم الاغنية>*\n\n📥 *تحميل فيديو/صوت:*\n- *.ytmp3 <رابط>*\n- *.ytmp4 <رابط> [جودة]\n\n📌 *الجودة:* 144, 240, 360, 480, 720, 1080 (الافتراضي: 720p للفيديو)`);

  let query = args.join(' ');
  let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender;
  let username = conn.getName(who);

  let fkon = { 
    key: { 
      fromMe: false, 
      participant: `0@c.us`, 
      ...(m.chat ? { remoteJid: `status@broadcast` } : {}) 
    }, 
    message: { 
      contactMessage: { 
        displayName: username, 
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${username},;;;\nFN:${username}\nitem1.TEL;waid=${who.split('@')[0]}:${who.split('@')[0]}\nitem1.X-ABLabel:هاتف\nEND:VCARD`
      }
    }
  };

  switch (command) {
    case 'شغل':
      try {
        let searchResults = await yts(query);
        let video = searchResults.videos[0];

        if (!video) return m.reply("⚠️ *لا توجد نتائج للبحث المطلوب!*");

        let caption = `🎵 *تشغيل الموسيقى*\n\n`
          + `📽 *العنوان:* ${video.title}\n`
          + `📅 *تاريخ الرفع:* ${video.ago}\n`
          + `🛰️ *المدة:* ${video.timestamp}\n`
          + `🔭 *المشاهدات:* ${video.views.toLocaleString()}\n`
          + `🎥 *القناة:* ${video.author.name}\n`
          + `🔗 *المصدر:* ${video.url}`;

        let ytmp3 = await downloadYouTube(video.url, 'mp3');

        if (!ytmp3.status) return m.reply(`❌ *فشل تحميل الصوت!*`);

        await conn.sendMessage(m.chat, { 
          image: { url: video.thumbnail }, 
          caption 
        }, { quoted: fkon });

        await conn.sendMessage(m.chat, { 
          audio: { url: ytmp3.result.download }, 
          mimetype: 'audio/mp4', 
          fileName: `${video.title}.mp3`
        }, { quoted: fkon });

      } catch (e) {
        return m.reply(`❌ *فشل البحث عن الفيديو!*`);
      }
      break;

    case 'ytmp3':
    case 'ytmp4':
      let format = command === 'ytmp3' ? 'mp3' : args[1] || '720';
      if (!/^https?:\/\/(www\.)?youtube\.com|youtu\.be/.test(args[0])) return m.reply("⚠️ *يرجى إدخال رابط يوتيوب صحيح!*");

      try {
        let res = await downloadYouTube(args[0], format);
        if (!res.status) return m.reply(`❌ *خطأ:* ${res.error}`);

        let { title, download, type } = res.result;

        if (type === 'video') {
          await conn.sendMessage(m.chat, { 
            video: { url: download },
            caption: `🎬 *${title}*`
          }, { quoted: fkon });
        } else {
          await conn.sendMessage(m.chat, { 
            audio: { url: download }, 
            mimetype: 'audio/mp4', 
            fileName: `${title}.mp3`
          }, { quoted: fkon });
        }
      } catch (e) {
        m.reply(`❌ *فشل التحميل!*`);
      }
      break;

    default:
      m.reply("*الأمر غير معروف!*");
  }
}


handler.menudownload = ['play', 'ytmp3', 'ytmp4']
handler.command = ['شغل', 'ytmp3', 'ytmp4']
export default handler

// =========================================

async function downloadYouTube(link, format = '720') {
  const apiBase = "https://media.savetube.me/api";
  const apiCDN = "/random-cdn";
  const apiInfo = "/v2/info";
  const apiDownload = "/download";

  const decryptData = async (enc) => {
    try {
      const key = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex');
      const data = Buffer.from(enc, 'base64');
      const iv = data.slice(0, 16);
      const content = data.slice(16);
      
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
      let decrypted = decipher.update(content);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return JSON.parse(decrypted.toString());
    } catch (error) {
      return null;
    }
  };

  const request = async (endpoint, data = {}, method = 'post') => {
    try {
      const { data: response } = await axios({
        method,
        url: `${endpoint.startsWith('http') ? '' : apiBase}${endpoint}`,
        data: method === 'post' ? data : undefined,
        params: method === 'get' ? data : undefined,
        headers: {
          'accept': '*/*',
          'content-type': 'application/json',
          'origin': 'https://yt.savetube.me',
          'referer': 'https://yt.savetube.me/',
          'user-agent': 'Postify/1.0.0'
        }
      });
      return { status: true, data: response };
    } catch (error) {
      return { status: false, error: error.message };
    }
  };

  const youtubeID = link.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (!youtubeID) return { status: false, error: "فشل استخراج معرف الفيديو من الرابط." };

  try {
    const cdnRes = await request(apiCDN, {}, 'get');
    if (!cdnRes.status) return cdnRes;
    const cdn = cdnRes.data.cdn;

    const infoRes = await request(`https://${cdn}${apiInfo}`, { url: `https://www.youtube.com/watch?v=${youtubeID[1]}` });
    if (!infoRes.status) return infoRes;
    
    const decrypted = await decryptData(infoRes.data.data);
    if (!decrypted) return { status: false, error: "فشل فك تشفير بيانات الفيديو." };

    const downloadRes = await request(`https://${cdn}${apiDownload}`, {
      id: youtubeID[1],
      downloadType: format === 'mp3' ? 'audio' : 'video',
      quality: format === 'mp3' ? '128' : format,
      key: decrypted.key
    });

    return {
      status: true,
      result: {
        title: decrypted.title || "غير معروف",
        type: format === 'mp3' ? 'audio' : 'video',
        format: format,
        download: downloadRes.data.data.downloadUrl
      }
    };
  } catch (error) {
    return { status: false, error: error.message };
  }
}