import { useCallback, useState } from 'react'

import { Story } from '@storybook/react'

import { Type, Button } from 'components/Button'
import { IconArrowWhite } from 'components/Icons'

import { Modal } from './Modal'
import { ModalProps } from './types'

import { ModalContentPages, ModalFooter, ModalHeader, ModalTitle } from '.'

export default {
  component: ModalContentPages,
  title: 'Components/Modal/ModalContentPages'
}

const pages = 7

const Template: Story<ModalProps> = ({
  children = <>This is a modal!</>,
  ...args
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  const handleOnGoBackward = useCallback(() => {
    setCurrentPage((currentPage) => Math.max(currentPage - 1, 0))
  }, [setCurrentPage])
  const handleOnGoForward = useCallback(() => {
    setCurrentPage((currentPage) => Math.min(currentPage + 1, pages - 1))
  }, [setCurrentPage])
  const handleOnGoToPage = useCallback(() => {
    setCurrentPage(2)
  }, [setCurrentPage])

  return (
    <>
      <Button text='Click me' onClick={() => setIsOpen(true)} />
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader>
          <ModalTitle title={`Page ${currentPage + 1}`} />
        </ModalHeader>
        <ModalContentPages currentPage={currentPage}>
          <p>There was once a walrus named Rufus.</p>
          <p>Rufus had no friends</p>
          <p>Then Rufus met a hare.</p>
          <p>
            &quot;Hello, there!&quot; said the hare. &quot;My name is Sam!&quot;
          </p>
          <div>
            <p>
              &quot;I&apos;m Rufus,&quot; replied Rufus. &quot;Would you be my
              friend?&quot;
            </p>
            <p>
              &quot;Hmm. How am I to trust you Mr. Rufus?&quot; asked the hare
              inquistively. &quot;After all, we&apos;re not supposed to be
              friends, you and I.&quot;
            </p>
            <p>
              Rufus pondered this sadly. &quot;How am I going to make any
              friends if nobody even gives me a chance?&quot; he wondered aloud.
            </p>
            <p>The hare heard this as he was walking away. He turned around.</p>
            <p>
              &quot;Perhaps I was too hasty in my judgement,&quot; the hare
              conceded. &quot;I suppose you&apos;ll have to earn that
              trust.&quot;
            </p>
          </div>
          <p>And so they became friends.</p>
          <p>Then one day, Rufus ate Sam. The end</p>
        </ModalContentPages>
        <ModalFooter>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '8px',
              justifyContent: 'space-between'
            }}
          >
            <Button
              type={Type.COMMON_ALT}
              leftIcon={<IconArrowWhite style={{ transform: 'scaleX(-1)' }} />}
              onClick={handleOnGoBackward}
              text={'Back'}
            />
            <Button
              type={Type.COMMON_ALT}
              onClick={handleOnGoToPage}
              text={'Go to Page 3'}
            />
            <Button
              type={Type.COMMON_ALT}
              rightIcon={<IconArrowWhite />}
              onClick={handleOnGoForward}
              text={'Next'}
            />
          </div>
        </ModalFooter>
      </Modal>
    </>
  )
}

export const Base: any = Template.bind({})
