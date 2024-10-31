import type { BioProps } from './Bio'
import { Bio } from './Bio'
import { ProfileSocials } from './ProfileSocials'

type CollapsedSectionProps = Pick<BioProps, 'isExpandable' | 'setIsExpandable'>

export const CollapsedSection = (props: CollapsedSectionProps) => {
  return (
    <>
      <Bio numberOfLines={2} {...props} />
      <ProfileSocials />
    </>
  )
}
