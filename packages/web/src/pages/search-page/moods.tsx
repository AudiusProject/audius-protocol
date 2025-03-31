import { Mood } from '@audius/sdk'

import { MoodInfo } from './types'

export const MOODS: Record<Mood, MoodInfo> = {
  Peaceful: {
    label: Mood.PEACEFUL,
    value: Mood.PEACEFUL,
    icon: <i className='emoji dove-of-peace' />
  },
  Romantic: {
    label: Mood.ROMANTIC,
    value: Mood.ROMANTIC,
    icon: <i className='emoji heart-with-arrow' />
  },
  Sentimental: {
    label: Mood.SENTIMENTAL,
    value: Mood.SENTIMENTAL,
    icon: <i className='emoji crying-face' />
  },
  Tender: {
    label: Mood.TENDER,
    value: Mood.TENDER,
    icon: <i className='emoji relieved-face' />
  },
  Easygoing: {
    label: Mood.EASYGOING,
    value: Mood.EASYGOING,
    icon: <i className='emoji slightly-smiling-face' />
  },
  Yearning: {
    label: Mood.YEARNING,
    value: Mood.YEARNING,
    icon: <i className='emoji eyes' />
  },
  Sophisticated: {
    label: Mood.SOPHISTICATED,
    value: Mood.SOPHISTICATED,
    icon: <i className='emoji face-with-monocle' />
  },
  Sensual: {
    label: Mood.SENSUAL,
    value: Mood.SENSUAL,
    icon: <i className='emoji face-throwing-a-kiss' />
  },
  Cool: {
    label: Mood.COOL,
    value: Mood.COOL,
    icon: <i className='emoji smiling-face-with-sunglasses' />
  },
  Gritty: {
    label: Mood.GRITTY,
    value: Mood.GRITTY,
    icon: <i className='emoji pouting-face' />
  },
  Melancholy: {
    label: Mood.MELANCHOLY,
    value: Mood.MELANCHOLY,
    icon: <i className='emoji cloud-with-rain' />
  },
  Serious: {
    label: Mood.SERIOUS,
    value: Mood.SERIOUS,
    icon: <i className='emoji neutral-face' />
  },
  Brooding: {
    label: Mood.BROODING,
    value: Mood.BROODING,
    icon: <i className='emoji thinking-face' />
  },
  Fiery: {
    label: Mood.FIERY,
    value: Mood.FIERY,
    icon: <i className='emoji fire' />
  },
  Defiant: {
    label: Mood.DEFIANT,
    value: Mood.DEFIANT,
    icon: <i className='emoji smiling-face-with-horns' />
  },
  Aggressive: {
    label: Mood.AGGRESSIVE,
    value: Mood.AGGRESSIVE,
    icon: <i className='emoji serious-face-with-symbols-covering-mouth' />
  },
  Rowdy: {
    label: Mood.ROWDY,
    value: Mood.ROWDY,
    icon: <i className='emoji face-with-cowboy-hat' />
  },
  Excited: {
    label: Mood.EXCITED,
    value: Mood.EXCITED,
    icon: <i className='emoji party-popper' />
  },
  Energizing: {
    label: Mood.ENERGIZING,
    value: Mood.ENERGIZING,
    icon: <i className='emoji grinning-face-with-star-eyes' />
  },
  Empowering: {
    label: Mood.EMPOWERING,
    value: Mood.EMPOWERING,
    icon: <i className='emoji flexed-biceps' />
  },
  Stirring: {
    label: Mood.STIRRING,
    value: Mood.STIRRING,
    icon: <i className='emoji astonished-face' />
  },
  Upbeat: {
    label: Mood.UPBEAT,
    value: Mood.UPBEAT,
    icon: <i className='emoji person-raising-both-hands-in-celebration' />
  },
  Other: {
    label: Mood.OTHER,
    value: Mood.OTHER,
    icon: <i className='emoji shrug' />
  }
}
