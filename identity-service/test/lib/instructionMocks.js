const config = require('../../src/config')
const solanaClaimableTokenProgramAddress = config.get(
  'solanaClaimableTokenProgramAddress'
)
const solanaRewardsManagerProgramId = config.get(
  'solanaRewardsManagerProgramId'
)
const solanaRewardsManager = config.get('solanaRewardsManagerProgramPDA')
const usdcMintAddress = config.get('solanaUSDCMintAddress')

const usdcClaimableTokenAuthority =
  usdcMintAddress === '26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y'
    ? '7vKR1WSmyHvBmCvKPZBiN66PHZqYQbXw51SZdwtVd9Dt' // dev
    : '87KVRgUiA8cDLxaSBjWnpNxd9fwDDWuSZsF1UhH7fhJd' // prod

const sendInstruction = [
  {
    programId: 'KeccakSecp256k11111111111111111111111111111',
    data: {
      type: 'Buffer',
      data: [
        1, 32, 0, 0, 12, 0, 0, 97, 0, 48, 0, 0, 125, 39, 50, 113, 105, 5, 56,
        207, 133, 94, 91, 48, 2, 160, 221, 140, 21, 75, 176, 96, 214, 113, 33,
        53, 220, 198, 222, 221, 10, 47, 230, 220, 59, 252, 12, 8, 243, 105, 32,
        45, 203, 180, 242, 195, 22, 141, 83, 199, 98, 76, 156, 245, 56, 134, 87,
        146, 126, 65, 139, 250, 120, 100, 8, 86, 194, 83, 164, 196, 122, 150,
        130, 223, 79, 136, 144, 227, 115, 143, 64, 129, 25, 121, 75, 50, 1, 238,
        224, 31, 72, 178, 16, 121, 20, 241, 238, 240, 204, 125, 197, 137, 59,
        84, 27, 97, 7, 113, 242, 168, 160, 133, 230, 132, 243, 126, 66, 240,
        161, 0, 101, 205, 29, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0
      ]
    },
    keys: []
  },
  {
    programId: solanaClaimableTokenProgramAddress,
    data: {
      type: 'Buffer',
      data: [
        1, 125, 39, 50, 113, 105, 5, 56, 207, 133, 94, 91, 48, 2, 160, 221, 140,
        21, 75, 176, 96
      ]
    },
    keys: [
      {
        pubkey: 'CgJhbUdHQNN5HBeNEN7J69Z89emh6BtyYX1CPEGwaeqi',
        isSigner: true,
        isWritable: false
      },
      {
        pubkey: 'EXfHYvqN7GTeQa7aiRhq4UMMZBC9PmUXmskgCH7BSaTn',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'H5UFKWBmh7FJAcy12DUhybPVxpFXypvfHcSfrbYxtFDi',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'DQJe1p8CJukkiGc7y4XXDub1ZThiy14k29yhC5rmPZSM',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'SysvarRent111111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'Sysvar1nstructions1111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '11111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        isSigner: false,
        isWritable: false
      }
    ]
  }
]

