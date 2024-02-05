import { useCallback } from 'react'

import {
  settingsPageSelectors,
  settingsPageActions
} from '@audius/common/store'
import { IconRobot } from '@audius/harmony'
import {
  Button,
  ButtonSize,
  ButtonType,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  MarkdownViewer
} from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'utils/reducer'

import styles from './AiAttributionSettingsModal.module.css'
const { setAiAttribution } = settingsPageActions
const { getAllowAiAttribution } = settingsPageSelectors

const messages = {
  title: 'AI Generated Music Settings',
  label: 'Allow AI-generated music based on my likeness',
  description1:
    'By opting in, you grant permission for AI models to be trained using your musical likeness, opening up a world of possibilities for you and your fans.',
  description2:
    ' With this feature enabled, a special section will appear on your profile, showcasing any AI-generated tracks that emulate your sound.',

  disable: 'Disable',
  accept: 'Agree & Enable'
}

const eula = `
**ARTIST AI AGREEMENT**

This Artist AI Agreement (the “**Agreement”**) constitutes a legally binding agreement between Tiki Labs, Inc. (“**we**”, “**us**”, or “**our**”) and each Service User that opts to use the AI Service (as defined below). This Agreement form a part of, and a hereby incorporated into, the [Standard Terms](https://audius.co/legal/terms-of-use) and together with all other Ancillary Documents make up the Platform Terms of Use. Capitalized terms used but not defined herein have the meanings given them in the Platform Standard Terms.

1. **Distribution of AI Tracks**: We will allow Service Users to deliver to us sound recordings, musical works or covers or other works (the “**AI Tracks**”) generated using artificial intelligence or other machine learning technologies (the “**AI Service**”) including, but not limited to: applicable stems of sound recordings, music recording session files, digital audio workstation project files, sound design and instrument settings, the final version(s) of sound recordings, musical compositions, lyrics of the musical compositions, recordings of your voice, photographs or artwork representing your name and likeness, and other such elements of the aforementioned.
2. **Rights and Usage**:
    1. You hereby grant to us a perpetual, non-exclusive, royalty free, worldwide, transferrable, assignable, right and license, to use, reproduce, publish, perform, display and distribute all or any portion of the AI Tracks pursuant to this Agreement.   Such license includes, without limitation, a license to your name and likeness, voice, sound recordings and underlying compositions to the extent used in the creation of or training of AI Tracks.
    2. For the purposes of and pursuant to the terms of this Agreement, you hereby waive any and all “moral” rights claims to your voice, name and likeness under applicable law, including, without limitation, as set forth under the Visual Artists Rights Act of 1990 (VARA), the Lanham Act (15 U.S.C. §1051), the General Data Protection Regulation (GDPR), the Data Protection Act 2018 (DPA), the Human Rights Act 1998 (HRA) and the European Convention on Human Rights (ECHR).
3. **Representations, Warranties and Indemnity**: You represent, warrant, covenant, and agree that you are free to enter into and perform this Agreement, and are not and will not be under any disability, restriction or prohibition, contractual or otherwise (including with any record label, distributor, music publisher, or any other third party) with respect to your right to execute this Agreement, grant all of the rights granted to us hereunder, and fully perform each and every term hereof. You agree not to initiate any action, suit or proceeding against us with respect to the validity of the copyright of the AI Tracks (including with respect to the copyrightability of AI-generated elements incorporated therein). You agree to indemnify and hold us and our licensees, employees, affiliates and distributors harmless against any claim, liability, cost and expense in connection with any claim that is inconsistent with any agreement, covenant, representation, or warranty made by you herein. You will reimburse us upon demand for any payment made by us at any time in respect of any claim, liability, damage or expense to which the foregoing indemnity relates.
`

export const AiAttributionSettingsModal = () => {
  const [isOpen, setIsOpen] = useModalState('AiAttributionSettings')
  const allowAiAttribution = useSelector(getAllowAiAttribution)
  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const handleSubmit = useCallback(() => {
    dispatch(setAiAttribution(!allowAiAttribution))
    handleClose()
  }, [dispatch, allowAiAttribution, handleClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      bodyClassName={styles.root}
      dismissOnClickOutside={false}
    >
      <ModalHeader>
        <ModalTitle
          title={messages.title}
          titleClassName={styles.title}
          icon={<IconRobot className={styles.titleIcon} />}
        />
      </ModalHeader>
      <ModalContent className={styles.content} forward>
        <span className={styles.description}>{messages.description1}</span>
        <span className={styles.description}>{messages.description2}</span>
        <div className={styles.markdownFrame}>
          <MarkdownViewer
            className={styles.eula}
            markdown={eula}
            maxHeight={200}
          />
        </div>
        {allowAiAttribution ? (
          <Button
            text={messages.disable}
            type={ButtonType.COMMON}
            size={ButtonSize.MEDIUM}
            className={styles.doneButton}
            onClick={handleSubmit}
          />
        ) : (
          <Button
            text={messages.accept}
            type={ButtonType.PRIMARY}
            size={ButtonSize.MEDIUM}
            className={styles.doneButton}
            onClick={handleSubmit}
          />
        )}
      </ModalContent>
    </Modal>
  )
}
