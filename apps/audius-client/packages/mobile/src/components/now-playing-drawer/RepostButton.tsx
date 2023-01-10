import IconRepostOffLight from 'app/assets/animations/iconRepostOffLight.json'
import IconRepostOnLight from 'app/assets/animations/iconRepostOnLight.json'
import type { AnimatedButtonProps } from 'app/components/core'
import { AnimatedButton } from 'app/components/core'
import { makeAnimations } from 'app/styles'
import { colorize } from 'app/utils/colorizeLottie'

const useAnimations = makeAnimations(({ palette }) => {
  const { neutral, primary } = palette

  const ColorizedRepostOnIcon = colorize(IconRepostOnLight, {
    // iconRepost Outlines Comp 1.iconRepost Outlines.Group 1.Fill 1
    'assets.0.layers.0.shapes.0.it.3.c.k.0.s': neutral,
    // iconRepost Outlines Comp 1.iconRepost Outlines.Group 1.Fill 1
    'assets.0.layers.0.shapes.0.it.3.c.k.1.s': primary
  })

  const ColorizedRepostOffIcon = colorize(IconRepostOffLight, {
    // iconRepost Outlines Comp 2.iconRepost Outlines.Group 1.Fill 1
    'assets.0.layers.0.shapes.0.it.3.c.k.0.s': primary,
    // iconRepost Outlines Comp 2.iconRepost Outlines.Group 1.Fill 1
    'assets.0.layers.0.shapes.0.it.3.c.k.1.s': neutral
  })

  return [ColorizedRepostOnIcon, ColorizedRepostOffIcon]
})

type RepostButtonProps = Omit<AnimatedButtonProps, 'iconJSON'>

export const RepostButton = (props: RepostButtonProps) => {
  const { iconIndex } = props
  const animations = useAnimations()

  return (
    <AnimatedButton
      {...props}
      haptics={iconIndex === 0}
      iconJSON={animations}
    />
  )
}
