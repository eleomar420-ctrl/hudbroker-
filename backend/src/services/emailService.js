var RESEND_KEY = process.env.RESEND_API_KEY || '';
var FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
var SITE_URL = process.env.SITE_URL || 'https://hud-broker.com';

async function sendEmail(to, subject, html) {
  try {
    var res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'HudBroker <' + FROM_EMAIL + '>', to: [to], subject: subject, html: html })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro Resend');
    console.log('[email] Enviado para', to);
  } catch (err) {
    console.error('[email] Erro:', err.message);
  }
}

if (RESEND_KEY) console.log('[email] Resend configurado');
else console.warn('[email] RESEND_API_KEY não configurada');

function baseTemplate(content) {
  var now = new Date();
  var date = now.toLocaleDateString('pt-BR');
  var time = now.toLocaleTimeString('pt-BR');
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0a0e17;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="text-align:center;padding:24px 0;border-bottom:1px solid #1c2040;"><span style="font-size:28px;font-weight:800;color:#fff;">HUD<span style="color:#e8a23d;">BROKER</span></span></div><div style="padding:32px 24px;background:#10142a;border-radius:0 0 12px 12px;">' + content + '</div><div style="text-align:center;padding:20px 0;font-size:11px;color:#555;">E-mail enviado em ' + date + ' ' + time + '.<br>© 2025 HudBroker - Todos os direitos reservados.</div></div></body></html>';
}

export async function sendWelcomeEmail(to, name) {
  var content = '<h2 style="color:#fff;margin:0 0 16px;font-size:22px;">Bem-vindo ao HudBroker!</h2><p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">Ola, <strong style="color:#fff;">' + (name || to) + '</strong>.</p><p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">Sua conta foi criada com sucesso! Agora voce tem acesso a nossa plataforma de trading com:</p><ul style="color:#ccc;font-size:14px;line-height:2;margin:0 0 20px;padding-left:20px;"><li><strong style="color:#e8a23d;">R$ 10.000,00</strong> em saldo demo para praticar</li><li>Mais de <strong style="color:#e8a23d;">40 ativos</strong> disponiveis</li><li>Retorno de ate <strong style="color:#e8a23d;">98%</strong> por operacao</li><li>Deposito instantaneo via <strong style="color:#e8a23d;">PIX</strong></li></ul><div style="text-align:center;margin:24px 0;"><a href="' + SITE_URL + '/trade" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8a23d,#d4922f);color:#000;border-radius:6px;font-size:15px;font-weight:700;text-decoration:none;">COMECAR A OPERAR</a></div>';
  await sendEmail(to, 'Bem-vindo ao HudBroker!', baseTemplate(content));
}

export async function sendPasswordResetEmail(to, tempPassword) {
  var content = '<h2 style="color:#fff;margin:0 0 16px;font-size:22px;">Restaure seu acesso</h2><p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">Ola, <strong style="color:#fff;">' + to + '</strong>.</p><p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 20px;">Recebemos seu pedido de restauracao de acesso. Por favor, utilize a senha temporaria abaixo. Lembre-se de alterar sua senha apos acessar pela primeira vez com a senha provisoria.</p><div style="text-align:center;padding:20px;background:#0a0e17;border-radius:8px;border:1px solid #1c2040;margin:0 0 20px;"><div style="color:#888;font-size:12px;margin-bottom:6px;">Nova senha:</div><div style="color:#e8a23d;font-size:28px;font-weight:800;letter-spacing:2px;">' + tempPassword + '</div></div><div style="text-align:center;margin:24px 0;"><a href="' + SITE_URL + '/login" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8a23d,#d4922f);color:#000;border-radius:6px;font-size:15px;font-weight:700;text-decoration:none;">ACESSAR SITE</a></div>';
  await sendEmail(to, 'Restaure seu acesso - HudBroker', baseTemplate(content));
}
