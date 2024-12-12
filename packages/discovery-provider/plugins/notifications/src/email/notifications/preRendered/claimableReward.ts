import { getHostname } from '../../../utils/env'

export const email = ({
  name,
  handle,
  profilePicture,
  profileLink,
  email
}: {
  name: string
  handle: string
  profilePicture: string
  profileLink: string
  email: string
}) => {
  const copyrightYear = new Date().getFullYear().toString()
  const isGuestCheckout = !name && !handle

  const signUpLink = `${getHostname()}/signup?guestEmail=${encodeURIComponent(
    email
  )}`

  return `
  <!doctype html>
  <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  
  <head>
  <meta charset="utf-8" />
  <meta content="width=device-width" name="viewport" />
  <meta content="IE=edge" http-equiv="X-UA-Compatible" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
  <title>Your Reward is Ready to Claim! 🎉 </title>
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
  <link href="https://fonts.googleapis.com/css?family=Inter:900" rel="stylesheet" type="text/css">
  <link href="https://fonts.googleapis.com/css?family=Inter:500" rel="stylesheet" type="text/css">
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
  <tr>
  <td valign="top" align="center">
  <div id="preview_text" style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;"> Good things come to those who wait! </div>
  <!-- Visually Hidden Preheader Text : END -->
  <!-- Preview Text Spacing Hack : BEGIN -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;"> &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp; </div>
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
  ${
    isGuestCheckout
      ? `
  <td width="584" style="vertical-align: middle; background-color:#ffffff;  border-width: 0px 0px 1px 0px; border-color:#eeedef; border-style:solid; padding-left:8px; padding-right:8px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="224"><img src="https://download.audius.co/welcome-email/Uz1cn9ptGz0zHqqougR9jczjWIzEi2.jpeg" width="224" border="0" style="max-width:224px; width: 100%;
           height: auto; display: block;"></td>
  <td></td>
  <td style="vertical-align: middle;" width="120">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="112" align="center" style="vertical-align: middle; border-radius:2px;  padding-left:4px; padding-right:4px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="4" style="height:4px; min-height:4px; line-height:4px;"></td>
  </tr>
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
  <td style="vertical-align: middle;">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;"><a target="_blank" href="https://twitter.com/audius"><img src="https://download.audius.co/welcome-email/wD4gGCdHNNWPmqcVaVODlWgVaMF632.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a target="_blank" href="https://www.instagram.com/audius/"><img src="https://download.audius.co/welcome-email/34rb0mOMe83vV5t7IykMNFM0HPwsSP.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a target="_blank" href="https://tiktok.com/@audius"><img src="https://download.audius.co/welcome-email/11MnDiUVzMuQyikvAHjRMkEOd2Dt7c.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a target="_blank" href="https://www.youtube.com/@AudiusMusic"><img src="https://download.audius.co/welcome-email/zTUTTlgXyRIkRgqgJ59JSs6QGkV2K2.png" width="24" border="0" style="min-width:24px; width:24px;
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
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  </table>
  </td>
  `
      : `
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
  <td style="vertical-align: middle;" width="60"><img src="${profilePicture}" width="60" border="0" style="min-width:60px; width:60px;
          border-radius:64px; height: auto; display: block;"></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;">
  <div style="line-height:24px;text-align:left;"><a target="_blank" href=${profileLink}><span style="color:#52505f;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:16px;letter-spacing:-0.02em;line-height:24px;text-align:left;">${name}</span></a></div>
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
  <div style="line-height:24px;text-align:left;"><a target="_blank" href="${profileLink}"><span style="color:#52505f;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:left;">@${handle}</span></a></div>
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
  <td style="vertical-align: middle;" width="72" align="center"><img src="https://download.audius.co/emails/claimable-reward/dDucJSVHqxvOOTs4YS1y9FhKRKWEGv.jpeg" width="72" border="0" style="min-width:72px; width:72px;
           height: auto; display: block;"></td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  </table>
  </td>
  `
  }
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="100%" align="center" style="background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td width="100%" align="center" class="sgdUNhCUQjxg3NnTHAEOc5zT1gYuis invert-bg" style="vertical-align: middle; background-repeat:no-repeat !important; background-position: center center !important; background-size: cover !important;border-radius:16px; border-collapse:separate !important; padding-left:24px; padding-right:24px;" background="https://download.audius.co/emails/claimable-reward/sgdUNhCUQjxg3NnTHAEOc5zT1gYuis.png">
  <!--[if gte mso 9]>
                  <v:image xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style=" border: 0;display: inline-block; width: 552px; height:528px;"
                  src="https://download.audius.co/emails/claimable-reward/sgdUNhCUQjxg3NnTHAEOc5zT1gYuis.png"
                  />
                  <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style=" border: 0;display: inline-block;position: absolute; width: 552px; height:528px;">
                  <v:fill opacity="0%" color="#000" />
                  <v:textbox inset="0,0,0,0">
                  <![endif]-->
  <div>
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="48" style="height:48px; min-height:48px; line-height:48px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" width="200" align="center"><a href="https://audius.co/audio"><img src="https://download.audius.co/emails/claimable-reward/H6iLdtDPafmBTBzLVTEm2ybTV6lF0F.gif" width="200" border="0" style="min-width:200px; width:200px;
          border-radius:8px; height: auto; display: block;"></a></td>
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
  <td width="100%" align="center" style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:24px;text-align:center;"><span style="color:#ffffff;font-weight:600;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:center;">Ready to Claim!</span></div>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:48px;text-align:center;"><span style="color:#ffffff;font-weight:900;font-family:Inter,Arial,sans-serif;font-size:43px;letter-spacing:-0.02em;line-height:48px;text-align:center;">Claim Your Rewards!</span></div>
  </td>
  </tr>
  <tr>
  <td height="8" style="height:8px; min-height:8px; line-height:8px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:24px;text-align:center;"><span style="color:#ffffff;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;text-align:center;">Good things come to those who wait! Your $AUDIO Rewards tokens are now ready to be claimed.</span></div>
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
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" align="center"><a target="_blank" href="https://audius.co/audio"><img src="https://download.audius.co/emails/claimable-reward/RrMqU93En8IyGqsECLV5E8PBq5rh12.png" width="160" border="0" style="min-width:160px; width:160px;
          border-radius:8px; height: auto; display: block;"></a></td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td height="48" style="height:48px; min-height:48px; line-height:48px;"></td>
  </tr>
  </table>
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
  <td width="552" style="vertical-align: middle; height:48px; background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="12" style="height:12px; min-height:12px; line-height:12px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="552">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="552">
  <table cellpadding="0" cellspacing="0" height="1" width="100%" style="line-height:1px;height:1px!important; border:1px solid #e9e9eb; border-collapse:separate !important;margin:0 auto;text-align:center;">
  <tr>
  <td> </td>
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
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="552" align="center" style="vertical-align: middle; background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
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
  <td width="552" style="background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td width="552" align="center">
  <table class="table-w-full-mobile" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td align="center" width="47.83%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td align="center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="background-color:#f9f7fc; border-radius:32px; border:1px solid #ebe4f6; padding-left:16px; padding-right:16px;" bgcolor="#f9f7fc">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="24"><img src="https://download.audius.co/emails/claimable-reward/1OPIazKiBiQS5dYCHLtN1li9Pk5MwD.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></td>
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
  <td width="100%">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
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
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  <td class="stack-column-center" height="24" style="width:24px; min-width:24px; height:24px; min-height:24px;" width="24"></td>
  <td align="center" width="47.83%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td align="center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="background-color:#f9f7fc; border-radius:32px; border:1px solid #ebe4f6; padding-left:16px; padding-right:16px;" bgcolor="#f9f7fc">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="24"><img src="https://download.audius.co/emails/claimable-reward/MN03WS3T0h4pg05GAUxAu1Mzz5IFYN.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></td>
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
  <td width="100%">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
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
  <td height="36" style="height:36px; min-height:36px; line-height:36px;"></td>
  </tr>
  <tr>
  <td width="552" align="center">
  <table class="table-w-full-mobile" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td align="center" width="47.83%" class="stack-column-center">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td align="center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="background-color:#f9f7fc; border-radius:32px; border:1px solid #ebe4f6; padding-left:16px; padding-right:16px;" bgcolor="#f9f7fc">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="24"><img src="https://download.audius.co/emails/claimable-reward/FoQKRTVNcCAuauhjnpRHeBFOAoVlYW.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></td>
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
  <td width="100%">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
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
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  <td class="stack-column-center" height="24" style="width:24px; min-width:24px; height:24px; min-height:24px;" width="24"></td>
  <td align="center" width="47.83%" class="stack-column-center">
<table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td align="center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td>
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="background-color:#f9f7fc; border-radius:32px; border:1px solid #ebe4f6; padding-left:16px; padding-right:16px;" bgcolor="#f9f7fc">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="16" style="height:16px; min-height:16px; line-height:16px;"></td>
  </tr>
  <tr>
  <td width="24"><img src="https://download.audius.co/emails/claimable-reward/o2KbF6XYR6KOS0rcOeaUe59q4DQLe1.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></td>
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
  <td width="100%">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
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
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  ${
    isGuestCheckout
      ? `
  <tr>
  <td width="600">
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td align="center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td style="vertical-align: middle;" align="center" width="420" class="stack-column-center">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="420" align="center" style="vertical-align: middle;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div>
  <a target="_blank" href="${signUpLink}" style="white-space:nowrap;background-color:#7e1bcc;border-radius:8px; display:inline-block;text-align:center;color:#ffffff;font-weight:600;font-family:Inter,Arial,sans-serif;font-size:18px;line-height:48px;width:100%; -webkit-text-size-adjust:none;mso-hide:all;box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.0430000014603138);">Complete Account to Claim Rewards</a>
  </div>
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
  </td>
  </tr>`
      : ''
  }
  <tr>
  <td width="600">
  <table cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="552" align="center" style="background-color:#ffffff;   padding-left:24px; padding-right:24px;" bgcolor="#ffffff">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="24" style="height:24px; min-height:24px; line-height:24px;"></td>
  </tr>
  <tr>
  <td width="100%" align="center" class="vkpvBFfzVrLbb4gtES9iH7Aeb3x1qO invert-bg" style="vertical-align: middle; background-repeat:no-repeat !important; background-position: center center !important; background-size: cover !important;border-radius:12px; border-collapse:separate !important; padding-left:24px; padding-right:24px;" background="https://download.audius.co/emails/claimable-reward/vkpvBFfzVrLbb4gtES9iH7Aeb3x1qO.png">
  <!--[if gte mso 9]>
                  <v:image xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style=" border: 0;display: inline-block; width: 552px; height:182px;"
                  src="https://download.audius.co/emails/claimable-reward/vkpvBFfzVrLbb4gtES9iH7Aeb3x1qO.png"
                  />
                  <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style=" border: 0;display: inline-block;position: absolute; width: 552px; height:182px;">
                  <v:fill opacity="0%" color="#000" />
                  <v:textbox inset="0,0,0,0">
                  <![endif]-->
  <div>
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td height="36" style="height:36px; min-height:36px; line-height:36px;"></td>
  </tr>
  <tr>
  <td style="vertical-align: middle;" width="100%">
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
  <td width="100%" align="center" style="vertical-align: middle;  ">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;" align="center">
  <div style="line-height:36px;text-align:center;"><span style="color:#3a3843;font-weight:700;font-family:Inter,Arial,sans-serif;font-size:27px;letter-spacing:-0.02em;line-height:36px;text-align:center;">Download The App!</span></div>
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
  <td width="100%" align="center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td width="504" align="center" style="vertical-align: middle;  ">
  <table class="table-w-full-mobile" border="0" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align: middle;" class="stack-column-center" align="center"><a target="_blank" href="https://apps.apple.com/us/app/audius-music/id1491270519"><img src="https://download.audius.co/emails/claimable-reward/Fpx8p4esnDqyStvVgHHOCaRBTS1V8M.png" width="142" border="0" style="min-width:142px; width:142px;
           height: auto; display: block;"></a></td>
  <td class="stack-column-center" height="12" style="width:12px; min-width:12px; height:12px; min-height:12px;" width="12"></td>
  <td style="vertical-align: middle;" class="stack-column-center" align="center"><a target="_blank" href="https://play.google.com/store/apps/details?id=co.audius.app&hl=en_US&gl=US"><img src="https://download.audius.co/emails/claimable-reward/TMRGFsZsPLVwhTNM8uUotGvlxhHCcv.png" width="166" border="0" style="min-width:166px; width:166px;
           height: auto; display: block;"></a></td>
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
  <td height="36" style="height:36px; min-height:36px; line-height:36px;"></td>
  </tr>
  </table>
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
  <td width="552" align="center" style="vertical-align: middle; background-color:#f9f9f9;  border-width: 1px 0px 0px 0px; border-color:#e9e9eb; border-style:solid; padding-left:24px; padding-right:24px;" bgcolor="#f9f9f9">
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
  <td style="vertical-align: middle;" class="stack-column-center" align="center"><a target="_blank" href="https://www.audius.co"><img src="https://download.audius.co/emails/claimable-reward/S0aJtkolLeL37THzn8DkLC9XcTJkB8.png" width="168" border="0" style="min-width:168px; width:168px;
          border-radius:2px; height: auto; display: block;"></a></td>
  <td class="stack-column-center" height="12" style="width:12px; min-width:12px; height:12px; min-height:12px;" width="12"></td>
  <td class="stack-column-center" style="width:168px;"></td>
  <td class="stack-column-center" height="12" style="width:12px; min-width:12px; height:12px; min-height:12px;" width="12"></td>
  <td style="vertical-align: middle;" align="center" class="stack-column-center">
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
  <td style="vertical-align: middle;"><a target="_blank" href="https://twitter.com/audius"><img src="https://download.audius.co/emails/claimable-reward/NQwEGYerZBTC2zDLFzS60mkhsdQ6Oh.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a target="_blank" href="https://www.instagram.com/audius/"><img src="https://download.audius.co/emails/claimable-reward/g2CYpcqnRPv13V7n0QnN3lG24Qw2gc.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a target="_blank" href="https://tiktok.com/@audius"><img src="https://download.audius.co/emails/claimable-reward/LHv6YemVt0m5QtBsJakLTRaXh5hAg9.png" width="24" border="0" style="min-width:24px; width:24px;
           height: auto; display: block;"></a></td>
  <td style="width:16px; min-width:16px;" width="16"></td>
  <td style="vertical-align: middle;"><a target="_blank" href="https://www.youtube.com/@AudiusMusic"><img src="https://download.audius.co/emails/claimable-reward/xJvSpDxCbifoIaJwk1fuFXr9tF4cMi.png" width="24" border="0" style="min-width:24px; width:24px;
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
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://www.audius.co"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Audius Music</span></a></div>
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
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://help.audius.co"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Help & Support</span></a></div>
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
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://blog.audius.co"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">The Blog</span></a></div>
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
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://www.audius.events"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Events</span></a></div>
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
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://brand.audius.co"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Brand / Press</span></a></div>
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
  <div style="line-height:14px;text-align:center;"><a target="_blank" href="https://merch.audius.co"><span style="color:#6a677a;font-weight:500;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:14px;text-align:center;">Merch Store</span></a></div>
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
  <div style="line-height:14px;text-align:center;"><span style="color:#6a677a;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:14px;text-align:center;">© ${copyrightYear} Audius, Inc. All Rights Reserved.</span></div>
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
  
  </html>`
}
