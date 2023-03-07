import dayjs from 'dayjs'

const FORMAT = 'YYYY-MM-DD hh:mm:ss A'
export type TimelineItem = {
  datetime: dayjs.Dayjs
  content: string // TODO: Add content-collapsible to show details like diff of shards stored or num files rebalanced
  icon: JSX.Element
  iconBg: string
}

export default function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) return <></>
  items = [
    {
      datetime: dayjs(),
      content:
        'There are likely more logs after this - choose a more recent time or increase the number of events above to view them',
      icon: <InfoIcon />,
      iconBg: 'bg-yellow-400',
    },
    ...items,
  ]
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {items.map((event, eventIdx) => (
          <li key={eventIdx}>
            <div className="relative pb-8">
              {eventIdx !== items.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`${event.iconBg} flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900`}
                  >
                    {event.icon}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-white">
                      {event.content}{' '}
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-white">
                    <time dateTime={event.datetime.toISOString()}>
                      {event.datetime.format(FORMAT)}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5 text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  )
}
