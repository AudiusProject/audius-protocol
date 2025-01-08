export const email = ({
  managerName,
  managerHandle,
  managerProfilePicture,
  managedAccountName,
  managedAccountHandle,
  managedAccountProfilePicture,
  link
}: {
  managerName: string
  managerHandle: string
  managerProfilePicture: string
  managedAccountName: string
  managedAccountHandle: string
  managedAccountProfilePicture: string
  link: string
}) => {
  return `
  <!doctype html>
  <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  
  <head>
  <meta charset="utf-8" />
  <meta content="width=device-width" name="viewport" />
  <meta content="IE=edge" http-equiv="X-UA-Compatible" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta content="telephone=no,address=no,email=no,date=no,url=no" name="for mat-detection" />
  <title>Account Management Request</title>
  <!--[if mso]>
              <style>
                  * {
                      font-family: sans-serif !important;
                  }
              </style>
          <![endif]-->
  <!--[if !mso]><!-->
  <!-- <![endif]-->
  <link href="https://fonts.googleapis.com/css?family=Inter:700" rel="stylesheet" type="text/css">
  <link href="https://fonts.googleapis.com/css?family=Inter:400" rel="stylesheet" type="text/css">
  <link href="https://fonts.googleapis.com/css?family=Inter:600" rel="stylesheet" type="text/css">
  <link href="https://fonts.googleapis.com/css?family=Inter:500" rel="stylesheet" type="text/css">
  <style>
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
  
  <body width="100%" style="background-color:#eeedef;margin:0;padding:0!important;mso-line-height-rule:exactly;">
  <div style="background-color:#eeedef">
  <!--[if gte mso 9]>
                                              <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                              <v:fill type="tile" color="#eeedef"/>
                                              </v:background>
                                              <![endif]-->
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
  <td valign="top" align="center">
  <table bgcolor="#ffffff" style="margin:0 auto;" align="center" id="brick_container" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container">
  <tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="600" style="background-color:#ffffff;  " bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="100%" align="center" style="vertical-align: middle; background-color:#ffffff;   padding-left:8px; padding-right:8px;" bgcolor="#ffffff">
  <table border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="492">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="492" style="vertical-align: middle;  ">
  <table border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;" width="60"><img src="${managerProfilePicture}" width="60" border="0" style="min-width:60px; width:60px;
          border-radius:64px; height: auto; display: block;"></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;">
  <div style="line-height:24px;text-align:left;"><a href="#"><span style="color:#6a677a;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:16px;letter-spacing:-0.02em;line-height:24px;text-align:left;">${managerName}</span></a></div>
  </td>
  </tr>
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  <tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;">
  <div style="line-height:24px;text-align:left;"><a href="#"><span style="color:#6a677a;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:left;">@${managerHandle}</span></a></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  <td style="width:8px; min-width:8px;" width="8"></td>
  <td style="vertical-align: middle;" width="72" align="center"><img src="https://download.audius.co/static-resources/email/logoVertical.jpeg" width="72" border="0" style="min-width:72px; width:72px;
           height: auto; display: block;"></td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="100%" style="vertical-align: middle; background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="100%" style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;">
  <div style="line-height:36px;text-align:left;"><span style="color:#2f2e37;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:27px;letter-spacing:-0.02em;line-height:36px;text-align:left;">Account Management Request</span></div>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;">
  <div style="line-height:24px;text-align:left;"><span style="color:#6a677a;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:left;">${managedAccountName} has invited you to manage their account. If you accept, you will be able to act on their behalf. This includes permission to make changes to their profile, account preferences, and uploaded content.</span></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="100%" style="vertical-align: middle; background-color:#fbfbfb; border-radius:8px; border:1px solid #eeedef; padding-left:8px; padding-right:8px;" bgcolor="#fbfbfb">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" width="528">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="528" align="center" style="vertical-align: middle;  ">
  <table class="table-w-full-mobile" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;" align="center" width="48.86%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="border-radius:2px;  padding-left:4px; padding-right:4px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  <tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;" width="60"><img src="${managedAccountProfilePicture}" width="60" border="0" style="min-width:60px; width:60px;
          border-radius:64px; height: auto; display: block;"></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;">
  <div style="line-height:24px;text-align:left;"><span style="color:#6a677a;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:16px;letter-spacing:-0.02em;line-height:24px;text-align:left;">${managedAccountName}</span></div>
  </td>
  </tr>
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  <tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;">
  <div style="line-height:24px;text-align:left;"><span style="color:#6a677a;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:left;">@${managedAccountHandle}</span></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  <td class="stack-column-center" height="12" style="width:12px; min-width:12px; height:12px; min-height:12px;" width="12"></td>
  <td style="vertical-align: middle;" align="center" width="48.86%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="border-radius:2px;  padding-left:4px; padding-right:4px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  <tr>
  <td>
  <div>
  <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="#" style="height:48px;v-text-anchor:middle;width:250px;" fillcolor="#7e1bcc"  stroke="f" arcsize="17%">
                          <w:anchorlock/>
                          <center style="white-space:nowrap;display:inline-block;text-align:center;color:#ffffff;font-weight:600;font-family:Inter,Arial,sans-serif;font-size:18px;">Review Request</center>
                          </v:roundrect>
                      <![endif]-->
  <a href="${link}" target="_blank" rel="noreferrer" style="white-space:nowrap;background-color:#7e1bcc;border-radius:8px; display:inline-block;text-align:center;color:#ffffff;font-weight:600;font-family:Inter,Arial,sans-serif;font-size:18px;line-height:48px;width:100%; -webkit-text-size-adjust:none;mso-hide:all;box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.0430000014603138);">Review Request</a>
  </div>
  </td>
  </tr>
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;">
  <div style="line-height:24px;text-align:left;"><span style="color:#6a677a;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:left;">Questions about account management on Audius? </span><span style="color:#cc0fe0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:left;">Learn More.</span></div>
  </td>
  </tr>
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="552" align="center" style="vertical-align: middle; background-color:#fbfbfb;  border-width: 1px 0px 0px 0px; border-color:#eeedef; border-style:solid; padding-left:24px; padding-right:24px;" bgcolor="#fbfbfb">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="48" style="height:48px; min-height:48px; line-height:48px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="100%" align="center" style="vertical-align: middle; border-radius:8px; ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="100%" style="  padding-left:12px; padding-right:12px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="12" style="height:12px; min-height:12px; line-height:12px;"></td>
  </tr>
  <tr>
  <td width="528" align="center" style="vertical-align: middle;  ">
  <table class="table-w-full-mobile" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;" class="stack-column-center" align="center"><a href="https://www.audius.co"><img src="https://download.audius.co/static-resources/email/grayLogoHorizontal.png" width="168" border="0" style="width: 100%;
          border-radius:2px; height: auto; display: block;"></a></td>
  <td class="stack-column-center" height="12" style="width:12px; min-width:12px; height:12px; min-height:12px;" width="12"></td>
  <td class="stack-column-center" style="width:168px;"></td>
  <td class="stack-column-center" height="12" style="width:12px; min-width:12px; height:12px; min-height:12px;" width="12"></td>
  <td style="vertical-align: middle;" align="center" width="31.82%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td align="center" style="vertical-align: middle; border-radius:2px;  padding-left:4px; padding-right:4px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td align="right" style="vertical-align: middle; height:32px; border-radius:2px;  padding-left:4px; padding-right:4px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="144">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="144" style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;"><a href="https://twitter.com/audius"><img src="https://download.audius.co/static-resources/email/grayTwitter.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a href="https://www.instagram.com/audius/"><img src="https://download.audius.co/static-resources/email/grayInstagram.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a href="https://tiktok.com/@audius"><img src="https://download.audius.co/static-resources/email/grayTikTok.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a href="https://www.youtube.com/@AudiusMusic"><img src="https://download.audius.co/static-resources/email/grayYoutube.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="12" style="height:12px; min-height:12px; line-height:12px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" width="528">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="528" align="center" style="vertical-align: middle;  ">
  <table class="table-w-full-mobile" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" align="center" width="32.32%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td align="center" style="vertical-align: middle; border-radius:2px;  padding-left:16px; padding-right:16px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a href="https://www.audius.co"><span style="color:#a5a4ad;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Audius Music</span></a></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a href="https://help.audius.co"><span style="color:#a5a4ad;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Help & Support</span></a></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  <td class="stack-column-center" height="8" style="width:8px; min-width:8px; height:8px; min-height:8px;" width="8"></td>
  <td style="vertical-align: middle;" align="center" width="32.32%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td align="center" style="vertical-align: middle; border-radius:2px;  padding-left:16px; padding-right:16px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a href="https://blog.audius.co"><span style="color:#a5a4ad;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">The Blog</span></a></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a href="https://www.audius.events"><span style="color:#a5a4ad;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Events</span></a></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  <td class="stack-column-center" height="8" style="width:8px; min-width:8px; height:8px; min-height:8px;" width="8"></td>
  <td style="vertical-align: middle;" align="center" width="32.32%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td align="center" style="vertical-align: middle; border-radius:2px;  padding-left:16px; padding-right:16px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a href="https://brand.audius.co"><span style="color:#a5a4ad;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Brand / Press</span></a></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><a href="https://merch.audius.co"><span style="color:#a5a4ad;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Merch Store</span></a></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="100%" align="center" style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:14px;text-align:center;"><span style="color:#a5a4ad;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:14px;text-align:center;">© 2025 Audius, Inc. All Rights Reserved.</span></div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="48" style="height:48px; min-height:48px; line-height:48px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </div>
  </body>
  
  </html>
`
}
