const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "in-v3.mailjet.com",
    port: 587,
    auth: {
      user: process.env.MAILJET_API_KEY, 
      pass: process.env.MAILJET_SECRET_KEY 
    }
  });

/**
 * Відправка електронного листа
 * @param {Object} options - Параметри листа
 * @returns {Promise} Результат відправки
 */

const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail
};