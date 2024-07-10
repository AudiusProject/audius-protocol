import { Mood } from '@audius/sdk'

export const moodMap: Record<Mood, JSX.Element> = {
  Peaceful: (
    <span>
      Peaceful <i className='emoji dove-of-peace' />
    </span>
  ),
  Romantic: (
    <span>
      Romantic <i className='emoji heart-with-arrow' />
    </span>
  ),
  Sentimental: (
    <span>
      Sentimental <i className='emoji crying-face' />
    </span>
  ),
  Tender: (
    <span>
      Tender <i className='emoji relieved-face' />
    </span>
  ),
  Easygoing: (
    <span>
      Easygoing <i className='emoji slightly-smiling-face' />
    </span>
  ),
  Yearning: (
    <span>
      Yearning <i className='emoji eyes' />
    </span>
  ),
  Sophisticated: (
    <span>
      Sophisticated <i className='emoji face-with-monocle' />
    </span>
  ),
  Sensual: (
    <span>
      Sensual <i className='emoji face-throwing-a-kiss' />
    </span>
  ),
  Cool: (
    <span>
      Cool <i className='emoji smiling-face-with-sunglasses' />
    </span>
  ),
  Gritty: (
    <span>
      Gritty <i className='emoji pouting-face' />
    </span>
  ),
  Melancholy: (
    <span>
      Melancholy <i className='emoji cloud-with-rain' />
    </span>
  ),
  Serious: (
    <span>
      Serious <i className='emoji neutral-face' />
    </span>
  ),
  Brooding: (
    <span>
      Brooding <i className='emoji thinking-face' />
    </span>
  ),
  Fiery: (
    <span>
      Fiery <i className='emoji fire' />
    </span>
  ),
  Defiant: (
    <span>
      Defiant <i className='emoji smiling-face-with-horns' />
    </span>
  ),
  Aggressive: (
    <span>
      Aggressive{' '}
      <i className='emoji serious-face-with-symbols-covering-mouth' />
    </span>
  ),
  Rowdy: (
    <span>
      Rowdy <i className='emoji face-with-cowboy-hat' />
    </span>
  ),
  Excited: (
    <span>
      Excited <i className='emoji party-popper' />
    </span>
  ),
  Energizing: (
    <span>
      Energizing <i className='emoji grinning-face-with-star-eyes' />
    </span>
  ),
  Empowering: (
    <span>
      Empowering <i className='emoji flexed-biceps' />
    </span>
  ),
  Stirring: (
    <span>
      Stirring <i className='emoji astonished-face' />
    </span>
  ),
  Upbeat: (
    <span>
      Upbeat <i className='emoji person-raising-both-hands-in-celebration' />
    </span>
  ),
  Other: (
    <span>
      Other <i className='emoji shrug' />
    </span>
  )
}
