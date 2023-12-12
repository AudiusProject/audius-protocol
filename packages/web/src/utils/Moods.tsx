import { Mood } from '@audius/sdk'

export const moodMap: Record<Mood, JSX.Element> = {
  Peaceful: (
    <div>
      Peaceful <i className='emoji dove-of-peace' />
    </div>
  ),
  Romantic: (
    <div>
      Romantic <i className='emoji heart-with-arrow' />
    </div>
  ),
  Sentimental: (
    <div>
      Sentimental <i className='emoji crying-face' />
    </div>
  ),
  Tender: (
    <div>
      Tender <i className='emoji relieved-face' />
    </div>
  ),
  Easygoing: (
    <div>
      Easygoing <i className='emoji slightly-smiling-face' />
    </div>
  ),
  Yearning: (
    <div>
      Yearning <i className='emoji eyes' />
    </div>
  ),
  Sophisticated: (
    <div>
      Sophisticated <i className='emoji face-with-monocle' />
    </div>
  ),
  Sensual: (
    <div>
      Sensual <i className='emoji face-throwing-a-kiss' />
    </div>
  ),
  Cool: (
    <div>
      Cool <i className='emoji smiling-face-with-sunglasses' />
    </div>
  ),
  Gritty: (
    <div>
      Gritty <i className='emoji pouting-face' />
    </div>
  ),
  Melancholy: (
    <div>
      Melancholy <i className='emoji cloud-with-rain' />
    </div>
  ),
  Serious: (
    <div>
      Serious <i className='emoji neutral-face' />
    </div>
  ),
  Brooding: (
    <div>
      Brooding <i className='emoji thinking-face' />
    </div>
  ),
  Fiery: (
    <div>
      Fiery <i className='emoji fire' />
    </div>
  ),
  Defiant: (
    <div>
      Defiant <i className='emoji smiling-face-with-horns' />
    </div>
  ),
  Aggressive: (
    <div>
      Aggressive{' '}
      <i className='emoji serious-face-with-symbols-covering-mouth' />
    </div>
  ),
  Rowdy: (
    <div>
      Rowdy <i className='emoji face-with-cowboy-hat' />
    </div>
  ),
  Excited: (
    <div>
      Excited <i className='emoji party-popper' />
    </div>
  ),
  Energizing: (
    <div>
      Energizing <i className='emoji grinning-face-with-star-eyes' />
    </div>
  ),
  Empowering: (
    <div>
      Empowering <i className='emoji flexed-biceps' />
    </div>
  ),
  Stirring: (
    <div>
      Stirring <i className='emoji astonished-face' />
    </div>
  ),
  Upbeat: (
    <div>
      Upbeat <i className='emoji person-raising-both-hands-in-celebration' />
    </div>
  ),
  Other: (
    <div>
      Other <i className='emoji shrug' />
    </div>
  )
}
