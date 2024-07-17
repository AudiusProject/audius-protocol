export const visibilityMessages = {
  title: 'Visibility',
  description:
    'Change the visibility of this release or schedule it to release in the future.',
  public: 'Public',
  publicDescription: 'Visible to everyone on Audius.',
  hidden: 'Hidden',
  hiddenDescription:
    'Only you and people you share a direct link with will be able to listen.',
  scheduledRelease: 'Scheduled Release',
  scheduledReleaseDescription:
    'Select the date and time this will become public.',
  hiddenHint: (entityType: 'track' | 'album' | 'playlist') =>
    `You can’t make a public ${entityType} hidden`,
  dateLabel: 'Release Date',
  timeLabel: 'Time',
  futureReleaseHint: (timezone: string) =>
    `This will be released at the selected date/time in your local timezone (${timezone}).`
}
