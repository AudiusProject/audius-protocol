import AudiusLogoHorizontal from '../../assets/img/audiusLogoHorizontal.svg'
import { getCopyableLink } from '../../util/shareUtil'

import Button from './Button'

const AudiusLogoButton = () => {
  const onClick = () => window.open(getCopyableLink(), '_blank')

  return <Button onClick={onClick} icon={<AudiusLogoHorizontal />} />
}

export default AudiusLogoButton
