import { EventEmitter } from 'node:events';
import { sendEmail } from '../libs/utils';

export const emailEvent = new EventEmitter();

emailEvent.on('activation-email', async (email : string, activationCode : string) => {
  await sendEmail({
      email,
      subject : 'Activate Your Account',
      text : 'Please use the following code to activate your account: ' + activationCode,
      html : `
        <div style="font-family: 'Georgia', serif; line-height: 1.8; color: #000; background-color: #f9f9f9; padding: 20px; border: 1px solid #ccc;">
          <h2 style="color: #000; text-align: center; font-size: 24px;">Account Activation</h2>
          <p style="text-align: center; font-size: 18px;">Dear Valued User,</p>
          <p style="text-align: center; font-size: 16px;">We are excited to have you on board. To complete your registration, please use the activation code provided below:</p>
          <div style="border: 2px solid #000; padding: 15px; font-size: 22px; margin: 30px auto; text-align: center; width: fit-content; background-color: #fff;">
            <strong>${activationCode}</strong>
          </div>
          <p style="text-align: center; font-size: 16px;">If you did not initiate this request, please disregard this email or reach out to our support team for assistance.</p>
          <p style="text-align: center; font-size: 16px;">Warm regards,<br><em>Your Support Team</em></p>
        </div>
      `
    });
});

emailEvent.on('invoice.payment_failed', async (email : string, paymentLink : string, invoiceId : string) => {
  await sendEmail({
    email,
    subject : 'Action Required: Complete Your Payment',
    text: `Dear Esteemed Customer,

    We regret to inform you that your recent payment attempt for invoice ${invoiceId} was unsuccessful. To finalize your payment, please click on the following link:
    
    ${paymentLink}
    
    Should you have any inquiries or require assistance, please do not hesitate to contact our support team.
    
    Thank you for your prompt attention to this matter.
    
    Sincerely,
    Your Support Team`,
    html: `
    <div style="font-family: 'Georgia', serif; line-height: 1.8; color: #000; background-color: #f9f9f9; padding: 20px; border: 1px solid #ccc;">
        <h2 style="color: #000; text-align: center; font-size: 24px;">Payment Required: Complete Your Transaction</h2>
        <p style="text-align: center; font-size: 18px;">Dear Esteemed Customer,</p>
        <p style="text-align: center; font-size: 16px;">We regret to inform you that your recent payment attempt for invoice <strong>${invoiceId}</strong> was unsuccessful. To complete your payment, kindly click on the link below:</p>
        <div style="border: 2px solid #000; padding: 15px; font-size: 18px; margin: 30px auto; text-align: center; width: fit-content; background-color: #fff;">
            <a href="${paymentLink}" style="color: #000; background-color: #fff; text-decoration: none; padding: 10px 20px; border: 2px solid #000; font-weight: bold; display: inline-block;">Complete Your Payment</a>
        </div>
        <p style="text-align: center; font-size: 16px;">Should you have any inquiries or require assistance, please do not hesitate to contact our support team.</p>
        <p style="text-align: center; font-size: 16px;">Thank you for your prompt attention to this matter.</p>
        <p style="text-align: center; font-size: 16px;">Sincerely,<br><em>Your Support Team</em></p>
    </div>
`,
  });

});