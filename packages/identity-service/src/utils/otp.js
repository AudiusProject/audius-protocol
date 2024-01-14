const { getOtpEmail } = require('../notifications/emails/otp')

const OTP_CHARS = '0123456789'
const OTP_REDIS_PREFIX = 'otp'
const OTP_EXPIRATION_SECONDS = 600

const generateOtp = () => {
  let OTP = ''
  for (let i = 0; i < 6; i++) {
    OTP += OTP_CHARS[Math.floor(Math.random() * OTP_CHARS.length)]
  }
  return OTP
}

const getEmail = ({ otp }) => {
  const title = 'Your Audius Verification Code is:'
  const expire = 'This code will expire in 10 minutes.'
  const copyrightYear = new Date().getFullYear().toString()
  const formattedOtp = `${otp.substring(0, 3)} ${otp.substring(3, 6)}`
  return getOtpEmail({ title, otp: formattedOtp, expire, copyrightYear })
}

export const validateOtp = async ({ email, otp, redis }) => {
  const storedOtp = await redis.get(`${OTP_REDIS_PREFIX}:${email}`)
  return otp === storedOtp
}

export const sendOtp = async ({ email, redis, sendgrid }) => {
  const otp = generateOtp()
  const html = getEmail({
    otp
  })

  const emailParams = {
    from: 'The Audius Team <team@audius.co>',
    to: email,
    subject: 'Your Audius Verification Code',
    html,
    asm: {
      groupId: 26666 // id of unsubscribe group at https://mc.sendgrid.com/unsubscribe-groups
    }
  }
  await redis.set(
    `${OTP_REDIS_PREFIX}:${email}`,
    otp,
    'EX',
    OTP_EXPIRATION_SECONDS
  )
  if (sendgrid) {
    await sendgrid.send(emailParams)
  }
}
