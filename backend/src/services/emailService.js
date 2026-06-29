import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Testar conexão ao iniciar
transporter.verify().then(() => {
  console.log('[email] SMTP conectado com sucesso');
}).catch((err) => {
  console.error('[email] SMTP ERRO:', err.message);
});

const FROM = process.env.SMTP_USER || 'nao-respoda@hud-broker.com';
const SITE_URL = process.env.SITE_URL || 'https://hud-broker.com';

function baseTemplate(content) {
  var now = new Date();
  var date = now.toLocaleDateString('pt-BR');
  var time = now.toLocaleTimeString('pt-BR');
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0a0e17;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="text-align:center;padding:24px 0;border-bottom:1px solid #1c2040;"><span style="font-size:28px;font-weight:800;color:#fff;">HUD<span style="color:#e8a23d;">BROKER</span></span></div><div style="padding:32px 24px;background:#10142a;border-radius:0 0 12px 12px;">' + content + '</div><div style="text-align:center;padding:20px 0;font-size:11px;color:#555;">E-mail enviado em ' + date + ' ' + time + '.<br>&copy; 2025 HudBroker - Todos os direitos reservados.</div></div></body></html>';
}

export async function sendWelcomeEmail(to, name) {
  var content = '<h2 style="color:#fff;margin:0 0 16px;font-size:22px;">Bem-vindo ao HudBroker!</h2><p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">Ol\u00e1, <strong style="color:#fff;">' + (name || to) + '</strong>.</p><p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">Sua conta foi criada com sucesso! Agora voc\u00ea tem acesso \u00e0 nossa plataforma de trading com:</p><ul style="color:#ccc;font-size:14px;line-height:2;margin:0 0 20px;padding-left:20px;"><li><strong style="color:#e8a23d;">R$ 10.000,00</strong> em saldo demo para praticar</li><li>Mais de <strong style="color:#e8a23d;">40 ativos</strong> dispon\u00edveis</li><li>Retorno de at\u00e9 <strong style="color:#e8a23d;">98%</strong> por opera\u00e7\u00e3o</li><li>Dep\u00f3sito instant\u00e2neo via <strong style="color:#e8a23d;">PIX</strong></li></ul><div style="text-align:center;margin:24px 0;"><a href="' + SITE_URL + '/trade" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8a23d,#d4922f);color:#000;border-radius:6px;font-size:15px;font-weight:700;text-decoration:none;">COME\u00c7AR A OPERAR</a></div>';

  try {
    await transporter.sendMail({ from: '"HudBroker" <' + FROM + '>', to: to, subject: 'Bem-vindo ao HudBroker!', html: baseTemplate(content) });
    console.log('[email] Boas-vindas enviado para', to);
  } catch (err) {
    console.error('[email] Erro boas-vindas:', err.message);
  }
}

export async function sendPasswordResetEmail(to, tempPassword) {
  var content = '<h2 style="color:#fff;margin:0 0 16px;font-size:22px;">Restaure seu acesso</h2><p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">Ol\u00e1, <strong style="color:#fff;">' + to + '</strong>.</p><p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 20px;">Recebemos seu pedido de restaura\u00e7\u00e3o de acesso. Por favor, utilize a senha tempor\u00e1ria abaixo. Lembre-se de alterar sua senha ap\u00f3s acessar pela primeira vez com a senha provis\u00f3ria.</p><div style="text-align:center;padding:20px;background:#0a0e17;border-radius:8px;border:1px solid #1c2040;margin:0 0 20px;"><div style="color:#888;font-size:12px;margin-bottom:6px;">Nova senha:</div><div style="color:#e8a23d;font-size:28px;font-weight:800;letter-spacing:2px;">' + tempPassword + '</div></div><div style="text-align:center;margin:24px 0;"><a href="' + SITE_URL + '/login" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8a23d,#d4922f);color:#000;border-radius:6px;font-size:15px;font-weight:700;text-decoration:none;">ACESSAR SITE</a></div>';

  try {
    await transporter.sendMail({ from: '"HudBroker" <' + FROM + '>', to: to, subject: 'Restaure seu acesso - HudBroker', html: baseTemplate(content) });
    console.log('[email] Reset enviado para', to);
  } catch (err) {
    console.error('[email] Erro reset:', err.message);
  }
}
