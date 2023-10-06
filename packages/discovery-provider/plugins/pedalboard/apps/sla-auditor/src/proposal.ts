import { App } from '@pedalboard/basekit'
import { SharedData } from './config'
import BN from 'bn.js'

export type SlashProposalParams = {
  amountWei: BN
  title: string
  description: string
  owner: string
}

export const propose = async (
  app: App<SharedData>,
  params: SlashProposalParams
) => {
  const { libs, dryRun } = app.viewAppData()
  if (!libs.ethWeb3Manager || !libs.ethContracts) {
    throw new Error('Failed to propose, no ethWeb3Manager or ethContracts')
  }

  const web3 = libs.ethWeb3Manager.getWeb3()

  const targetContractRegistryKey = web3.utils.utf8ToHex('DelegateManager')
  const callValue = '0'
  const functionSignature = 'slash(uint256,address)'

  const callData = [params.amountWei.toString(), params.owner]

  // Ensure we aren't going to double submit
  const inProgressProposalIds: string[] =
    await libs.ethContracts.GovernanceClient.getInProgressProposals()
  const inProgressProposals = await Promise.all(
    inProgressProposalIds.map((id) =>
      libs.ethContracts?.GovernanceClient.getProposalSubmission(parseInt(id))
    )
  )

  for (const proposal of inProgressProposals) {
    if (
      proposal?.name === params.title &&
      proposal?.description === params.description
    ) {
      console.log(`Duplicate proposal for ${params.title} exists`)
      return
    }
  }

  console.log(`Submitting proposal: ${params.title}`)
  if (!dryRun) {
    const proposalId = await libs.ethContracts.GovernanceClient.submitProposal({
      targetContractRegistryKey,
      callValue,
      functionSignature,
      callData,
      name: params.title,
      description: params.description
    })
    console.log(`Created proposal: ${proposalId}`)
  } else {
    console.log('=======DRY RUN=======')
    console.log({
      targetContractRegistryKey,
      callValue,
      functionSignature,
      callData,
      name: params.title,
      description: params.description
    })
  }
}
