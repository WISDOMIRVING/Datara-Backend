/**
 * Email Templates for Datara VTU
 */

export const registrationTemplate = (name) => `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h2 style="color: #1e3a8a;">Welcome to Datara, ${name}!</h2>
    <p>Your account has been successfully created. You can now fund your wallet and start buying data, airtime, and more at the best rates.</p>
    <div style="margin: 30px 0; text-align: center;">
        <a href="http://localhost:3000/login" style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Dashboard</a>
    </div>
    <p style="color: #666; font-size: 12px;">If you didn't create this account, please ignore this email.</p>
</div>
`;

export const fundingTemplate = (amount, newBalance) => `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h2 style="color: #059669;">Wallet Funded Successfully!</h2>
    <p>Your Datara wallet has been credited with <strong>₦${amount.toLocaleString()}</strong>.</p>
    <p>Your new balance is <strong>₦${newBalance.toLocaleString()}</strong>.</p>
    <div style="margin: 30px 0; border-top: 1px solid #eee; padding-top: 20px;">
        <p style="color: #666; font-size: 14px;">Transaction Reference: ${new Date().getTime()}</p>
    </div>
</div>
`;

export const purchaseTemplate = (service, amount, status) => `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h2 style="color: ${status === "SUCCESS" ? "#1e3a8a" : "#dc2626"};">Transaction ${status}</h2>
    <p>Your purchase of <strong>${service}</strong> for <strong>₦${amount.toLocaleString()}</strong> was <strong>${status}</strong>.</p>
    <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px;">Date: ${new Date().toLocaleString()}</p>
        <p style="margin: 5px 0 0; font-size: 14px;">Status: <span style="font-weight: bold; color: ${status === "SUCCESS" ? "#059669" : "#dc2626"};">${status}</span></p>
    </div>
    <p style="color: #666; font-size: 12px;">Thank you for choosing Datara.</p>
</div>
`;
