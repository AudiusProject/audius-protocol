export const email = ({
  name,
  amount,
  wallet,
  signature
}: {
  name: string
  amount: string
  wallet: string
  signature: string
}) => {
  return `
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"> 
<head> 
	<!--[if gte mso 9]>
	<xml>
	<o:OfficeDocumentSettings>
	<o:AllowPNG/>
	<o:PixelsPerInch>96</o:PixelsPerInch>
	</o:OfficeDocumentSettings>
	</xml>
	<![endif]--> 
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8"> 
	<meta name="viewport" content="width=device-width,initial-scale=1"> 
	<meta http-equiv="X-UA-Compatible" content="IE=Edge"/> 
	<meta name="x-apple-disable-message-reformatting"> 
	<title></title> 
	<style>html{-webkit-text-size-adjust:none;-ms-text-size-adjust:none}@media only screen and (max-device-width:600px),only screen and (max-width:600px){.mob_100{width:100%!important;max-width:100%!important}.mob_full{width:auto!important;display:block!important;padding:0 10px!important}.mob_center{text-align:center!important}.mob_center_bl{margin-left:auto;margin-right:auto}.mob_hidden{display:none!important}.only_mob{display:block!important}}@media only screen and (max-width:600px){.mob_100{width:100%!important;max-width:100%!important}.mob_100 img,.mob_100 table{max-width:100%!important}.mob_full{width:auto!important;display:block!important;padding:0 10px!important}.mob_center{text-align:center!important}.mob_center_bl{margin-left:auto;margin-right:auto}.mob_hidden{display:none!important}.only_mob{display:block!important}}.creative{width:100%!important;max-width:100%!important}.mail_preheader{display:none!important}form input, form textarea{font-family: Arial, sans-serif;width: 100%;box-sizing: border-box;font-size: 13px;color:#000000;outline:none;padding: 0px 15px;}form textarea{resize:vertical;line-height: normal;padding: 10px 15px;}form button{border: 0px none;cursor:pointer;}</style> 
	<!--[if (gte mso 9)|(IE)]>
	<style type="text/css">table {border-collapse: collapse !important;}.outf14{font-size:14px !important;}    .w520px{ width: 520px !important;} .w520px{ width: 520px !important;} .not_for_outlook{mso-hide: all !important;display: none !important;font-size:0;max-height:0;line-height: 0;mso-hide: all;}.outpadding{padding-left: 0 !important;padding-right: 0 !important;}</style>
	<![endif]--> 
	</head> 
	<body class="body" style="padding:0;margin:0"> 
	<div class="full-wrap"> 
	<table width="100%" border="0" cellspacing="0" cellpadding="0" class="full-wrap">
	<tr><td align="center" bgcolor="#f5f5f5" style="line-height: normal; hyphens: none;">
	<div>
	<!--[if !mso]>
	<!-->
	<div class="mail_preheader" style="font-size: 0px; color: transparent; opacity: 0;">
		<span style="font-family: Arial, Helvetica, sans-serif; font-size: 0px; color: transparent; line-height: 0px;"></span>
	</div>
	<!--
	<![endif]-->
</div>  
<div>
	<!--[if (gte mso 9)|(IE)]>
	<table width="700" border="0" cellspacing="0" cellpadding="0" style="width: 700px;">
	<tr><td>
	<![endif]-->
	<table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 700px;">
	<tr><td align="center" valign="top" bgcolor="#f3f0f7" style="padding: 40px 10px;">
		<div>
			<div>
				<!--[if (gte mso 9)|(IE)]>
				<table width="250" border="0" cellspacing="0" cellpadding="0" style="width: 250px;">
				<tr><td>
				<![endif]-->
				<table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 250px;">
				<tr><td align="left" valign="top" height="52" style="padding: 4px; height: 52px;">
					<div>
						<img src="https://download.audius.co/support/i1349062845.png" width="240" height="63" alt="" border="0" style="display: block;">
					</div>
				</td></tr>
				</table>
				<!--[if (gte mso 9)|(IE)]>
				</td></tr>
				</table>
				<![endif]-->
			</div> 
			<div style="height: 40px; line-height: 40px; font-size: 38px;">&nbsp;</div>
			<div>
				<!--[if (gte mso 9)|(IE)]>
				<table width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px;">
				<tr><td>
				<![endif]-->
				<table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px;">
				<tr><td align="left" valign="top" bgcolor="#ffffff" style="border-radius: 12px; box-shadow: rgba(0, 0, 0, 0.07) 0px 8px 16px;">
					<div style="overflow: hidden; border-radius: 12px;">
						<div>
							<table border="0" cellspacing="0" cellpadding="0" width="100%">
							<tr><td align="center" background="https://download.audius.co/support/i-464919331.png" style="background-image: url(https://download.audius.co/support/i-464919331.png); border-radius: 12px 12px 0px 0px;">
								<!--[if (gte mso 9)|(IE)]>
								<table width="100%" border="0" cellspacing="0" cellpadding="0">
								<tr><td background="https://download.audius.co/support/i-464919331.png">
								<![endif]-->
								<!--[if gte mso 9]>
								<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="height:129px;width:600px">
								<v:fill type="tile" src="https://download.audius.co/support/i-464919331.png">
								</v:fill>
								<v:textbox inset="0,0,0,0">
								<![endif]-->
								<div>
									<table width="100%" cellpadding="0" cellspacing="0" border="0">
									<tr><td align="center" valign="middle" class="outpadding" style="padding: 32px;">
										<!--[if (gte mso 9)|(IE)]>
										<table width="100%" cellspacing="0" cellpadding="0" border="0">
										<tr><td width="32" class="forOutPad" style="width: 32px;">
										</td>
										<td align="center">
										<![endif]-->
										<div>
											<div style="line-height: 34px;">
												<span style="font-family: Inter, sans-serif; font-weight: bold; font-size: 28px; color: #ffffff;">Transfer Confirmation!</span>
											</div> 
											<div style="height: 8px; line-height: 8px; font-size: 6px;">&nbsp;</div>
											<div style="line-height: 24px;">
												<span style="font-family: Inter, sans-serif; font-weight: bold; font-size: 18px; color: #ffffff;">Your Transfer Has Been Started</span>
											</div>
										</div>
										<!--[if (gte mso 9)|(IE)]>
										</td>
										<td width="32" class="forOutPad" style="width: 32px;">
										</td></tr>
										</table>
										<![endif]-->
									</td></tr>
									</table>
								</div>
								<!--[if gte mso 9]>
								</v:textbox>
								</v:rect>
								<![endif]-->
								<!--[if (gte mso 9)|(IE)]>
								</td></tr>
								</table>
								<![endif]-->
							</td></tr>
							</table>
						</div> 
						<div>
							<table border="0" cellspacing="0" cellpadding="0" width="100%">
							<tr><td align="left" valign="top" style="padding: 40px;">
								<div>
									<div>
										<table border="0" cellspacing="0" cellpadding="0" width="100%">
										<tr><td align="left" valign="top">
											<div>
												<div style="line-height: 24px;">
													<span style="font-family: 'Avenir Next LT Pro', sans-serif; font-weight: bold; font-size: 20px; color: #858199;">Hello ${name},</span>
												</div> 
												<div style="height: 16px; line-height: 16px; font-size: 14px;">&nbsp;</div>
												<div style="line-height: 24px;">
													<span style="font-family: 'Avenir Next LT Pro', sans-serif; font-size: 18px; color: #858199;">We have successfully processed your Solana USD (USDC) transfer request.</span>
												</div>
											</div>
										</td></tr>
										</table>
									</div>
								</div>
							</td></tr>
							</table>
						</div> 
						<div>
							<table border="0" cellspacing="0" cellpadding="0" width="100%">
							<tr><td align="left" valign="middle" style="padding: 40px; border-top: 1px solid #f2f2f4;">
								<div>
									<div>
										<table border="0" cellspacing="0" cellpadding="0" width="100%">
										<tr><td align="left" valign="top">
											<div>
												<div style="line-height: 24px;">
													<span style="font-family: 'Avenir Next LT Pro', sans-serif; font-weight: bold; font-size: 20px; color: #858199;">Transfer Details</span>
												</div> 
												<div style="height: 16px; line-height: 16px; font-size: 14px;">&nbsp;</div>
												<div style="line-height: 24px;">
													<span style="font-family: 'Avenir Next LT Pro', sans-serif; font-size: 18px; color: #858199;"><span style="text-decoration: none;">Transfer Amount:</span><span style="font-weight: normal; text-decoration: none;"> ${amount} USDC<br></span><span style="text-decoration: none;">Transfer To: </span><span style="font-weight: normal; text-decoration: none;">${wallet}</span></span>
												</div> 
												<div style="height: 16px; line-height: 16px; font-size: 14px;">&nbsp;</div>
                        <a href="https://solscan.io/tx/${signature}" target="_blank">
												<table border="0" cellspacing="0" cellpadding="0" width="190" style="width: 190px;">
												<tr><td align="center" valign="middle" style="padding: 0px 4px 0px 0px;">
													<div style="line-height: 16px; text-transform: capitalize;">
														<span style="font-family: 'Avenir Next LT Pro', sans-serif; font-weight: bold; font-size: 14px; color: #858199;">View on Solana Explorer</span>
													</div>
												</td> 
												<td align="left" valign="top" width="16" style="width: 16px; line-height: 16px;">
													<img src="https://download.audius.co/support/i-1881077370.png" width="16" height="16" alt="" border="0" style="display: block;">
												</td></tr>
												</table>
                        </a>
											</div>
										</td></tr>
										</table>
									</div> 
									<div style="height: 24px; line-height: 24px; font-size: 22px;">&nbsp;</div>
									<div>
										<img src="https://download.audius.co/support/i-1756092256.png" width="520" alt="" border="0" style="display: block; max-width: 520px; width: 100%;" class="w520px">
									</div>
								</div>
							</td></tr>
							</table>
						</div>
					</div>
				</td></tr>
				</table>
				<!--[if (gte mso 9)|(IE)]>
				</td></tr>
				</table>
				<![endif]-->
			</div> 
			<div style="height: 40px; line-height: 40px; font-size: 38px;">&nbsp;</div>
			<div>
				<!--[if (gte mso 9)|(IE)]>
				<table width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px;">
				<tr><td>
				<![endif]-->
				<table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px;">
				<tr><td align="center" valign="top" style="padding: 40px;">
					<div>
						<div>
							<table border="0" cellspacing="0" cellpadding="0" width="100%">
							<tr><td align="center" valign="top" style="padding: 8px 0px;">
								<div>
									<table width="100%" border="0" cellspacing="0" cellpadding="0">
									<tr><td align="center" valign="top" style="font-size: 0px;">
										<div style="display: inline-block; vertical-align: top; width: 112px;">
											<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
											<tr><td align="left" valign="top" class="outf14" style="font-size: large;">
												<div>
													<table border="0" cellspacing="0" cellpadding="0" width="100%">
													<tr><td align="center" style="padding: 0px 4px;">
														<div>
															<div>
                                <a href="https://apps.apple.com/us/app/audius-music/id1491270519" target="_blank">
																<!--[if (gte mso 9)|(IE)]>
																<table width="112" border="0" cellspacing="0" cellpadding="0" style="width: 112px;">
																<tr><td>
																<![endif]-->
																<table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 112px;">
																<tr><td align="left" valign="top" style="padding: 4px;">
																	<div>
																		<img src="https://download.audius.co/support/i2011111235.png" width="96" height="32" alt="" border="0" style="display: block;">
																	</div>
																</td></tr>
																</table>
																<!--[if (gte mso 9)|(IE)]>
																</td></tr>
																</table>
																<![endif]-->
                              </a>
															</div>
														</div>
													</td></tr>
													</table>
												</div>
											</td></tr>
											</table>
										</div>
										<!--[if (gte mso 9)|(IE)]>
										</td>
										<td valign="top" width="122" style="width: 122px">
										<![endif]-->
										<div style="display: inline-block; vertical-align: top; width: 122px;">
											<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
											<tr><td align="left" valign="top" class="outf14" style="font-size: large;">
												<div>
													<table border="0" cellspacing="0" cellpadding="0" width="100%">
													<tr><td align="center" style="padding: 0px 4px;">
														<div>
															<div>
                                <a href="https://play.google.com/store/apps/details?id=co.audius.app" target="_blank">
																<!--[if (gte mso 9)|(IE)]>
																<table width="122" border="0" cellspacing="0" cellpadding="0" style="width: 122px;">
																<tr><td>
																<![endif]-->
																<table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 122px;">
																<tr><td align="left" valign="top" style="padding: 4px;">
																	<div>
																		<img src="https://download.audius.co/support/i-133142950.png" width="105" height="32" alt="" border="0" style="display: block;">
																	</div>
																</td></tr>
																</table>
																<!--[if (gte mso 9)|(IE)]>
																</td></tr>
																</table>
																<![endif]-->
                                </a>
															</div>
														</div>
													</td></tr>
													</table>
												</div>
											</td></tr>
											</table>
										</div>
									</td></tr>
									</table>
								</div>
							</td></tr>
							</table>
						</div> 
						<div>
							<table border="0" cellspacing="0" cellpadding="0" width="100%">
							<tr><td align="center" valign="middle" style="padding: 8px 0px;">
								<div>
									<table width="100%" border="0" cellspacing="0" cellpadding="0">
									<tr><td align="center" valign="middle" style="font-size: 0px;">
										<div style="display: inline-block; vertical-align: middle; width: 42px;">
											<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
											<tr><td align="left" valign="top" class="outf14" style="font-size: large;">
												<div>
													<table border="0" cellspacing="0" cellpadding="0" width="100%">
													<tr><td align="center" style="padding: 0px 9px;">
														<div>
															<div>
                                <a href="https://www.instagram.com/audiusmusic" target="_blank">
																<!--[if (gte mso 9)|(IE)]>
																<table width="42" border="0" cellspacing="0" cellpadding="0" style="width: 42px;">
																<tr><td>
																<![endif]-->
																<table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 42px;">
																<tr><td align="left" valign="top" style="padding: 2px;">
																	<div>
																		<img src="https://download.audius.co/support/i-1252176693.png" width="20" height="20" alt="" border="0" style="display: block;">
																	</div>
																</td></tr>
																</table>
																<!--[if (gte mso 9)|(IE)]>
																</td></tr>
																</table>
																<![endif]-->
                                </a>
															</div>
														</div>
													</td></tr>
													</table>
												</div>
											</td></tr>
											</table>
										</div>
										<!--[if (gte mso 9)|(IE)]>
										</td>
										<td valign="middle" width="41" style="width: 41px">
										<![endif]-->
										<div style="display: inline-block; vertical-align: middle; width: 41px;">
											<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
											<tr><td align="left" valign="top" class="outf14" style="font-size: large;">
												<div>
													<table border="0" cellspacing="0" cellpadding="0" width="100%">
													<tr><td align="center" style="padding: 0px 9px;">
														<div>
															<div>
                                <a href="https://twitter.com/audius" target="_blank">
																<!--[if (gte mso 9)|(IE)]>
																<table width="41" border="0" cellspacing="0" cellpadding="0" style="width: 41px;">
																<tr><td>
																<![endif]-->
																<table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 41px;">
																<tr><td align="left" valign="top" style="padding: 4px 1px;">
																	<div>
																		<img src="https://download.audius.co/support/i-787627398.png" width="21" height="16" alt="" border="0" style="display: block;">
																	</div>
																</td></tr>
																</table>
																<!--[if (gte mso 9)|(IE)]>
																</td></tr>
																</table>
																<![endif]-->
                                </a>
															</div>
														</div>
													</td></tr>
													</table>
												</div>
											</td></tr>
											</table>
										</div>
										<!--[if (gte mso 9)|(IE)]>
										</td>
										<td valign="middle" width="42" style="width: 42px">
										<![endif]-->
										<div style="display: inline-block; vertical-align: middle; width: 42px;">
											<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
											<tr><td align="left" valign="top" class="outf14" style="font-size: large;">
												<div>
													<table border="0" cellspacing="0" cellpadding="0" width="100%">
													<tr><td align="center" style="padding: 0px 9px;">
														<div>
															<div>
                                <a href="https://t.me/Audius" target="_blank">
																<!--[if (gte mso 9)|(IE)]>
																<table width="42" border="0" cellspacing="0" cellpadding="0" style="width: 42px;">
																<tr><td>
																<![endif]-->
																<table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 42px;">
																<tr><td align="left" valign="top" style="padding: 2px;">
																	<div>
																		<img src="https://download.audius.co/support/i-1232798338.png" width="20" height="20" alt="" border="0" style="display: block;">
																	</div>
																</td></tr>
																</table>
																<!--[if (gte mso 9)|(IE)]>
																</td></tr>
																</table>
																<![endif]-->
                                </a>
															</div>
														</div>
													</td></tr>
													</table>
												</div>
											</td></tr>
											</table>
										</div>
										<!--[if (gte mso 9)|(IE)]>
										</td>
										<td valign="middle" width="42" style="width: 42px">
										<![endif]-->
										<div style="display: inline-block; vertical-align: middle; width: 42px;">
											<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
											<tr><td align="left" valign="top" class="outf14" style="font-size: large;">
												<div>
													<table border="0" cellspacing="0" cellpadding="0" width="100%">
													<tr><td align="center" style="padding: 0px 9px;">
														<div>
															<div>
                                <a href="https://discord.com/invite/audius" target="_blank">
																<!--[if (gte mso 9)|(IE)]>
																<table width="42" border="0" cellspacing="0" cellpadding="0" style="width: 42px;">
																<tr><td>
																<![endif]-->
																<table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 42px;">
																<tr><td align="left" valign="top" style="padding: 5px 2px;">
																	<div>
																		<img src="https://download.audius.co/support/i426945899.png" width="20" height="14" alt="" border="0" style="display: block;">
																	</div>
																</td></tr>
																</table>
																<!--[if (gte mso 9)|(IE)]>
																</td></tr>
																</table>
																<![endif]-->
                                </a>
															</div>
														</div>
													</td></tr>
													</table>
												</div>
											</td></tr>
											</table>
										</div>
									</td></tr>
									</table>
								</div>
							</td></tr>
							</table>
						</div> 
						<div>
							<table border="0" cellspacing="0" cellpadding="0" width="100%">
							<tr><td align="center" valign="top" style="padding: 8px 0px;">
								<div>
									<div style="line-height: 20px;">
										<span style="font-family: 'Avenir Next LT Pro', sans-serif; font-size: 12px; color: #858199;">© ${new Date().getFullYear()} Audius, Inc. All Rights Reserved.</span>
									</div>
								</div>
							</td></tr>
							</table>
						</div>
					</div>
				</td></tr>
				</table>
				<!--[if (gte mso 9)|(IE)]>
				</td></tr>
				</table>
				<![endif]-->
			</div>
		</div>
	</td></tr>
	</table>
	<!--[if (gte mso 9)|(IE)]>
	</td></tr>
	</table>
	<![endif]-->
</div>
</td></tr>
</table> 
</div> 
</body> 
</html>
`
}
