import { Text, TextProps, useTheme } from '@audius/harmony'

export const GroupHeader = (props: TextProps) => {
  const { spacing, motion } = useTheme()
  return (
    <Text
      tag='h3'
      variant='label'
      color='subdued'
      size='l'
      strength='strong'
      css={{
        paddingLeft: spacing.unit7,
        transition: `color ${motion.quick}`
      }}
      {...props}
    />
  )
}