const createUserBankInstruction = [
  {
    programId: 'KeccakSecp256k11111111111111111111111111111',
    data: {
      type: 'Buffer',
      data: [
        1, 32, 0, 0, 12, 0, 0, 97, 0, 48, 0, 0, 125, 39, 50, 113, 105, 5, 56,
        207, 133, 94, 91, 48, 2, 160, 221, 140, 21, 75, 176, 96, 214, 113, 33,
        53, 220, 198, 222, 221, 10, 47, 230, 220, 59, 252, 12, 8, 243, 105, 32,
        45, 203, 180, 242, 195, 22, 141, 83, 199, 98, 76, 156, 245, 56, 134, 87,
        146, 126, 65, 139, 250, 120, 100, 8, 86, 194, 83, 164, 196, 122, 150,
        130, 223, 79, 136, 144, 227, 115, 143, 64, 129, 25, 121, 75, 50, 1, 238,
        224, 31, 72, 178, 16, 121, 20, 241, 238, 240, 204, 125, 197, 137, 59,
        84, 27, 97, 7, 113, 242, 168, 160, 133, 230, 132, 243, 126, 66, 240,
        161, 0, 101, 205, 29, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0
      ]
    },
    keys: []
  },
  {
    programId: solanaClaimableTokenProgramAddress,
    data: {
      type: 'Buffer',
      data: [
        0, 125, 39, 50, 113, 105, 5, 56, 207, 133, 94, 91, 48, 2, 160, 221, 140,
        21, 75, 176, 96
      ]
    },
    keys: [
      {
        pubkey: 'CgJhbUdHQNN5HBeNEN7J69Z89emh6BtyYX1CPEGwaeqi',
        isSigner: true,
        isWritable: false
      },
      {
        pubkey: 'EXfHYvqN7GTeQa7aiRhq4UMMZBC9PmUXmskgCH7BSaTn',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'H5UFKWBmh7FJAcy12DUhybPVxpFXypvfHcSfrbYxtFDi',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'DQJe1p8CJukkiGc7y4XXDub1ZThiy14k29yhC5rmPZSM',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'SysvarRent111111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'Sysvar1nstructions1111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '11111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        isSigner: false,
        isWritable: false
      }
    ]
  }
]

const garbageProgramInstructions = [
  {
    programId: 'GarbageProgram11111111111111111111111111111',
    data: {
      type: 'Buffer',
      data: [
        1, 32, 0, 0, 12, 0, 0, 97, 0, 48, 0, 0, 125, 39, 50, 113, 105, 5, 56,
        207, 133, 94, 91, 48, 2, 160, 221, 140, 21, 75, 176, 96, 214, 113, 33,
        53, 220, 198, 222, 221, 10, 47, 230, 220, 59, 252, 12, 8, 243, 105, 32,
        45, 203, 180, 242, 195, 22, 141, 83, 199, 98, 76, 156, 245, 56, 134, 87,
        146, 126, 65, 139, 250, 120, 100, 8, 86, 194, 83, 164, 196, 122, 150,
        130, 223, 79, 136, 144, 227, 115, 143, 64, 129, 25, 121, 75, 50, 1, 238,
        224, 31, 72, 178, 16, 121, 20, 241, 238, 240, 204, 125, 197, 137, 59,
        84, 27, 97, 7, 113, 242, 168, 160, 133, 230, 132, 243, 126, 66, 240,
        161, 0, 101, 205, 29, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0
      ]
    },
    keys: []
  },
  {
    programId: solanaClaimableTokenProgramAddress,
    data: {
      type: 'Buffer',
      data: [
        0, 125, 39, 50, 113, 105, 5, 56, 207, 133, 94, 91, 48, 2, 160, 221, 140,
        21, 75, 176, 96
      ]
    },
    keys: [
      {
        pubkey: 'CgJhbUdHQNN5HBeNEN7J69Z89emh6BtyYX1CPEGwaeqi',
        isSigner: true,
        isWritable: false
      },
      {
        pubkey: 'EXfHYvqN7GTeQa7aiRhq4UMMZBC9PmUXmskgCH7BSaTn',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'H5UFKWBmh7FJAcy12DUhybPVxpFXypvfHcSfrbYxtFDi',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'DQJe1p8CJukkiGc7y4XXDub1ZThiy14k29yhC5rmPZSM',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'SysvarRent111111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'Sysvar1nstructions1111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '11111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        isSigner: false,
        isWritable: false
      }
    ]
  }
]

