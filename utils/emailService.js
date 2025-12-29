const SibApiV3Sdk = require('sib-api-v3-sdk');
const dotenv = require('dotenv');
dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, htmlContent) => {
    if (!process.env.BREVO_API_KEY) {
        console.error('FATAL ERROR: BREVO_API_KEY is not defined in environment variables.');
        throw new Error('BREVO_API_KEY is missing');
    }

    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { "name": process.env.EMAIL_SENDER_NAME || 'AutoFit', "email": process.env.EMAIL_USER };
        sendSmtpEmail.to = [{ "email": to }];

        console.log(`[EmailService] Attempting to send email to ${to} with Brevo...`);
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('[EmailService] Email sent successfully. Response:', JSON.stringify(data));
        return { accepted: [to] }; // Mocking nodemailer response structure for compatibility
    } catch (error) {
        console.error('[EmailService] Error sending email:', error);
        if (error.response) {
            console.error('[EmailService] Brevo API Response Error Body:', error.response.body);
            console.error('[EmailService] Brevo API Response Status:', error.response.status);
        }
        throw error;
    }
};

module.exports = { sendEmail };
