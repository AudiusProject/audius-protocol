import dayjs from 'dayjs'

const FORMAT = 'YYYY-MM-DD hh:mm:ss A'
const FORMAT_LONG_UTC = 'YYYY-MM-DDThh:mm:ss:SSS[Z]'
export type TimelineItem = {
  datetime: dayjs.Dayjs
  content: string // TODO: Add content-collapsible to show details like diff of shards stored or num files rebalanced
  icon: JSX.Element
  iconBg: string
}

export default function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) return <></>
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
                  <div className="group relative flex flex-col items-center whitespace-nowrap text-right text-sm text-gray-500 dark:text-white">
                    <time dateTime={event.datetime.toISOString()}>
                      {event.datetime.format(FORMAT)}
                    </time>
                    <div className="absolute bottom-0 mb-6 hidden flex-col items-center group-hover:flex">
                      <span className="whitespace-no-wrap relative z-10 bg-black p-2 text-xs leading-none text-white shadow-lg">
                        {event.datetime.utc().format(FORMAT_LONG_UTC)}
                      </span>
                      <div className="-mt-2 h-3 w-3 rotate-45 bg-black"></div>
                    </div>
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