const garbageCreateSenderInstructions = [
  {
    programId: 'KeccakSecp256k11111111111111111111111111111',
    data: {
      type: 'Buffer',
      data: [
        1, 32, 0, 0, 12, 0, 0, 97, 0, 55, 0, 0, 216, 146, 31, 213, 253, 41, 57,
        224, 63, 16, 166, 42, 40, 77, 96, 212, 31, 249, 41, 47, 185, 99, 76,
        213, 23, 232, 147, 16, 222, 94, 253, 150, 200, 120, 16, 46, 73, 217,
        207, 80, 47, 186, 86, 143, 196, 69, 177, 79, 245, 174, 153, 32, 125,
        240, 53, 76, 47, 22, 215, 39, 159, 179, 30, 190, 61, 215, 154, 223, 242,
        164, 87, 79, 129, 134, 170, 82, 5, 136, 222, 216, 116, 148, 244, 111, 1,
        97, 100, 100, 184, 67, 254, 99, 140, 102, 128, 242, 18, 115, 172, 111,
        149, 81, 110, 205, 248, 197, 205, 196, 128, 174, 38, 53, 74, 201, 249,
        225, 83, 244, 120, 112, 206, 146, 20, 240, 71, 36, 193, 147, 221, 146,
        117, 153, 241, 177, 170, 34, 101, 111, 43, 188
      ]
    },
    keys: []
  },
  {
    programId: 'KeccakSecp256k11111111111111111111111111111',
    data: {
      type: 'Buffer',
      data: [
        1, 32, 0, 1, 12, 0, 1, 97, 0, 55, 0, 1, 186, 141, 90, 180, 110, 192, 19,
        246, 6, 120, 193, 84, 237, 188, 50, 144, 145, 223, 41, 7, 56, 208, 129,
        92, 125, 17, 67, 206, 146, 47, 65, 218, 133, 93, 58, 72, 211, 83, 34,
        126, 140, 109, 223, 123, 51, 61, 238, 227, 132, 13, 51, 108, 70, 212,
        181, 173, 236, 13, 82, 61, 22, 170, 187, 5, 169, 246, 39, 22, 164, 81,
        89, 35, 99, 166, 236, 29, 167, 32, 42, 173, 159, 55, 175, 156, 1, 97,
        100, 100, 184, 67, 254, 99, 140, 102, 128, 242, 18, 115, 172, 111, 149,
        81, 110, 205, 248, 197, 205, 196, 128, 174, 38, 53, 74, 201, 249, 225,
        83, 244, 120, 112, 206, 146, 20, 240, 71, 36, 193, 147, 221, 146, 117,
        153, 241, 177, 170, 34, 101, 111, 43, 188
      ]
    },
    keys: []
  },
  {
    programId: 'KeccakSecp256k11111111111111111111111111111',
    data: {
      type: 'Buffer',
      data: [
        1, 32, 0, 2, 12, 0, 2, 97, 0, 55, 0, 2, 169, 35, 181, 32, 37, 114, 92,
        148, 177, 127, 100, 13, 90, 45, 197, 47, 151, 129, 143, 123, 61, 80,
        185, 225, 156, 25, 236, 241, 201, 113, 165, 170, 195, 251, 197, 224,
        209, 220, 79, 247, 23, 37, 243, 182, 84, 208, 10, 138, 191, 240, 56,
        201, 27, 251, 41, 10, 61, 28, 194, 24, 246, 95, 154, 165, 194, 91, 156,
        198, 248, 235, 168, 248, 125, 161, 66, 94, 167, 207, 120, 178, 28, 248,
        199, 227, 1, 97, 100, 100, 184, 67, 254, 99, 140, 102, 128, 242, 18,
        115, 172, 111, 149, 81, 110, 205, 248, 197, 205, 196, 128, 174, 38, 53,
        74, 201, 249, 225, 83, 244, 120, 112, 206, 146, 20, 240, 71, 36, 193,
        147, 221, 146, 117, 153, 241, 177, 170, 34, 101, 111, 43, 188
      ]
    },
    keys: []
  },
  {
    programId: solanaRewardsManagerProgramId,
    data: {
      type: 'Buffer',
      data: [
        4, 206, 146, 20, 240, 71, 36, 193, 147, 221, 146, 117, 153, 241, 177,
        170, 34, 101, 111, 43, 188, 206, 146, 20, 240, 71, 36, 193, 147, 221,
        146, 117, 153, 241, 177, 170, 34, 101, 111, 43, 188
      ]
    },
    keys: [
      {
        pubkey: '3DVmBnXLjfNQt74r2H88yDtsxYogxL4nqALrpJHbU9Fc',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '3DVmBnXLjfNQt74r2H88yDtsxYogxL4nqALrpJHbU9Fc',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '3DVmBnXLjfNQt74r2H88yDtsxYogxL4nqALrpJHbU9Fc',
        isSigner: true,
        isWritable: true
      },
      {
        pubkey: '3DVmBnXLjfNQt74r2H88yDtsxYogxL4nqALrpJHbU9Fc',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'Sysvar1nstructions1111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'SysvarRent111111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '11111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '9oQ6X84pe9RFCK3LeGkyxuWHZj49VemqxK16LbWfezE',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '3bqdSFAnhxwBBZbjpWAnfrbdPF4n5CMrNZDVBkYP1b1E',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '3xZHJxAjYK1GoJV2GQRnxXJuxCjVVxi6izepuowA9cQ7',
        isSigner: false,
        isWritable: false
      }
    ]
  }
]

