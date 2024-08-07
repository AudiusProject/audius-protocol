export enum RewardManagerInstruction {
  Init = 0,
  ChangeManagerAccount = 1,
  CreateSender = 2,
  DeleteSender = 3,
  CreateSenderPublic = 4,
  DeleteSenderPublic = 5,
  SubmitAttestation = 6,
  EvaluateAttestations = 7
}

/**
 * Possible custom error messages from the Reward Manager program
 * @see {@link https://github.com/AudiusProject/audius-protocol/blob/2a37bcff1bb1a82efdf187d1723b3457dc0dcb9b/solana-programs/reward-manager/program/src/error.rs solana-programs/reward-manager/program/src/errors.rs}
 */
export enum RewardManagerErrorCode {
  IncorrectOwner = 0,
  SignCollision,
  WrongSigner,
  NotEnoughSigners,
  Secp256InstructionMissing,
  InstructionLoadError,
  RepeatedSenders,
  SignatureVerificationFailed,
  OperatorCollision,
  AlreadySent,
  IncorrectMessages,
  MessagesOverflow,
  MathOverflow,
  InvalidRecipient
}
