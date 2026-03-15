// Play YouTube -Haidar
// screp : https://whatsapp.com/channel/0029VavOkL00lwgmRLmffH1i/159
// https://whatsapp.com/channel/0029VamzFetC6ZvcD1qde90Z
import axios from "axios";
import yts from "yt-search";

const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav'];
const formatVideo = ['360', '480', '720', '1080', '1440', '4k'];

const ddownr = {
  download: async (url, format) => {
    if (!formatAudio.includes(format) && !formatVideo.includes(format)) {
      throw new Error('التنسيق غير مدعوم، يرجى التحقق من قائمة التنسيقات المتاحة.');
    }

    const config = {  
      method: 'GET',  
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,  
      headers: {  
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'  
      }  
    };  

    try {  
      const response = await axios.request(config);  

      if (response.data && response.data.success) {  
        const { id, title, info } = response.data;  
        const { image } = info;  
        const downloadUrl = await ddownr.cekProgress(id);  

        return {  
          id: id,  
          image: image,  
          title: title,  
          downloadUrl: downloadUrl  
        };  
      } else {  
        throw new Error('فشل في الحصول على تفاصيل الفيديو.');  
      }  
    } catch (error) {  
      console.error('خطأ:', error);  
      throw error;  
    }
  },
  cekProgress: async (id) => {
    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    try {  
      while (true) {  
        const response = await axios.request(config);  

        if (response.data && response.data.success && response.data.progress === 1000) {  
          return response.data.download_url;  
        }  
        await new Promise(resolve => setTimeout(resolve, 5000));  
      }  
    } catch (error) {  
      console.error('خطأ:', error);  
      throw error;  
    }
  }
};

const handler = async (m, { conn, usedPrefix, text, command }) => {
  if (!text) return m.reply(`اكتب اسم الأغنية التي تبحث عنها، مثال:\n${usedPrefix + command} dj kane`);

  try {
    const search = await yts(text);
    const video = search.all[0];

    if (!video) {  
      return m.reply('لم يتم العثور على الأغنية التي تبحث عنها.');  
    }  

    const detail = `*تشغيل صوت من يوتيوب*\n\n❏ العنوان: ${video.title}\n` +  
      `❏ المشاهدات: ${video.views}\n` +  
      `❏ الناشر: ${video.author.name}\n` +  
      `❏ تاريخ الرفع: ${video.ago}\n` +  
      `🔗 الرابط: ${video.url}\n` +  
      `_جاري تنزيل الصوت..._`;  

    await conn.sendMessage(m.chat, {  
      text: detail,  
      contextInfo: {  
        forwardingScore: 999,  
        isForwarded: true,  
        externalAdReply: {  
          title: video.title,  
          mediaType: 1,  
          previewType: 1,  
          body: `تشغيل يوتيوب بواسطة Mahiru-MD`,  
          thumbnailUrl: video.image,  
          renderLargerThumbnail: true,  
          mediaUrl: video.url,  
          sourceUrl: video.url  
        }  
      }  
    }, { quoted: m });  

    const result = await ddownr.download(video.url, "mp3");  
    if (!result.downloadUrl) return m.reply('فشل في تنزيل الصوت.');  

    await conn.sendMessage(m.chat, {  
      audio: { url: result.downloadUrl },  
      mimetype: 'audio/mpeg',  
    }, { quoted: m });

  } catch (error) {
    m.reply(`حدث خطأ:\n${error.message}`);
  }
};

handler.help = ['play'].map(v => v + ' <رابط أو اسم الأغنية>');
handler.tags = ['بحث', 'صوت'];
handler.command = /^(song|lagu|carikanlagu|cari kan lagu|play|musik|music)$/i;

export default handler;