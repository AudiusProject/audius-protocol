import { Text, TextProps, motion, spacing } from '@audius/harmony'

export const GroupHeader = (props: TextProps) => {
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
