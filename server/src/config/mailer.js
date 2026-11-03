const nodemailer = require('nodemailer');
const env = require('./env');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // In test/development, if ethereal or dummy credentials are used, configure safe fallback
  if (env.SMTP_USER === 'test@ethereal.email' || !env.SMTP_USER) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Mailer] Initialized Ethereal test account: ${testAccount.user}`);
    } catch (err) {
      console.warn(`[Mailer] Could not create Ethereal test account: ${err.message}. Terminal logging will be used.`);
      transporter = {
        sendMail: async (options) => {
          console.log('\n================== [DEV EMAIL SIMULATOR] ==================');
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`Body:\n${options.text || options.html}`);
          console.log('===========================================================\n');
          return { messageId: 'simulated-dev-id-' + Date.now() };
        }
      };
    }
  } else {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const mail = await getTransporter();
  const info = await mail.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  if (nodemailer.getTestMessageUrl && info && info.messageId && !info.messageId.startsWith('simulated')) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Mailer] Preview URL: ${previewUrl}`);
    }
  }

  return info;
};

module.exports = {
  sendEmail,
};

