const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.EMAIL_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'imsouveek@gmail.com',
    subject: 'Welcome to Task App',
    text: `Dear ${name},\n\nWe are so glad that you have joined us!\n\nRegards,\n\nTask App Team`
  });
}

const sendGoodByeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'imsouveek@gmail.com',
    subject: 'Goodbye from Task App',
    text: `Dear ${name},\n\nWe are so sorry to see you go!\n\nRegards,\n\nTask App Team`
  });
}

module.exports = {
  sendWelcomeEmail,
  sendGoodByeEmail
}