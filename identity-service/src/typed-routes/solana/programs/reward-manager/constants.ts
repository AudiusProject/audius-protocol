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
