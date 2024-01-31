import { useState } from 'react'

import { Story } from '@storybook/react'

import { Button } from 'components/Button'
import { IconPlaylists } from 'components/Icons'

import { Modal } from './Modal'
import { ModalContent } from './ModalContent'
import { ModalFooter } from './ModalFooter'
import { ModalHeader, ModalTitle } from './ModalHeader'
import { ModalProps } from './types'

export default {
  component: Modal,
  title: 'Components/Modal'
}

const Template: Story<ModalProps> = ({
  children = <>This is a modal!</>,
  ...args
}) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <Button text='Click me' onClick={() => setIsOpen(true)} />
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </Modal>
    </>
  )
}

export const Composed: any = Template.bind({})

Composed.args = {
  children: (
    <>
      <ModalHeader>
        <ModalTitle
          icon={<IconPlaylists />}
          title='Example modal'
          subtitle='This is a ModalTitle component inside a ModalHeader component!'
        />
      </ModalHeader>
      <ModalContent>
        <p style={{ display: 'inline' }}>This is a ModalContent component.</p>
        <p>This is some extra text to make this example longer.</p>
        <p style={{ display: 'inline' }}>And here&apos;s another sentence.</p>
      </ModalContent>
      <ModalFooter>
        <Button text='Take action' />
      </ModalFooter>
    </>
  )
}

const LongContent = () => (
  <div>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Felis imperdiet proin
    fermentum leo vel. Cursus eget nunc scelerisque viverra mauris in aliquam.
    Tellus integer feugiat scelerisque varius morbi enim nunc faucibus. Tellus
    elementum sagittis vitae et leo. Vitae proin sagittis nisl rhoncus mattis.
    Ac odio tempor orci dapibus ultrices in. Malesuada bibendum arcu vitae
    elementum curabitur vitae nunc sed. Consectetur a erat nam at lectus urna
    duis. Feugiat sed lectus vestibulum mattis ullamcorper velit sed ullamcorper
    morbi. Consectetur libero id faucibus nisl tincidunt eget. At augue eget
    arcu dictum varius duis at. At auctor urna nunc id cursus metus aliquam
    eleifend mi. Placerat duis ultricies lacus sed turpis tincidunt id aliquet
    risus. A erat nam at lectus urna duis convallis. Tellus pellentesque eu
    tincidunt tortor aliquam nulla facilisi cras fermentum. Ac feugiat sed
    lectus vestibulum mattis ullamcorper velit sed.
    <br />
    <br />
    Pulvinar pellentesque habitant morbi tristique senectus et netus et. Enim ut
    sem viverra aliquet. Molestie at elementum eu facilisis sed odio morbi quis.
    Sed euismod nisi porta lorem. Leo a diam sollicitudin tempor id eu nisl
    nunc. Scelerisque in dictum non consectetur a erat nam at lectus. Sed
    blandit libero volutpat sed cras ornare. Odio eu feugiat pretium nibh ipsum
    consequat nisl vel pretium. Lorem ipsum dolor sit amet consectetur
    adipiscing elit ut aliquam. Suscipit tellus mauris a diam maecenas sed enim.
    Viverra mauris in aliquam sem. Leo urna molestie at elementum eu facilisis
    sed. Nisi est sit amet facilisis magna etiam tempor. Mollis aliquam ut
    porttitor leo a diam sollicitudin. Quis auctor elit sed vulputate mi sit
    amet mauris. Massa tincidunt nunc pulvinar sapien et. Scelerisque in dictum
    non consectetur a erat nam at lectus. In metus vulputate eu scelerisque
    felis. Scelerisque varius morbi enim nunc faucibus.
    <br />
    <br />
    Sed odio morbi quis commodo odio aenean sed adipiscing. Eu consequat ac
    felis donec et odio pellentesque. Ac odio tempor orci dapibus ultrices in
    iaculis. Varius duis at consectetur lorem. Platea dictumst quisque sagittis
    purus sit. Interdum varius sit amet mattis vulputate enim nulla. Odio
    pellentesque diam volutpat commodo sed egestas egestas. Elit scelerisque
    mauris pellentesque pulvinar pellentesque habitant morbi tristique. Turpis
    egestas pretium aenean pharetra magna ac placerat vestibulum lectus. Velit
    dignissim sodales ut eu sem integer vitae justo eget. Quis varius quam
    quisque id. Vitae tortor condimentum lacinia quis vel. Eu scelerisque felis
    imperdiet proin fermentum leo.
    <br />
    <br />
    Auctor urna nunc id cursus. At augue eget arcu dictum varius duis at.
    Imperdiet dui accumsan sit amet nulla. Augue ut lectus arcu bibendum at
    varius vel pharetra. Sodales neque sodales ut etiam. Scelerisque eu ultrices
    vitae auctor eu augue ut. Viverra aliquet eget sit amet tellus cras
    adipiscing enim eu. Tincidunt lobortis feugiat vivamus at augue eget arcu.
    Consequat ac felis donec et odio pellentesque diam volutpat. Ipsum consequat
    nisl vel pretium lectus quam id leo. Odio facilisis mauris sit amet massa
    vitae tortor condimentum lacinia. Ligula ullamcorper malesuada proin libero
    nunc. Tellus pellentesque eu tincidunt tortor aliquam nulla. Scelerisque
    fermentum dui faucibus in ornare quam viverra. Interdum consectetur libero
    id faucibus nisl tincidunt eget nullam. Eget velit aliquet sagittis id
    consectetur. Nibh tortor id aliquet lectus. Lorem ipsum dolor sit amet
    consectetur. Amet nisl purus in mollis.
    <br />
    <br />
    Malesuada nunc vel risus commodo viverra maecenas. Felis donec et odio
    pellentesque diam volutpat. Venenatis a condimentum vitae sapien
    pellentesque habitant morbi. Senectus et netus et malesuada fames ac turpis
    egestas. Tincidunt augue interdum velit euismod in pellentesque. Morbi
    blandit cursus risus at ultrices mi tempus imperdiet. Mauris in aliquam sem
    fringilla ut. Nunc pulvinar sapien et ligula ullamcorper malesuada proin
    libero nunc. Aenean vel elit scelerisque mauris. Pretium aenean pharetra
    magna ac placerat vestibulum lectus mauris ultrices. Pretium lectus quam id
    leo in vitae turpis massa sed.
  </div>
)
export const LotsOfContent: any = Template.bind({})
LotsOfContent.args = {
  children: (
    <>
      <ModalHeader>
        <ModalTitle title='A lot of content' />
      </ModalHeader>
      <ModalContent>
        <LongContent />
      </ModalContent>
      <ModalFooter>
        <Button text='Call to action'></Button>
      </ModalFooter>
    </>
  )
}

export const Base: any = Template.bind({})
