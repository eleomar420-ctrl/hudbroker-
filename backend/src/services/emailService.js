import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'nao-respoda@hud-broker.com',
    pass: process.env.SMTP_PASS || ''
  }
});

const FROM = process.env.SMTP_USER || 'nao-respoda@hud-broker.com';
const SITE_URL = process.env.SITE_URL || 'https://hud-broker.com';

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e17;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;padding:24px 0;border-bottom:1px solid #1c2040;">
    <span style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">HUD<span style="color:#e8a23d;">BROKER</span></span>
  </div>
  <div style="padding:32px 24px;background:#10142a;border-radius:0 0 12px 12px;">
    ${content}
  </div>
  <div style="text-align:center;padding:20px 0;font-size:11px;color:#555;">
    E-mail enviado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}.<br>
    &copy; ${new Date().getFullYear()} HudBroker - Todos os direitos reservados.
  </div>
</div>
</body>
</html>`;
}

export async function sendWelcomeEmail(to, name) {
  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px;">Bem-vindo à HudBroker! 🎉</h2>
    <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Olá, <strong style="color:#fff;">${name || to}</strong>.
    </p>
    <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Sua conta foi criada com sucesso! Agora você tem acesso à nossa plataforma de trading com:
    </p>
    <ul style="color:#ccc;font-size:14px;line-height:2;margin:0 0 20px;padding-left:20px;">
      <li><strong style="color:#e8a23d;">R$ 10.000,00</strong> em saldo demo para praticar</li>
      <li>Mais de <strong style="color:#e8a23d;">40 ativos</strong> disponíveis</li>
      <li>Retorno de até <strong style="color:#e8a23d;">98%</strong> por operação</li>
      <li>Depósito instantâneo via <strong style="color:#e8a23d;">PIX</strong></li>
    </ul>
    <div style="text-align:center;margin:24px 0;">
      <a href="${SITE_URL}/trade" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8a23d,#d4922f);color:#000;border-radius:6px;font-size:15px;font-weight:700;text-decoration:none;">COMEÇAR A OPERAR</a>
    </div>
    <p style="color:#888;font-size:12px;margin:0;text-align:center;">
      Se você não criou esta conta, ignore este e-mail.
    </p>`;

  try {
    await transporter.sendMail({
      from: `"HudBroker" <${FROM}>`,
      to,
      subject: 'Bem-vindo à HudBroker! 🎉',
      html: baseTemplate(content)
    });
    console.log('[email] Boas-vindas enviado para', to);
  } catch (err) {
    console.error('[email] Erro ao enviar boas-vindas:', err.message);
  }
}

export async function sendPasswordResetEmail(to, tempPassword) {
  const content = `
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px;">Restaure seu acesso</h2>
    <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Olá, <strong style="color:#fff;">${to}</strong>.
    </p>
    <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Recebemos seu pedido de restauração de acesso. Por favor, utilize a senha temporária abaixo. Lembre-se de alterar sua senha após acessar pela primeira vez com a senha provisória.
    </p>
    <div style="text-align:center;padding:20px;background:#0a0e17;border-radius:8px;border:1px solid #1c2040;margin:0 0 20px;">
      <div style="color:#888;font-size:12px;margin-bottom:6px;">Nova senha:</div>
      <div style="color:#e8a23d;font-size:28px;font-weight:800;letter-spacing:2px;">${tempPassword}</div>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${SITE_URL}/login" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8a23d,#d4922f);color:#000;border-radius:6px;font-size:15px;font-weight:700;text-decoration:none;">ACESSAR SITE</a>
    </div>
    <p style="color:#888;font-size:12px;margin:0;text-align:center;">
      Se você não solicitou esta restauração, ignore este e-mail.
    </p>`;

  try {
    await transporter.sendMail({
      from: `"HudBroker" <${FROM}>`,
      to,
      subject: 'Restaure seu acesso - HudBroker',
      html: baseTemplate(content)
    });
    console.log('[email] Reset de senha enviado para', to);
  } catch (err) {
    console.error('[email] Erro ao enviar reset:', err.message);
  }
}
