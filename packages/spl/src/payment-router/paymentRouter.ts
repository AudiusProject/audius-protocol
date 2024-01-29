export type PaymentRouter = {
  version: '0.1.0'
  name: 'payment_router'
  instructions: [
    {
      name: 'createPaymentRouterBalancePda'
      accounts: [
        {
          name: 'paymentRouterPda'
          isMut: true
          isSigner: false
          docs: [
            'before transferring them over to given recipients, all within the same transaction.'
          ]
        },
        {
          name: 'payer'
          isMut: true
          isSigner: true
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: 'route'
      accounts: [
        {
          name: 'sender'
          isMut: true
          isSigner: false
        },
        {
          name: 'senderOwner'
          isMut: false
          isSigner: false
        },
        {
          name: 'splToken'
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: 'paymentRouterPdaBump'
          type: 'u8'
        },
        {
          name: 'amounts'
          type: {
            vec: 'u64'
          }
        },
        {
          name: 'totalAmount'
          type: 'u64'
        }
      ]
    }
  ]
  errors: [
    {
      code: 6000
      name: 'SenderTokenAccountNotOwnedByPDA'
      msg: 'Sender token account not owned by PDA.'
    },
    {
      code: 6001
      name: 'RecipientAmountMismatch'
      msg: 'Number of recipients does not match number of amounts.'
    },
    {
      code: 6002
      name: 'TotalAmountMismatch'
      msg: 'Total of individual amounts does not match total amount.'
    }
  ]
}

export const IDL: PaymentRouter = {
  version: '0.1.0',
  name: 'payment_router',
  instructions: [
    {
      name: 'createPaymentRouterBalancePda',
      accounts: [
        {
          name: 'paymentRouterPda',
          isMut: true,
          isSigner: false,
          docs: [
            'before transferring them over to given recipients, all within the same transaction.'
          ]
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: 'route',
      accounts: [
        {
          name: 'sender',
          isMut: true,
          isSigner: false
        },
        {
          name: 'senderOwner',
          isMut: false,
          isSigner: false
        },
        {
          name: 'splToken',
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: 'paymentRouterPdaBump',
          type: 'u8'
        },
        {
          name: 'amounts',
          type: {
            vec: 'u64'
          }
        },
        {
          name: 'totalAmount',
          type: 'u64'
        }
      ]
    }
  ],
  errors: [
    {
      code: 6000,
      name: 'SenderTokenAccountNotOwnedByPDA',
      msg: 'Sender token account not owned by PDA.'
    },
    {
      code: 6001,
      name: 'RecipientAmountMismatch',
      msg: 'Number of recipients does not match number of amounts.'
    },
    {
      code: 6002,
      name: 'TotalAmountMismatch',
      msg: 'Total of individual amounts does not match total amount.'
    }
  ]
}
