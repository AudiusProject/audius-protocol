import { Bio } from './Bio'
import { ProfileSocials } from './ProfileSocials'

type CollapsedSectionProps = {
  isExpansible: boolean
  setIsExpansible: (isExpansible: boolean) => void
}

export const CollapsedSection = (props: CollapsedSectionProps) => {
  return (
    <>
      <Bio numberOfLines={2} {...props} />
      <ProfileSocials />
    </>
  )
}
