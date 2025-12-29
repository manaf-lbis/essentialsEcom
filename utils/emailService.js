const SibApiV3Sdk = require('sib-api-v3-sdk');
const dotenv = require('dotenv');
dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { "name": process.env.EMAIL_SENDER_NAME, "email": process.env.EMAIL_USER };
        sendSmtpEmail.to = [{ "email": to }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', data);
        return { accepted: [to] }; // Mocking nodemailer response structure for compatibility
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
