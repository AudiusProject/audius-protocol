export type SlashProposalParams = {
  amountWei: number;
  title: string;
  description: string;
  owner: string;
};

export const propose = async (
  app: App<SharedData>,
  params: SlashProposalParams
) => {
  const { libs, dryRun } = app.viewAppData();
  const web3 = libs.ethWeb3Manager.getWeb3();

  const targetContractRegistryKey = web3.utils.utf8ToHex("DelegateManager");
  const callValue = 0;
  const functionSignature = "slash(uint256,address)";

  const callData = [
    `${web3.utils.utf8ToHex(params.amountWei.toString())}`,
    `${web3.utils.utf8ToHex(params.owner)}`,
  ];

  console.log({
    targetContractRegistryKey,
    callValue,
    functionSignature,
    callData,
    name: params.title,
    description: params.description,
  });
  if (!dryRun) {
    console.log("Submitting proposal");
    const proposalId = await libs.ethContracts.GovernanceClient.submitProposal({
      targetContractRegistryKey,
      callValue,
      functionSignature,
      callData,
      name: params.title,
      description: params.description,
    });
    console.log(`Created proposal ${proposalId}`);
  }
};
