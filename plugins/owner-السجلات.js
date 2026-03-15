// * Code By Nazand Code
// * Fitur Mengirim Semua Isi Dalam Console Server Panel (Dibuat Krn Gabut)
// * Hapus Wm Denda 500k Rupiah
// * https://whatsapp.com/channel/0029Vaio4dYC1FuGr5kxfy2l

let consoleLogs = "";
function captureConsoleLogs() {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  console.log = function(...args) {
    const message = args.join(' ');
    consoleLogs += `[LOG] ${message}\n`;
    originalConsoleLog.apply(console, args);
  };

  console.error = function(...args) {
    const message = args.join(' ');
    consoleLogs += `[ERROR] ${message}\n`;
    originalConsoleError.apply(console, args);
  };
}
async function sendConsoleLogs(conn, chatId) {
  if (!consoleLogs) {
    return conn.sendMessage(chatId, { text: 'Tidak ada log yang tersedia.' });
  }
  await conn.sendMessage(chatId, { text: consoleLogs });

  // Jika ingin mengirim log dalam bentuk file teks
  // const tempFilePath = '/tmp/console_logs.txt';
  // fs.writeFileSync(tempFilePath, consoleLogs);
  // await conn.sendMessage(chatId, { document: { url: tempFilePath }, mimetype: 'text/plain', fileName: 'console_logs.txt' });
  
  consoleLogs = '';
}
let handler = async (m, { conn }) => {
  try {
    await sendConsoleLogs(conn, m.chat);
  } catch (error) {
    console.error('terjadi Kesalahan Bang:', error);
    await conn.sendMessage(m.chat, { text: `⚠️ Error: ${error.message}` }, { quoted: m });
  }
};
captureConsoleLogs();
handler.help = ['console'];
handler.tags = ['tools'];
handler.command = /^السجلات$/i;
handler.owner = true
export default handler;