const createSenderInstructions = [
  {
    programId: 'KeccakSecp256k11111111111111111111111111111',
    data: {
      type: 'Buffer',
      data: [
        1, 32, 0, 0, 12, 0, 0, 97, 0, 55, 0, 0, 216, 146, 31, 213, 253, 41, 57,
        224, 63, 16, 166, 42, 40, 77, 96, 212, 31, 249, 41, 47, 185, 99, 76,
        213, 23, 232, 147, 16, 222, 94, 253, 150, 200, 120, 16, 46, 73, 217,
        207, 80, 47, 186, 86, 143, 196, 69, 177, 79, 245, 174, 153, 32, 125,
        240, 53, 76, 47, 22, 215, 39, 159, 179, 30, 190, 61, 215, 154, 223, 242,
        164, 87, 79, 129, 134, 170, 82, 5, 136, 222, 216, 116, 148, 244, 111, 1,
        97, 100, 100, 184, 67, 254, 99, 140, 102, 128, 242, 18, 115, 172, 111,
        149, 81, 110, 205, 248, 197, 205, 196, 128, 174, 38, 53, 74, 201, 249,
        225, 83, 244, 120, 112, 206, 146, 20, 240, 71, 36, 193, 147, 221, 146,
        117, 153, 241, 177, 170, 34, 101, 111, 43, 188
      ]
    },
    keys: []
  },
  {
    programId: 'KeccakSecp256k11111111111111111111111111111',
    data: {
      type: 'Buffer',
      data: [
        1, 32, 0, 1, 12, 0, 1, 97, 0, 55, 0, 1, 186, 141, 90, 180, 110, 192, 19,
        246, 6, 120, 193, 84, 237, 188, 50, 144, 145, 223, 41, 7, 56, 208, 129,
        92, 125, 17, 67, 206, 146, 47, 65, 218, 133, 93, 58, 72, 211, 83, 34,
        126, 140, 109, 223, 123, 51, 61, 238, 227, 132, 13, 51, 108, 70, 212,
        181, 173, 236, 13, 82, 61, 22, 170, 187, 5, 169, 246, 39, 22, 164, 81,
        89, 35, 99, 166, 236, 29, 167, 32, 42, 173, 159, 55, 175, 156, 1, 97,
        100, 100, 184, 67, 254, 99, 140, 102, 128, 242, 18, 115, 172, 111, 149,
        81, 110, 205, 248, 197, 205, 196, 128, 174, 38, 53, 74, 201, 249, 225,
        83, 244, 120, 112, 206, 146, 20, 240, 71, 36, 193, 147, 221, 146, 117,
        153, 241, 177, 170, 34, 101, 111, 43, 188
      ]
    },
    keys: []
  },
  {
    programId: 'KeccakSecp256k11111111111111111111111111111',
    data: {
      type: 'Buffer',
      data: [
        1, 32, 0, 2, 12, 0, 2, 97, 0, 55, 0, 2, 169, 35, 181, 32, 37, 114, 92,
        148, 177, 127, 100, 13, 90, 45, 197, 47, 151, 129, 143, 123, 61, 80,
        185, 225, 156, 25, 236, 241, 201, 113, 165, 170, 195, 251, 197, 224,
        209, 220, 79, 247, 23, 37, 243, 182, 84, 208, 10, 138, 191, 240, 56,
        201, 27, 251, 41, 10, 61, 28, 194, 24, 246, 95, 154, 165, 194, 91, 156,
        198, 248, 235, 168, 248, 125, 161, 66, 94, 167, 207, 120, 178, 28, 248,
        199, 227, 1, 97, 100, 100, 184, 67, 254, 99, 140, 102, 128, 242, 18,
        115, 172, 111, 149, 81, 110, 205, 248, 197, 205, 196, 128, 174, 38, 53,
        74, 201, 249, 225, 83, 244, 120, 112, 206, 146, 20, 240, 71, 36, 193,
        147, 221, 146, 117, 153, 241, 177, 170, 34, 101, 111, 43, 188
      ]
    },
    keys: []
  },
  {
    programId: solanaRewardsManagerProgramId,
    data: {
      type: 'Buffer',
      data: [
        4, 206, 146, 20, 240, 71, 36, 193, 147, 221, 146, 117, 153, 241, 177,
        170, 34, 101, 111, 43, 188, 206, 146, 20, 240, 71, 36, 193, 147, 221,
        146, 117, 153, 241, 177, 170, 34, 101, 111, 43, 188
      ]
    },
    keys: [
      {
        pubkey: solanaRewardsManager,
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'BqmeGBetZSbGcHqwzdd1VyCBuuAMu5mPKL3PAbYPcoJy',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '4SyVnSdeU66KWK44Y2rZGpLEEKvLvsNgnQ7YbMoJTn75',
        isSigner: true,
        isWritable: true
      },
      {
        pubkey: '3DVmBnXLjfNQt74r2H88yDtsxYogxL4nqALrpJHbU9Fc',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'Sysvar1nstructions1111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'SysvarRent111111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '11111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '9oQ6X84pe9RFCK3LeGkyxuWHZj49VemqxK16LbWfezE',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '3bqdSFAnhxwBBZbjpWAnfrbdPF4n5CMrNZDVBkYP1b1E',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '3xZHJxAjYK1GoJV2GQRnxXJuxCjVVxi6izepuowA9cQ7',
        isSigner: false,
        isWritable: false
      }
    ]
  }
]

