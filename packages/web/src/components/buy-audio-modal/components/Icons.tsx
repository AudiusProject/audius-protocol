import IconAUDIOSrc from 'assets/img/iconAUDIO.png'
import IconSOLSrc from 'assets/img/iconSOL.png'
import IconUSDSrc from 'assets/img/iconUSD.png'

const Icon = ({ src, alt }: { src: string; alt: string }) => {
  return <img src={src} alt={alt} width={24} height={24} />
}

export const IconAUDIO = () => {
  return <Icon src={IconAUDIOSrc} alt={'AUDIO Token Icon'} />
}

export const IconSOL = () => {
  return <Icon src={IconSOLSrc} alt={'SOL Token Icon'} />
}

export const IconUSD = () => {
  return <Icon src={IconUSDSrc} alt={'USD Logo'} />
}
