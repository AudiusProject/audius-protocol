import { useCallback, useEffect } from 'react'

import { Button, IconUserList } from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'

import SettingsCard from '../SettingsCard'
import { useHistoryContext } from 'app/HistoryProvider'
import { doesMatchRoute } from 'utils/route'
import { route } from '@audius/common/utils'
import { settingsMessages } from '@audius/common/messages'

const { LABEL_ACCOUNT_SETTINGS_PAGE } = route

export const LabelAccountSettingsCard = () => {
  const [, setIsModalOpen] = useModalState('LabelAccount')
  const { history } = useHistoryContext()

  useEffect(() => {
    const match = doesMatchRoute(
      history.location,
      LABEL_ACCOUNT_SETTINGS_PAGE
    )
    if (match) {
      setIsModalOpen(true)
    }
  }, [history.location])


  const handleOpen = useCallback(() => {
    setIsModalOpen(true)
  }, [setIsModalOpen])

  return (
    <>
      <SettingsCard
          icon={<IconUserList />}
          title={settingsMessages.labelAccountCardTitle}
          description={settingsMessages.labelAccountCardDescription}
        >
          <Button variant='secondary' fullWidth onClick={handleOpen}>
            {settingsMessages.labelAccountButtonText}
          </Button>
        </SettingsCard>
    </>
  )
}
