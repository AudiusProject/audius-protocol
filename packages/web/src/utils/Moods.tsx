import { Flex } from '@audius/harmony'
import { Mood } from '@audius/sdk'

export const moodMap: Record<Mood, JSX.Element> = {
  Peaceful: (
    <Flex alignItems='center' gap='xs'>
      Peaceful <i className='emoji dove-of-peace' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Romantic: (
    <Flex alignItems='center' gap='xs'>
      Romantic{' '}
      <i className='emoji heart-with-arrow' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Sentimental: (
    <Flex alignItems='center' gap='xs'>
      Sentimental{' '}
      <i className='emoji crying-face' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Tender: (
    <Flex alignItems='center' gap='xs'>
      Tender <i className='emoji relieved-face' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Easygoing: (
    <Flex alignItems='center' gap='xs'>
      Easygoing{' '}
      <i className='emoji slightly-smiling-face' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Yearning: (
    <Flex alignItems='center' gap='xs'>
      Yearning <i className='emoji eyes' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Sophisticated: (
    <Flex alignItems='center' gap='xs'>
      Sophisticated{' '}
      <i className='emoji face-with-monocle' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Sensual: (
    <Flex alignItems='center' gap='xs'>
      Sensual{' '}
      <i className='emoji face-throwing-a-kiss' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Cool: (
    <Flex alignItems='center' gap='xs'>
      Cool{' '}
      <i
        className='emoji smiling-face-with-sunglasses'
        style={{ marginBottom: 0 }}
      />
    </Flex>
  ),
  Gritty: (
    <Flex alignItems='center' gap='xs'>
      Gritty <i className='emoji pouting-face' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Melancholy: (
    <Flex alignItems='center' gap='xs'>
      Melancholy{' '}
      <i className='emoji cloud-with-rain' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Serious: (
    <Flex alignItems='center' gap='xs'>
      Serious <i className='emoji neutral-face' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Brooding: (
    <Flex alignItems='center' gap='xs'>
      Brooding <i className='emoji thinking-face' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Fiery: (
    <Flex alignItems='center' gap='xs'>
      Fiery <i className='emoji fire' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Defiant: (
    <Flex alignItems='center' gap='xs'>
      Defiant{' '}
      <i
        className='emoji smiling-face-with-horns'
        style={{ marginBottom: 0 }}
      />
    </Flex>
  ),
  Aggressive: (
    <Flex alignItems='center' gap='xs'>
      Aggressive{' '}
      <i
        className='emoji serious-Flex-with-symbols-covering-mouth'
        style={{ marginBottom: 0 }}
      />
    </Flex>
  ),
  Rowdy: (
    <Flex alignItems='center' gap='xs'>
      Rowdy{' '}
      <i className='emoji face-with-cowboy-hat' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Excited: (
    <Flex alignItems='center' gap='xs'>
      Excited <i className='emoji party-popper' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Energizing: (
    <Flex alignItems='center' gap='xs'>
      Energizing{' '}
      <i
        className='emoji grinning-face-with-star-eyes'
        style={{ marginBottom: 0 }}
      />
    </Flex>
  ),
  Empowering: (
    <Flex alignItems='center' gap='xs'>
      Empowering{' '}
      <i className='emoji flexed-biceps' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Stirring: (
    <Flex alignItems='center' gap='xs'>
      Stirring{' '}
      <i className='emoji astonished-face' style={{ marginBottom: 0 }} />
    </Flex>
  ),
  Upbeat: (
    <Flex alignItems='center' gap='xs'>
      Upbeat{' '}
      <i
        className='emoji person-raising-both-hands-in-celebration'
        style={{ marginBottom: 0 }}
      />
    </Flex>
  ),
  Other: (
    <Flex alignItems='center' gap='xs'>
      Other <i className='emoji shrug' style={{ marginBottom: 0 }} />
    </Flex>
  )
}