// Taken from a request on staging, updated to use config + test authority
const withdrawSwapRelayRequest = {
  signatures: [
    {
      publicKey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
      signature: {
        type: 'Buffer',
        data: [
          225, 44, 90, 216, 108, 140, 137, 201, 241, 242, 247, 85, 198, 232,
          158, 19, 18, 110, 81, 16, 13, 239, 167, 49, 110, 97, 129, 220, 0, 254,
          189, 191, 160, 187, 244, 238, 17, 96, 175, 93, 19, 141, 34, 229, 243,
          71, 41, 236, 243, 158, 69, 228, 122, 51, 88, 73, 10, 173, 236, 174,
          70, 181, 234, 1
        ]
      }
    }
  ],
  instructions: [
    {
      programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      data: {
        type: 'Buffer',
        data: []
      },
      keys: [
        {
          pubkey: 'E3CfijtAJwBSHfwFEViAUd3xp7c8TBxwC1eXn1Fgxp8h',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: '38xsSuSjFHhwanFcGvemCiu774GQu3METo7UkYCY5Fdt',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: usdcMintAddress,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: '11111111111111111111111111111111',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          isSigner: false,
          isWritable: false
        }
      ]
    },
    {
      programId: 'KeccakSecp256k11111111111111111111111111111',
      data: {
        type: 'Buffer',
        data: [
          1, 32, 0, 1, 12, 0, 1, 97, 0, 48, 0, 1, 183, 76, 209, 22, 179, 194,
          131, 155, 255, 65, 225, 228, 222, 112, 207, 217, 170, 33, 29, 255,
          126, 177, 61, 111, 239, 210, 139, 183, 254, 244, 76, 149, 29, 117,
          137, 255, 124, 19, 102, 34, 49, 217, 84, 10, 226, 48, 5, 133, 122, 18,
          202, 67, 4, 89, 180, 145, 248, 91, 131, 98, 17, 101, 248, 88, 77, 238,
          237, 8, 85, 98, 24, 146, 11, 138, 35, 37, 162, 141, 143, 3, 113, 217,
          155, 167, 1, 31, 193, 156, 150, 34, 90, 120, 39, 198, 57, 208, 4, 199,
          82, 145, 100, 148, 137, 226, 25, 200, 69, 233, 114, 7, 169, 0, 91,
          223, 219, 96, 3, 94, 159, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0
        ]
      },
      keys: []
    },
    {
      programId: solanaClaimableTokenProgramAddress,
      data: {
        type: 'Buffer',
        data: [
          1, 183, 76, 209, 22, 179, 194, 131, 155, 255, 65, 225, 228, 222, 112,
          207, 217, 170, 33, 29, 255
        ]
      },
      keys: [
        {
          pubkey: 'E3CfijtAJwBSHfwFEViAUd3xp7c8TBxwC1eXn1Fgxp8h',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: 'Ec8jR47Z2nNLAvGwg5Yob5Lzoo4YXYkA1o7MyRku5EzU',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: '38xsSuSjFHhwanFcGvemCiu774GQu3METo7UkYCY5Fdt',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: '5m5o14JYmoKtVcwhYmXqbE1fY6tFe6oj7Teic3N5rZC2',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: usdcClaimableTokenAuthority,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'SysvarRent111111111111111111111111111111111',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'Sysvar1nstructions1111111111111111111111111',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: '11111111111111111111111111111111',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          isSigner: false,
          isWritable: false
        }
      ]
    },
    {
      programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      data: {
        type: 'Buffer',
        data: [1]
      },
      keys: [
        {
          pubkey: 'E3CfijtAJwBSHfwFEViAUd3xp7c8TBxwC1eXn1Fgxp8h',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: 'BGWzjcV3ePyqtQyti2cEvXrs2CVC936MG7ThwGXSt9nL',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: 'So11111111111111111111111111111111111111112',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: '11111111111111111111111111111111',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          isSigner: false,
          isWritable: false
        }
      ]
    },
    {
      programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
      data: {
        type: 'Buffer',
        data: [
          193, 32, 155, 51, 65, 214, 156, 129, 7, 1, 0, 0, 0, 17, 0, 100, 0, 1,
          94, 159, 0, 0, 0, 0, 0, 0, 153, 48, 31, 0, 0, 0, 0, 0, 3, 0, 0
        ]
      },
      keys: [
        {
          pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: '6LXutJvKUw8Q5ue2gCgKHQdAN4suWW8awzFVC6XCguFx',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: '38xsSuSjFHhwanFcGvemCiu774GQu3METo7UkYCY5Fdt',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: 'G4CD7aqqZZ6QKCNHrc1MPdS9Aw8BWmQ5ZkDd54W6mAEG',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: 'BuqEDKUwyAotZuK37V4JYEykZVKY8qo1zKbpfU9gkJMo',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: 'BGWzjcV3ePyqtQyti2cEvXrs2CVC936MG7ThwGXSt9nL',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: usdcMintAddress,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'So11111111111111111111111111111111111111112',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: '6LXutJvKUw8Q5ue2gCgKHQdAN4suWW8awzFVC6XCguFx',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: 'BuqEDKUwyAotZuK37V4JYEykZVKY8qo1zKbpfU9gkJMo',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: '6mQ8xEaHdTikyMvvMxUctYch6dUjnKgfoeib2msyMMi1',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: 'G4CD7aqqZZ6QKCNHrc1MPdS9Aw8BWmQ5ZkDd54W6mAEG',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: 'AQ36QRk3HAe6PHqBCtKTQnYKpt2kAagq9YoeTqUPMGHx',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: 'BsHJygFs48NvjUU8EiRKz71zDc3h5PP4mJ3co5LWshiM',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: 'BernaJMJyCpj52MFHvD7HwG4ArahCKDM3evYy9PpkaYx',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: '3n4dNsh1yUnYScbPB1K6wKhKrvew8iL8zvxQHtMBFY57',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: '923j69hYbT5Set5kYfiQr1D8jPL6z15tbfTbVLSwUWJD',
          isSigner: false,
          isWritable: false
        }
      ]
    },
    {
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      data: {
        type: 'Buffer',
        data: [9]
      },
      keys: [
        {
          pubkey: 'BGWzjcV3ePyqtQyti2cEvXrs2CVC936MG7ThwGXSt9nL',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
          isSigner: true,
          isWritable: true
        }
      ]
    },
    {
      programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      data: {
        type: 'Buffer',
        data: [1]
      },
      keys: [
        {
          pubkey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: 'BGWzjcV3ePyqtQyti2cEvXrs2CVC936MG7ThwGXSt9nL',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: 'So11111111111111111111111111111111111111112',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: '11111111111111111111111111111111',
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          isSigner: false,
          isWritable: false
        }
      ]
    },
    {
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      data: {
        type: 'Buffer',
        data: [9]
      },
      keys: [
        {
          pubkey: 'BGWzjcV3ePyqtQyti2cEvXrs2CVC936MG7ThwGXSt9nL',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: 'E3CfijtAJwBSHfwFEViAUd3xp7c8TBxwC1eXn1Fgxp8h',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
          isSigner: true,
          isWritable: true
        }
      ]
    },
    {
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      data: {
        type: 'Buffer',
        data: [9]
      },
      keys: [
        {
          pubkey: '38xsSuSjFHhwanFcGvemCiu774GQu3METo7UkYCY5Fdt',
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: 'E3CfijtAJwBSHfwFEViAUd3xp7c8TBxwC1eXn1Fgxp8h',
          isSigner: true,
          isWritable: true
        },
        {
          pubkey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
          isSigner: true,
          isWritable: true
        }
      ]
    }
  ],
  skipPreflight: true,
  feePayerOverride: 'E3CfijtAJwBSHfwFEViAUd3xp7c8TBxwC1eXn1Fgxp8h',
  lookupTableAddresses: ['69faBefyGax5bcHB9pa1KhY8ybSpEfKj3aNvbuuP45My'],
  retry: true,
  recentBlockhash: 'GUwARQkePkWKHYntiAN3JUgEoTidiWHvMn7TMcrqRyci'
}

const unclosedTokenAccountInstructions = [
  {
    programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    data: {
      type: 'Buffer',
      data: []
    },
    keys: [
      {
        pubkey: 'E3CfijtAJwBSHfwFEViAUd3xp7c8TBxwC1eXn1Fgxp8h',
        isSigner: true,
        isWritable: true
      },
      {
        pubkey: '38xsSuSjFHhwanFcGvemCiu774GQu3METo7UkYCY5Fdt',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '238THzhMzQRhJtTDRe34sLqW2LYbuR2MUGcCzgGbjuPW',
        isSigner: true,
        isWritable: true
      },
      {
        pubkey: usdcMintAddress,
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '11111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        isSigner: false,
        isWritable: false
      }
    ]
  }
]

module.exports = {
  sendInstruction,
  createUserBankInstruction,
  garbageProgramInstructions,
  garbageCreateSenderInstructions,
  createSenderInstructions,
  withdrawSwapRelayRequest,
  unclosedTokenAccountInstructions
}
