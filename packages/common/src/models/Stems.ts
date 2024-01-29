import { Track } from 'models/Track'
import { StemCategory } from './StemCategory'

export const stemCategoryFriendlyNames = {
  [StemCategory.INSTRUMENTAL]: 'Instrumental',
  [StemCategory.LEAD_VOCALS]: 'Lead Vocals / A Capella',
  [StemCategory.MELODIC_LEAD]: 'Melodic Lead',
  [StemCategory.PAD]: 'Pad',
  [StemCategory.SNARE]: 'Snare',
  [StemCategory.KICK]: 'Kick',
  [StemCategory.HIHAT]: 'Hi-Hat',
  [StemCategory.PERCUSSION]: 'Percussion',
  [StemCategory.SAMPLE]: 'Sample',
  [StemCategory.BACKING_VOX]: 'Back Vocals / Ad-Libs',
  [StemCategory.BASS]: 'Bass',
  [StemCategory.OTHER]: 'Other'
}

export type StemUpload = {
  metadata: Track
  category: StemCategory
  allowDelete: boolean
  allowCategorySwitch: boolean
}

export type StemUploadWithFile = StemUpload & {
  file: File
}
