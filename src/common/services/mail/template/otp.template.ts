const BRAND_NAME = 'Ghost Store';
const SUPPORT_EMAIL = 'support@ghost.com';
const EXPIRES_IN_MINUTES = 5;
const LOGO_URL =
	'https://static.vecteezy.com/system/resources/thumbnails/005/068/279/small_2x/professional-e-commerce-logo-design-template-vector.jpg';
// ========================================================

const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

export const otpEmailTemplate = (otp: string): string => {
	const brandName = BRAND_NAME;
	const supportEmail = SUPPORT_EMAIL;
	const expiresInMinutes = EXPIRES_IN_MINUTES;
	const logoUrl = LOGO_URL;
	const year = new Date().getFullYear();

	const safeOtp = escapeHtml(otp);
	const safeBrand = escapeHtml(brandName);
	const safeSupport = escapeHtml(supportEmail);

	const brandBlock = logoUrl
		? `<img src="${escapeHtml(logoUrl)}" alt="${safeBrand}" width="120" style="display:block; margin:0 auto; border:0; outline:none; height:auto;" />`
		: `<span style="font-size:20px; font-weight:800; color:#fbbf24; font-family: Arial, Helvetica, sans-serif; letter-spacing:0.5px;">${safeBrand}</span>`;

	return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="dark light" />
<title>${safeBrand} – Verification Code</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#0b0b10;" bgcolor="#0b0b10">

  <!-- Preheader (النص اللي بيظهر جنب العنوان في الـ inbox) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    Your ${safeBrand} verification code is ${safeOtp} — expires in ${expiresInMinutes} minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b0b10; padding:40px 16px;" bgcolor="#0b0b10">
    <tr>
      <td align="center">

        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; width:100%; background-color:#16161f; border-radius:16px;" bgcolor="#16161f">

          <!-- Top accent bar -->
          <tr>
            <td style="background-color:#f59e0b; height:4px; line-height:4px; font-size:0; border-radius:16px 16px 0 0;" bgcolor="#f59e0b">&nbsp;</td>
          </tr>

          <!-- Brand -->
          <tr>
            <td style="padding:32px 40px 0 40px; text-align:center;">
              ${brandBlock}
            </td>
          </tr>

          <!-- Icon -->
          <tr>
            <td style="padding:24px 40px 0 40px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td width="56" height="56" style="width:56px; height:56px; background-color:#f59e0b; border-radius:14px; text-align:center; vertical-align:middle; font-size:26px;" bgcolor="#f59e0b">
                    🛍️
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:24px 40px 8px 40px; text-align:center;">
              <h1 style="margin:0; font-size:22px; font-weight:700; color:#f4f4f6; font-family: Arial, Helvetica, sans-serif;">
                Confirm your email address
              </h1>
            </td>
          </tr>

          <!-- Subtitle -->
          <tr>
            <td style="padding:0 40px 32px 40px; text-align:center;">
              <p style="margin:0; font-size:14px; line-height:1.7; color:#a0a0b4; font-family: Arial, Helvetica, sans-serif;">
                Thanks for choosing ${safeBrand}! Use the code below to verify your account
                and start shopping the latest deals, track your orders and checkout faster.
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1f1f2c; border-radius:12px;" bgcolor="#1f1f2c">
                <tr>
                  <td style="padding:24px; text-align:center; border:1px dashed #f59e0b; border-radius:12px;">
                    <p style="margin:0 0 8px 0; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#8a8aa0; font-family: Arial, Helvetica, sans-serif;">
                      Your verification code
                    </p>
                    <span style="font-size:38px; font-weight:700; letter-spacing:10px; color:#fbbf24; font-family: 'Courier New', Courier, monospace;">
                      ${safeOtp}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td style="padding:20px 40px 0 40px; text-align:center;">
              <p style="margin:0; font-size:13px; color:#7a7a90; font-family: Arial, Helvetica, sans-serif;">
                ⏱ This code expires in <strong style="color:#a0a0b4;">${expiresInMinutes} minutes</strong>
              </p>
            </td>
          </tr>

          <!-- Security tip -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1b1b27; border-radius:10px;" bgcolor="#1b1b27">
                <tr>
                  <td style="padding:14px 16px; font-size:12px; line-height:1.6; color:#9a9ab0; font-family: Arial, Helvetica, sans-serif;">
                    🔐 <strong style="color:#c4c4d4;">Security tip:</strong>
                    ${safeBrand} will never ask for your code by phone, chat or social media. Don't share it with anyone.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:1px; background-color:#2a2a3d; font-size:0; line-height:0;" bgcolor="#2a2a3d">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer note -->
          <tr>
            <td style="padding:24px 40px 36px 40px; text-align:center;">
              <p style="margin:0; font-size:12px; line-height:1.7; color:#6a6a80; font-family: Arial, Helvetica, sans-serif;">
                Didn't request this code? You can safely ignore this email.<br />
                Need help? Contact us at
                <a href="mailto:${safeSupport}" style="color:#fbbf24; text-decoration:none;">${safeSupport}</a>
              </p>
            </td>
          </tr>

        </table>

        <!-- Bottom brand -->
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; width:100%;">
          <tr>
            <td style="padding:24px 0; text-align:center;">
              <p style="margin:0; font-size:12px; color:#555568; font-family: Arial, Helvetica, sans-serif;">
                © ${year} ${safeBrand} — All rights reserved
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
};
