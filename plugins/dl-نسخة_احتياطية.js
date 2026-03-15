import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ownerNumber = '967778471926@s.whatsapp.net'; // رقم المطور هنا

const handler = async (m, { conn, args, command }) => {
  const who = m.mentionedJid?.[0] || m.sender;
  const username = conn.getName(who);

  // نفس كائن الـ quoted message المستخدم في مشروعك
  const fkon = { 
    key: { 
      fromMe: false,
      participant: `0@c.us`, 
      ...(m.chat ? { remoteJid: `status@broadcast` } : {}) 
    },
    message: { 
      contactMessage: { 
        displayName: username, 
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${username},;;;\nFN:${username}\nitem1.TEL;waid=${who.split('@')[0]}:${who.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    }
  };

  switch (command.toLowerCase()) {
    case 'نسخة':
      if (m.sender !== ownerNumber) return m.reply('❌ *هذا الأمر للمطور فقط!*');
      
      try {
        await m.reply('🔄 *جارِ إنشاء النسخة الاحتياطية...*');

        const botFolder = path.join(__dirname, '../');
        const zipPath = path.join(__dirname, '../bot_backup.zip');

        // تنفيذ أمر الضغط بنفس أسلوب مشروعك
        const zipCommand = `zip -r "${zipPath}" . -x "node_modules/*" ".git/*" "*.zip"`;
        
        await new Promise((resolve, reject) => {
          exec(zipCommand, { cwd: botFolder }, (error) => {
            error ? reject(error) : resolve();
          });
        });

        // إرسال الملف بنفس طريقة إرسال الصوت/الفيديو
        await conn.sendMessage(m.chat, {
          document: fs.readFileSync(zipPath),
          mimetype: 'application/zip',
          fileName: 'bot_backup.zip',
          caption: '✅ *تم إنشاء النسخة الاحتياطية بنجاح*'
        }, { quoted: fkon });

        fs.unlinkSync(zipPath);
        
      } catch (error) {
        await m.reply(`❌ *فشل النسخ الاحتياطي:*\n${error.message}`);
      }
      break;

    default:
      m.reply('⚠️ *أمر غير معروف!*');
  }
};

// نفس الإعدادات المستخدمة في مشروعك
handler.command = ['نسخة'];
handler.group = false;
handler.limit = true;

export default handler;