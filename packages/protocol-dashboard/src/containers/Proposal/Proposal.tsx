import React from 'react'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import Page from 'components/Page'
import { RouteComponentProps } from 'react-router-dom'
import ProposalHero from 'components/ProposalHero'
import { useProposal } from 'store/cache/proposals/hooks'
import { Outcome } from 'types'

import VotesTable from 'components/VotesTable'
import { useVotes, useUserVote } from 'store/cache/votes/hooks'
import { GOVERNANCE } from 'utils/routes'

import desktopStyles from './Proposal.module.css'
import mobileStyles from './ProposalMobile.module.css'
import { createStyles } from 'utils/mobile'
import Paper from 'components/Paper'
import Loading from 'components/Loading'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  active: 'Active Proposal',
  resolved: 'Resolved Proposal',
  proposal: '',
  previousPage: 'All Proposals',
  descriptionTitle: 'Description'
}

type ProposalProps = {} & RouteComponentProps<{ proposalId: string }>
const Proposal: React.FC<ProposalProps> = (props: ProposalProps) => {
  const {
    match: { params }
  } = props
  const proposalId = parseInt(params.proposalId)
  const { proposal } = useProposal(proposalId)
  const { votesFor, votesAgainst } = useVotes(proposalId)
  const { userVote } = useUserVote(proposalId)

  const title = proposal
    ? proposal.outcome === Outcome.InProgress
      ? messages.active
      : messages.resolved
    : messages.proposal

  return (
    <Page
      title={title}
      defaultPreviousPage={messages.previousPage}
      defaultPreviousPageRoute={GOVERNANCE}
    >
      <ProposalHero userVote={userVote} proposal={proposal} />
      <Paper className={styles.description}>
        <div className={styles.descriptionTitleContainer}>
          <div className={styles.descriptionTitle}>
            {messages.descriptionTitle}
          </div>
        </div>
        {proposal ? (
          <div className={styles.descriptionBody}>
            <ReactMarkdown plugins={[gfm]} linkTarget="_blank">
              {proposal.description || ''}
            </ReactMarkdown>
          </div>
        ) : (
          <Loading className={styles.loading} />
        )}
      </Paper>
      <div className={styles.votes}>
        {<VotesTable title="For" votes={votesFor} />}
        {<VotesTable title="Against" votes={votesAgainst} />}
      </div>
    </Page>
  )
}

export default Proposal
