/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/crowdfund.json`.
 */
export type Crowdfund = {
  address: '4UkTdMM9dNqjUAEjAJVj8Rec83bG747V9dZP7HLK2LJk'
  metadata: {
    name: 'crowdfund'
    version: '0.1.0'
    spec: '0.1.0'
    description: 'Created with Anchor'
  }
  instructions: [
    {
      name: 'contribute'
      discriminator: [82, 33, 68, 131, 32, 0, 205, 95]
      accounts: [
        {
          name: 'senderOwner'
          signer: true
        },
        {
          name: 'senderTokenAccount'
          writable: true
        },
        {
          name: 'campaignAccount'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 97, 109, 112, 97, 105, 103, 110]
              },
              {
                kind: 'arg'
                path: 'data.content_id'
              },
              {
                kind: 'arg'
                path: 'data.content_type'
              }
            ]
          }
        },
        {
          name: 'escrowTokenAccount'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [101, 115, 99, 114, 111, 119]
              },
              {
                kind: 'arg'
                path: 'data.content_id'
              },
              {
                kind: 'arg'
                path: 'data.content_type'
              }
            ]
          }
        },
        {
          name: 'tokenProgram'
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
        {
          name: 'mint'
        }
      ]
      args: [
        {
          name: 'data'
          type: {
            defined: {
              name: 'contributeInstructionData'
            }
          }
        }
      ]
    },
    {
      name: 'contributeUserBank'
      discriminator: [234, 78, 120, 207, 100, 135, 121, 253]
      accounts: [
        {
          name: 'feePayer'
          signer: true
        },
        {
          name: 'senderUserBankAccount'
          writable: true
        },
        {
          name: 'campaignAccount'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 97, 109, 112, 97, 105, 103, 110]
              },
              {
                kind: 'arg'
                path: 'data.content_id'
              },
              {
                kind: 'arg'
                path: 'data.content_type'
              }
            ]
          }
        },
        {
          name: 'escrowTokenAccount'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [101, 115, 99, 114, 111, 119]
              },
              {
                kind: 'arg'
                path: 'data.content_id'
              },
              {
                kind: 'arg'
                path: 'data.content_type'
              }
            ]
          }
        },
        {
          name: 'tokenProgram'
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
        {
          name: 'mint'
        },
        {
          name: 'claimableTokensProgram'
        },
        {
          name: 'userBankNonce'
        },
        {
          name: 'userBankAuthority'
        },
        {
          name: 'rent'
          address: 'SysvarRent111111111111111111111111111111111'
        },
        {
          name: 'instructions'
        },
        {
          name: 'system'
          address: '11111111111111111111111111111111'
        }
      ]
      args: [
        {
          name: 'data'
          type: {
            defined: {
              name: 'contributeUserBankInstructionData'
            }
          }
        }
      ]
    },
    {
      name: 'startCampaign'
      discriminator: [229, 59, 6, 209, 253, 163, 39, 124]
      accounts: [
        {
          name: 'feePayerWallet'
          writable: true
          signer: true
        },
        {
          name: 'campaignAccount'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 97, 109, 112, 97, 105, 103, 110]
              },
              {
                kind: 'arg'
                path: 'campaign.content_id'
              },
              {
                kind: 'arg'
                path: 'campaign.content_type'
              }
            ]
          }
        },
        {
          name: 'escrowTokenAccount'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [101, 115, 99, 114, 111, 119]
              },
              {
                kind: 'arg'
                path: 'campaign.content_id'
              },
              {
                kind: 'arg'
                path: 'campaign.content_type'
              }
            ]
          }
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
        {
          name: 'tokenProgram'
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
        {
          name: 'mint'
        }
      ]
      args: [
        {
          name: 'campaign'
          type: {
            defined: {
              name: 'startCampaignInstructionData'
            }
          }
        }
      ]
    },
    {
      name: 'unlock'
      discriminator: [101, 155, 40, 21, 158, 189, 56, 203]
      accounts: [
        {
          name: 'feePayerWallet'
          writable: true
        },
        {
          name: 'campaignAccount'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 97, 109, 112, 97, 105, 103, 110]
              },
              {
                kind: 'arg'
                path: 'data.content_id'
              },
              {
                kind: 'arg'
                path: 'data.content_type'
              }
            ]
          }
        },
        {
          name: 'escrowTokenAccount'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [101, 115, 99, 114, 111, 119]
              },
              {
                kind: 'arg'
                path: 'data.content_id'
              },
              {
                kind: 'arg'
                path: 'data.content_type'
              }
            ]
          }
        },
        {
          name: 'destinationAccount'
          writable: true
        },
        {
          name: 'tokenProgram'
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
        {
          name: 'mint'
        }
      ]
      args: [
        {
          name: 'data'
          type: {
            defined: {
              name: 'unlockInstructionData'
            }
          }
        }
      ]
    }
  ]
  accounts: [
    {
      name: 'campaignAccount'
      discriminator: [167, 6, 205, 183, 220, 156, 200, 113]
    }
  ]
  errors: [
    {
      code: 6000
      name: 'invalidContentType'
      msg: 'Content type not supported'
    },
    {
      code: 6001
      name: 'campaignNotFunded'
      msg: 'Campaign not funded'
    }
  ]
  types: [
    {
      name: 'campaignAccount'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'destinationWallet'
            type: 'pubkey'
          },
          {
            name: 'fundingThreshold'
            type: 'u64'
          },
          {
            name: 'contentId'
            type: 'u32'
          },
          {
            name: 'contentType'
            type: 'u8'
          },
          {
            name: 'feePayerWallet'
            type: 'pubkey'
          },
          {
            name: 'bump'
            type: 'u8'
          }
        ]
      }
    },
    {
      name: 'contributeInstructionData'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'contentId'
            type: 'u32'
          },
          {
            name: 'contentType'
            type: 'u8'
          },
          {
            name: 'amount'
            type: 'u64'
          }
        ]
      }
    },
    {
      name: 'contributeUserBankInstructionData'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'contentId'
            type: 'u32'
          },
          {
            name: 'contentType'
            type: 'u8'
          },
          {
            name: 'amount'
            type: 'u64'
          },
          {
            name: 'ethAddress'
            type: {
              array: ['u8', 20]
            }
          }
        ]
      }
    },
    {
      name: 'startCampaignInstructionData'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'destinationWallet'
            type: 'pubkey'
          },
          {
            name: 'fundingThreshold'
            type: 'u64'
          },
          {
            name: 'contentId'
            type: 'u32'
          },
          {
            name: 'contentType'
            type: 'u8'
          }
        ]
      }
    },
    {
      name: 'unlockInstructionData'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'contentId'
            type: 'u32'
          },
          {
            name: 'contentType'
            type: 'u8'
          }
        ]
      }
    }
  ]
}
