// mailService.js
const mailjet = require('node-mailjet');

const client = mailjet.apiConnect(
  process.env.API_KEY,
  process.env.SECRET_KEY
);

const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const request = client.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: "", ///////////////////////
            Name: "REST API Generator",
          },
          To: [
            {
              Email: email,
            },
          ],
          TemplateID: 6908299,
          TemplateLanguage: true,
          Variables: {
            reset_link: resetUrl,
          },
        },
      ],
    });

    return await request;
  } catch (error) {
    console.error('Ошибка при отправке письма через Mailjet:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
};