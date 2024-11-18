import {
  IconPlay,
  IconPause,
  PlainButton,
  Flex,
  Button,
  IconArrowUpToLine,
  IconReceive
} from '@audius/harmony'

type FileReplaceContainerProps = {
  fileName: string
  downloadEnabled?: boolean
  isPlaying?: boolean
  onTogglePlay?: () => void
  onClickReplace?: () => void
  onClickDownload?: () => void
}

export const FileReplaceContainer = ({
  fileName,
  downloadEnabled,
  isPlaying,
  onTogglePlay,
  onClickReplace,
  onClickDownload
}: FileReplaceContainerProps) => {
  return (
    <Flex justifyContent='space-between' alignItems='center' gap='l'>
      <PlainButton
        iconLeft={isPlaying ? IconPause : IconPlay}
        onClick={onTogglePlay}
      >
        {fileName}
      </PlainButton>
      <Flex gap='s'>
        <Button
          variant='secondary'
          size='small'
          iconLeft={IconArrowUpToLine}
          onClick={onClickReplace}
        >
          Replace
        </Button>
        {downloadEnabled ? (
          <Button
            variant='secondary'
            size='small'
            iconLeft={IconReceive}
            onClick={onClickDownload}
          >
            Download
          </Button>
        ) : null}
      </Flex>
    </Flex>
  )
}
