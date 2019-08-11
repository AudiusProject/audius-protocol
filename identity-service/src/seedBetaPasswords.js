const models = require('./models')

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const BETAPASSWORDCOUNT = 1000
const MAXLOGINSPERPASSWORD = 1

/**
 * will create [count] random passwords and populate db, giving each [maxLogins]
 * a password consists of 4 randomly generated uppercase letters
 */
async function seedBetaPasswords (count = BETAPASSWORDCOUNT, maxLogins = MAXLOGINSPERPASSWORD) {
  for (let i = 0; i < count; i++) {
    let randomPassword = ''
    for (let j = 0; j < 4; j++) {
      randomPassword += CHARACTERS.charAt(Math.floor(Math.random() * 36))
    }
    await models.BetaPassword.findCreateFind({
      where: {
        password: randomPassword
      },
      defaults: {
        password: randomPassword,
        remainingLogins: maxLogins
      }
    })
  }
}

seedBetaPasswords()
