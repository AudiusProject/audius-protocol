export const email = ({
  name,
  handle,
  profilePicture,
  profileLink,
  amount,
  challengeTitle,
  challengeDescription,
  challengeImage
}: {
  name: string
  handle: string
  profilePicture: string
  profileLink: string
  amount: number
  challengeTitle: string
  challengeDescription: string
  challengeImage: string
}) => {
  const copyrightYear = new Date().getFullYear().toString()

  return `
  <!DOCTYPE html>
  <!-- saved from url=(0124)file:///Users/isaacsolo/Downloads/Transactional/Reward%20Earned/Congratulations!%20You%E2%80%99ve%20earned%20a%20reward.html -->
  <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  
  <meta content="width=device-width" name="viewport">
  <meta content="IE=edge" http-equiv="X-UA-Compatible">
  <meta name="x-apple-disable-message-reformatting">
  <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection">
  <title>Congratulations! 🏆 You’ve earned a reward! </title>
  <!--[if mso]>
              <style>
                  * {
                      font-family: sans-serif !important;
                  }
              </style>
          <![endif]-->
  <!--[if !mso]><!-->
  <!-- <![endif]-->
  <link href="https://download.audius.co/emails/reward-in-cooldown/css" rel="stylesheet" type="text/css">
  <link href="https://download.audius.co/emails/reward-in-cooldown/css(1)" rel="stylesheet" type="text/css">
  <link href="https://download.audius.co/emails/reward-in-cooldown/css(2)" rel="stylesheet" type="text/css">
  <link href="https://download.audius.co/emails/reward-in-cooldown/css(3)" rel="stylesheet" type="text/css">
  <link href="https://download.audius.co/emails/reward-in-cooldown/css(4)" rel="stylesheet" type="text/css">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
  html {
      margin: 0 !important;
      padding: 0 !important;
  }
  
  * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
  }
  td {
      vertical-align: top;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
  }
  a {
      text-decoration: none;
  }
  img {
      -ms-interpolation-mode:bicubic;
  }
  @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
      u ~ div .email-container {
          min-width: 320px !important;
      }
  }
  @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
      u ~ div .email-container {
          min-width: 375px !important;
      }
  }
  @media only screen and (min-device-width: 414px) {
      u ~ div .email-container {
          min-width: 414px !important;
      }
  }
  </style>
  <!--[if gte mso 9]>
          <xml>
              <o:OfficeDocumentSettings>
                  <o:AllowPNG/>
                  <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
          </xml>
          <![endif]-->
  <style>
  @media only screen and (max-device-width: 599px), only screen and (max-width: 599px) {
  
      .eh {
          height:auto !important;
      }
      .desktop {
          display: none !important;
          height: 0 !important;
          margin: 0 !important;
          max-height: 0 !important;
          overflow: hidden !important;
          padding: 0 !important;
          visibility: hidden !important;
          width: 0 !important;
      }
      .mobile {
          display: block !important;
          width: auto !important;
          height: auto !important;
          float: none !important;
      }
      .email-container {
          width: 100% !important;
          margin: auto !important;
      }
      .stack-column,
      .stack-column-center {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          direction: ltr !important;
      }
      .wid-auto {
          width:auto !important;
      }
  
      .table-w-full-mobile {
          width: 100%;
      }
  
      
      
  
      .mobile-center {
          text-align: center;
      }
  
      .mobile-center > table {
          display: inline-block;
          vertical-align: inherit;
      }
  
      .mobile-left {
          text-align: left;
      }
  
      .mobile-left > table {
          display: inline-block;
          vertical-align: inherit;
      }
  
      .mobile-right {
          text-align: right;
      }
  
      .mobile-right > table {
          display: inline-block;
          vertical-align: inherit;
      }
  
  }
  
  </style>
  </head>
  
  <body width="100%" style="background-color:#e9e9eb;margin:0;padding:0!important;mso-line-height-rule:exactly;">
  <div style="background-color:#e9e9eb">
  <!--[if gte mso 9]>
                                              <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                              <v:fill type="tile" color="#e9e9eb"/>
                                              </v:background>
                                              <![endif]-->
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tbody><tr>
  <td valign="top" align="center">
  <div id="preview_text" style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;"> You’ve earned ${amount} $AUDIO tokens for completing a reward! </div>
  <!-- Visually Hidden Preheader Text : END -->
  <!-- Preview Text Spacing Hack : BEGIN -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;"> ‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp; </div>
  <table bgcolor="#ffffff" style="margin:0 auto;" align="center" id="brick_container" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container">
  <tbody><tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="600" style="background-color:#ffffff;  " bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="100%" align="center" style="vertical-align: middle; background-color:#ffffff;   padding-left:8px; padding-right:8px;" bgcolor="#ffffff">
  <table border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="492">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="492" style="vertical-align: middle;  ">
  <table border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td style="vertical-align: middle;" width="60"><img src="${profilePicture}" width="60" border="0" style="min-width:60px; width:60px;
          border-radius:64px; height: auto; display: block;"></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td style="vertical-align: middle;">
  <div style="line-height:24px;text-align:left;"><a target="_blank" href="${profileLink}"><span style="color:#52505f;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:16px;letter-spacing:-0.02em;line-height:24px;text-align:left;">${name}</span></a></div>
  </td>
  </tr>
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  <tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;">
  <div style="line-height:24px;text-align:left;"><a target="_blank" href="${profileLink}"><span style="color:#52505f;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:left;">@${handle}</span></a></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  <td style="width:8px; min-width:8px;" width="8"></td>
  <td style="vertical-align: middle;" width="72" align="center"><img src="https://download.audius.co/emails/reward-in-cooldown/wjpZtP1xhyBviTyxW3eiX3mNsICvfZ.jpeg" width="72" border="0" style="min-width:72px; width:72px;
           height: auto; display: block;"></td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td width="100%" align="center" class="2CrBPysesYMq3T3HpT8feOpQPwhsDF invert-bg" style="background-repeat:no-repeat !important; background-position: center center !important; background-size: cover !important; border-collapse:separate !important; padding-left:24px; padding-right:24px;" background="https://download.audius.co/emails/reward-in-cooldown/2CrBPysesYMq3T3HpT8feOpQPwhsDF.png">
  <!--[if gte mso 9]>
                  <v:image xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style=" border: 0;display: inline-block; width: 600px; height:296px;"
                  src="https://download.audius.co/emails/reward-in-cooldown/2CrBPysesYMq3T3HpT8feOpQPwhsDF.png"
                  />
                  <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style=" border: 0;display: inline-block;position: absolute; width: 600px; height:296px;">
                  <v:fill opacity="0%" color="#000" />
                  <v:textbox inset="0,0,0,0">
                  <![endif]-->
  <div>
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="48" style="height:48px; min-height:48px; line-height:48px;"></td>
  </tr>
  <tr>
  <td width="100%" align="center" style="  padding-left:24px; padding-right:24px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center">
  <div style="line-height:24px;text-align:center;"><span style="color:#7e1bcc;font-weight:600;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:center;">Congratulations!</span></div>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td align="center">
  <div style="line-height:48px;text-align:center;"><span style="color:#101828;font-weight:900;font-family:Inter,Arial,sans-serif;font-size:43px;letter-spacing:-0.02em;line-height:48px;text-align:center;">You’ve Earned a Reward!</span></div>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td align="center">
  <div style="line-height:24px;text-align:center;"><span style="color:#3a3843;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:center;">You’ve earned ${amount} $AUDIO tokens for completing a reward!</span></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="48" style="height:48px; min-height:48px; line-height:48px;"></td>
  </tr>
  </tbody></table>
  </div>
  <!--[if gte mso 9]>
                  </v:textbox>
                  </v:fill>
                  </v:rect>
                  </v:image>
                  <![endif]-->
  </td>
  </tr>
  <tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="center" style="background-color:#ffffff;  " bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="center" style="background-color:#ffffff;  " bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552" align="center" style="vertical-align: middle; background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552" align="center" style="vertical-align: middle;  ">
  <table class="table-w-full-mobile" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td style="vertical-align: middle;" width="156" class="stack-column-center" align="center"><img src="https://download.audius.co/emails/reward-in-cooldown/${challengeImage}" width="156" border="0" style="min-width:156px; width:156px;
          border-radius:8px; height: auto; display: block;"></td>
  <td class="stack-column-center" height="16" style="width:16px; min-width:16px; height:16px; min-height:16px;" width="16">&nbsp;</td>
  <td style="vertical-align: middle;" align="center" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td>
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td width="100%">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td width="100%">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td>
  <div style="line-height:36px;text-align:left;"><span style="color:#3a3843;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:27px;letter-spacing:-0.02em;line-height:36px;text-align:left;">${challengeTitle}</span></div>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td>
  <div style="line-height:24px;text-align:left;"><span style="color:#3a3843;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:left;">${challengeDescription}</span></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552" align="center" style="vertical-align: middle;  ">
  <table class="table-w-full-mobile" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td style="vertical-align: middle;" align="center" width="100%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="100%" align="center" style="vertical-align: middle; background-color:#ffffff;  " bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="100%" align="center" style="vertical-align: middle; background-color:#f9f7fc; border-radius:4px; border:1px solid #ebe4f6; padding-left:24px; padding-right:24px;" bgcolor="#f9f7fc">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:24px;text-align:center;"><span style="color:#7e1bcc;font-weight:600;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:center;">Earned tokens will be ready to claim in 7 days!</span></div>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552" style="vertical-align: middle; height:48px; background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="12" style="height:12px; min-height:12px; line-height:12px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="552">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552">
  <table cellpadding="0" cellspacing="0" height="1" width="100%" style="line-height:1px;height:1px!important; border:1px solid #e9e9eb; border-collapse:separate !important;margin:0 auto;text-align:center;">
  <tbody><tr>
  <td> </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="12" style="height:12px; min-height:12px; line-height:12px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552" align="center" style="vertical-align: middle; background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:36px;text-align:center;"><span style="color:#3a3843;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:27px;letter-spacing:-0.02em;line-height:36px;text-align:center;">What’s next?</span></div>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:24px;text-align:center;"><span style="color:#52505f;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:center;">Here are some ways to use your $AUDIO tokens within the Audius app!</span></div>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552" style="background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td width="552" align="center">
  <table class="table-w-full-mobile" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center" width="47.83%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="background-color:#f9f7fc; border-radius:32px; border:1px solid #ebe4f6; padding-left:16px; padding-right:16px;" bgcolor="#f9f7fc">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="24"><img src="https://download.audius.co/emails/reward-in-cooldown/oc5hUVWNbPpKxHmYw80DXToOBmDJBM.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="100%">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td>
  <div style="line-height:24px;text-align:center;"><span style="color:#3a3843;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:16px;letter-spacing:-0.02em;line-height:24px;text-align:center;">Send a Tip!</span></div>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td>
  <div style="line-height:24px;text-align:center;"><span style="color:#52505f;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:center;">Tip your favorite Audius creators to show them some love.</span></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  <td class="stack-column-center" height="24" style="width:24px; min-width:24px; height:24px; min-height:24px;" width="24">&nbsp;</td>
  <td align="center" width="47.83%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="background-color:#f9f7fc; border-radius:32px; border:1px solid #ebe4f6; padding-left:16px; padding-right:16px;" bgcolor="#f9f7fc">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="24"><img src="https://download.audius.co/emails/reward-in-cooldown/xtAvsz4kPIlTRsuf3ooujdGQ7itdfU.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="100%">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td>
  <div style="line-height:24px;text-align:center;"><span style="color:#3a3843;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:16px;letter-spacing:-0.02em;line-height:24px;text-align:center;">VIP Badges</span></div>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td>
  <div style="line-height:24px;text-align:center;"><span style="color:#52505f;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:center;">Stand out with a VIP a badge next to your name throughout the app.</span></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="36" style="height:36px; min-height:36px; line-height:36px;"></td>
  </tr>
  <tr>
  <td width="552" align="center">
  <table class="table-w-full-mobile" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center" width="47.83%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="background-color:#f9f7fc; border-radius:32px; border:1px solid #ebe4f6; padding-left:16px; padding-right:16px;" bgcolor="#f9f7fc">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="24"><img src="https://download.audius.co/emails/reward-in-cooldown/YKrUBKvkgjguE1walsGI7woIPKp9gk.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="100%">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td>
  <div style="line-height:24px;text-align:center;"><span style="color:#3a3843;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:16px;letter-spacing:-0.02em;line-height:24px;text-align:center;">Discord Roles</span></div>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td>
  <div style="line-height:24px;text-align:center;"><span style="color:#52505f;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:center;">VIP Badge holders unlock custom roles in our Discord Community!</span></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  <td class="stack-column-center" height="24" style="width:24px; min-width:24px; height:24px; min-height:24px;" width="24">&nbsp;</td>
  <td align="center" width="47.83%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="background-color:#f9f7fc; border-radius:32px; border:1px solid #ebe4f6; padding-left:16px; padding-right:16px;" bgcolor="#f9f7fc">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="24"><img src="https://download.audius.co/emails/reward-in-cooldown/g3byDkrkP9kHERR1lEqTJZfFpsaHB0.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="100%">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td>
  <div style="line-height:24px;text-align:center;"><span style="color:#3a3843;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:16px;letter-spacing:-0.02em;line-height:24px;text-align:center;">Exclusive Features</span></div>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td>
  <div style="line-height:24px;text-align:center;"><span style="color:#52505f;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:center;">Access to exclusive features reserved for VIP Badge holders.</span></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552" style="vertical-align: middle; height:36px; background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="12" style="height:12px; min-height:12px; line-height:12px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="552">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552">
  <table cellpadding="0" cellspacing="0" height="1" width="100%" style="line-height:1px;height:1px!important; border:1px solid #e9e9eb; border-collapse:separate !important;margin:0 auto;text-align:center;">
  <tbody><tr>
  <td> </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="12" style="height:12px; min-height:12px; line-height:12px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552" align="center" style="background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td align="center">
  <div style="line-height:24px;text-align:center;"><span style="color:#52505f;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:16px;letter-spacing:-0.02em;line-height:24px;text-align:center;">Looking for ways to earn? <br>Check out your rewards page for more info.</span></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552" align="center" style="vertical-align: middle; background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;" width="420">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="420" align="center">
  <table class="table-w-full-mobile" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td class="stack-column-center" align="center">
  <div>
  <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://audius.co/audio" style="height:48px;v-text-anchor:middle;width:420px;" fillcolor="#ffffff" strokecolor="#b5b4bb" strokeweight="1pt" arcsize="17%">
                          <w:anchorlock/>
                          <center style="white-space:nowrap;display:inline-block;text-align:center;color:#3a3843;font-weight:600;font-family:Inter,Arial,sans-serif;font-size:18px;">More Ways to Earn</center>
                          </v:roundrect>
                      <![endif]-->
  <a target="_blank" href="https://audius.co/audio" style="white-space:nowrap;background-color:#ffffff;border-radius:8px; border:1px solid #b5b4bb;display:inline-block;text-align:center;color:#3a3843;font-weight:600;font-family:Inter,Arial,sans-serif;font-size:18px;line-height:48px;width:100%; -webkit-text-size-adjust:none;mso-hide:all;">More Ways to Earn</a>
  </div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="48" style="height:48px; min-height:48px; line-height:48px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="100%" align="center" style="background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td width="100%" align="center" class="QTz2bR6R8NezOfP6k0grnIDfVele7g invert-bg" style="vertical-align: middle; background-repeat:no-repeat !important; background-position: center center !important; background-size: cover !important;border-radius:12px; border-collapse:separate !important; padding-left:24px; padding-right:24px;" background="https://download.audius.co/emails/reward-in-cooldown/QTz2bR6R8NezOfP6k0grnIDfVele7g.png">
  <!--[if gte mso 9]>
                  <v:image xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style=" border: 0;display: inline-block; width: 552px; height:182px;"
                  src="https://download.audius.co/emails/reward-in-cooldown/QTz2bR6R8NezOfP6k0grnIDfVele7g.png"
                  />
                  <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style=" border: 0;display: inline-block;position: absolute; width: 552px; height:182px;">
                  <v:fill opacity="0%" color="#000" />
                  <v:textbox inset="0,0,0,0">
                  <![endif]-->
  <div>
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="36" style="height:36px; min-height:36px; line-height:36px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="100%" align="center" style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:36px;text-align:center;"><span style="color:#3a3843;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:27px;letter-spacing:-0.02em;line-height:36px;text-align:center;">Download The App!</span></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="100%" align="center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td width="504" align="center" style="vertical-align: middle;  ">
  <table class="table-w-full-mobile" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td style="vertical-align: middle;" class="stack-column-center" align="center"><a target="_blank" href="https://apps.apple.com/us/app/audius-music/id1491270519"><img src="https://download.audius.co/emails/reward-in-cooldown/ETvbWek1R5LtoPkpa9jyqluDlUJ68K.png" width="142" border="0" style="min-width:142px; width:142px;
           height: auto; display: block;"></a></td>
  <td class="stack-column-center" height="12" style="width:12px; min-width:12px; height:12px; min-height:12px;" width="12">&nbsp;</td>
  <td style="vertical-align: middle;" class="stack-column-center" align="center"><a target="_blank" href="https://play.google.com/store/apps/details?id=co.audius.app&amp;hl=en_US&amp;gl=US"><img src="https://download.audius.co/emails/reward-in-cooldown/I0jhzVTlYEh6zPVjYhWOdLP8WQOriv.png" width="166" border="0" style="min-width:166px; width:166px;
           height: auto; display: block;"></a></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="36" style="height:36px; min-height:36px; line-height:36px;"></td>
  </tr>
  </tbody></table>
  </div>
  <!--[if gte mso 9]>
                  </v:textbox>
                  </v:fill>
                  </v:rect>
                  </v:image>
                  <![endif]-->
  </td>
  </tr>
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="552" align="center" style="vertical-align: middle; background-color:#f9f9f9;  border-width: 1px 0px 0px 0px; border-color:#e9e9eb; border-style:solid; padding-left:24px; padding-right:24px;" bgcolor="#f9f9f9">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="48" style="height:48px; min-height:48px; line-height:48px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="100%" align="center" style="vertical-align: middle; border-radius:8px; ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="100%" style="  padding-left:12px; padding-right:12px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="12" style="height:12px; min-height:12px; line-height:12px;"></td>
  </tr>
  <tr>
  <td width="528" align="center" style="vertical-align: middle;  ">
  <table class="table-w-full-mobile" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td style="vertical-align: middle;" class="stack-column-center" align="center"><a target="_blank" href="https://www.audius.co/"><img src="https://download.audius.co/emails/reward-in-cooldown/T7wyNCOkTAKSCsXI0teWRVPL9ohvew.png" width="168" border="0" style="min-width:168px; width:168px;
          border-radius:2px; height: auto; display: block;"></a></td>
  <td class="stack-column-center" height="12" style="width:12px; min-width:12px; height:12px; min-height:12px;" width="12">&nbsp;</td>
  <td class="stack-column-center" style="width:168px;">&nbsp;</td>
  <td class="stack-column-center" height="12" style="width:12px; min-width:12px; height:12px; min-height:12px;" width="12">&nbsp;</td>
  <td style="vertical-align: middle;" align="center" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="center" style="vertical-align: middle; border-radius:2px;  padding-left:4px; padding-right:4px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="right" style="vertical-align: middle; height:32px; border-radius:2px;  padding-left:4px; padding-right:4px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="144">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="144" style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td style="vertical-align: middle;"><a target="_blank" href="https://twitter.com/audius"><img src="https://download.audius.co/emails/reward-in-cooldown/DmrnxdHiR36f3jwmrTB3j20i5VTVeY.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a target="_blank" href="https://www.instagram.com/audius/"><img src="https://download.audius.co/emails/reward-in-cooldown/XeiGn0Dq0YLZM2O5kdfTimZsbAuAyc.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a target="_blank" href="https://tiktok.com/@audius"><img src="https://download.audius.co/emails/reward-in-cooldown/XncIM9pRTX9uGCfbhHQbiDihzZRI0c.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a target="_blank" href="https://www.youtube.com/@AudiusMusic"><img src="https://download.audius.co/emails/reward-in-cooldown/vpROD76ueF3gh3NH474jQecMgPBZgW.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="12" style="height:12px; min-height:12px; line-height:12px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;" width="528">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="528" align="center" style="vertical-align: middle;  ">
  <table class="table-w-full-mobile" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" align="center" width="32.32%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="center" style="vertical-align: middle; border-radius:2px;  padding-left:16px; padding-right:16px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://www.audius.co/"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Audius Music</span></a></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://help.audius.co/"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Help &amp; Support</span></a></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  <td class="stack-column-center" height="8" style="width:8px; min-width:8px; height:8px; min-height:8px;" width="8">&nbsp;</td>
  <td style="vertical-align: middle;" align="center" width="32.32%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="center" style="vertical-align: middle; border-radius:2px;  padding-left:16px; padding-right:16px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://blog.audius.co/"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">The Blog</span></a></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://www.audius.events/"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Events</span></a></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  <td class="stack-column-center" height="8" style="width:8px; min-width:8px; height:8px; min-height:8px;" width="8">&nbsp;</td>
  <td style="vertical-align: middle;" align="center" width="32.32%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td align="center" style="vertical-align: middle; border-radius:2px;  padding-left:16px; padding-right:16px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://brand.audius.co/"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Brand / Press</span></a></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://merch.audius.co/"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Merch Store</span></a></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td width="100%" align="center" style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tbody><tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tbody><tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><span style="color:#6a677a;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:14px;text-align:center;">© ${copyrightYear} Audius, Inc. All Rights Reserved.</span></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><span
    style="color:#6a677a;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:14px;text-align:center;">No
    longer want to receive these emails? </span><a href="<%asm_group_unsubscribe_raw_url%>"><span
    style="color:#7e1bcc;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:14px;text-align:center;">Unsubscribe
  </span></a><span
    style="color:#6a677a;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:14px;text-align:center;">or</span><a href="<%asm_preferences_raw_url%>"><span
    style="color:#7e1bcc;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:14px;text-align:center;"> Manage
    Email Preferences</span></a></div>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  <tr>
  <td height="48" style="height:48px; min-height:48px; line-height:48px;"></td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  </div>
  
  
  </body></html>
  `
}
