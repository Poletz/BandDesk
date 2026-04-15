type SendBandInviteEmailParams = {
  toEmail: string;
  invitedByName: string;
  bandName: string;
  acceptUrl: string;
  role: 'admin' | 'member' | 'guest';
  expiresAt: string;
};

type SendBandInviteEmailResult =
  | { sent: true }
  | { sent: false; reason: 'MISSING_CONFIG' | 'SENDGRID_ERROR'; details?: string };

const SENDGRID_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';

export const buildInviteAcceptUrl = (token: string) => {
  const baseUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
  const url = new URL('/accept-invite', baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
};

export const sendBandInviteEmail = async (
  params: SendBandInviteEmailParams
): Promise<SendBandInviteEmailResult> => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const sender = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !sender) {
    return { sent: false, reason: 'MISSING_CONFIG' };
  }

  const subject = `Invito a collaborare con ${params.bandName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.4;">
      <p>Ciao,</p>
      <p><strong>${params.invitedByName}</strong> ti ha invitato nella band <strong>${params.bandName}</strong> con ruolo <strong>${params.role}</strong>.</p>
      <p>L'invito scade il ${new Date(params.expiresAt).toLocaleString('it-IT')}.</p>
      <p>
        <a href="${params.acceptUrl}" style="display: inline-block; background: #111827; color: #fff; text-decoration: none; padding: 10px 14px; border-radius: 6px;">
          Accetta invito
        </a>
      </p>
      <p>Se non ti aspettavi questa email, puoi ignorarla.</p>
    </div>
  `;

  const text = [
    `Ciao,`,
    `${params.invitedByName} ti ha invitato nella band ${params.bandName} con ruolo ${params.role}.`,
    `Invito valido fino al ${new Date(params.expiresAt).toISOString()}.`,
    `Accetta da qui: ${params.acceptUrl}`,
  ].join('\n');

  const response = await fetch(SENDGRID_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: params.toEmail }] }],
      from: { email: sender },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    return { sent: false, reason: 'SENDGRID_ERROR', details };
  }

  return { sent: true };
};
