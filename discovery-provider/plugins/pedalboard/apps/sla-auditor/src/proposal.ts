import App from "basekit/src/app";
import { SharedData } from "./config";

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
  if (!libs.ethWeb3Manager || !libs.ethContracts) {
    throw new Error("Failed to propose, no ethWeb3Manager or ethContracts");
  }

  const web3 = libs.ethWeb3Manager.getWeb3();

  const targetContractRegistryKey = web3.utils.utf8ToHex("DelegateManager");
  const callValue = "0";
  const functionSignature = "slash(uint256,address)";

  const callData = [
    `${web3.utils.utf8ToHex(params.amountWei.toString())}`,
    params.owner,
  ];

  // Ensure we aren't going to double submit
  const inProgressProposalIds: string[] =
    await libs.ethContracts.GovernanceClient.getInProgressProposals();
  const inProgressProposals = await Promise.all(
    inProgressProposalIds.map((id) =>
      libs.ethContracts?.GovernanceClient.getProposalSubmission(parseInt(id))
    )
  );

  for (const proposal of inProgressProposals) {
    if (
      proposal?.name === params.title &&
      proposal?.description === params.description
    ) {
      console.log(`Duplicate proposal for ${params.title} exists`);
      return;
    }
  }

  console.log(`Submitting proposal: ${params.title}`);
  if (!dryRun) {
    const proposalId = await libs.ethContracts.GovernanceClient.submitProposal({
      targetContractRegistryKey,
      callValue,
      functionSignature,
      callData,
      name: params.title,
      description: params.description,
    });
    console.log(`Created proposal: ${proposalId}`);
  }
};
