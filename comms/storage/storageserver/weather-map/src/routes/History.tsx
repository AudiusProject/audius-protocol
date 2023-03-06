import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useStatusUpdateLogs } from '../api'
import DateTimePicker from '../components/dateTimePicker/DateTimePicker'

const FORMAT = 'YYYY-MM-DD hh:mm:ss A'
type TimelineItem = {
  datetime: dayjs.Dayjs
  content: string // TODO: Add content-collapsible to show details like diff of shards stored or num files rebalanced
  icon: JSX.Element
  iconBg: string
}

// TODO: Add events: updateHealthyNodeSet, rebalanceStart, rebalanceEnd
// TODO: Add select dropdowns to filter by node
// TODO: Make time hoverable to show UTC

export default function History() {
  const [searchParams] = useSearchParams()
  const [numEntries, setNumEntries] = useState(100)
  const [numHoursAgo, setNumHoursAgo] = useState(0.1)
  const [showDateTimePicker, setShowDateTimePicker] = useState(false)
  const {
    isLoading,
    error,
    data: statusUpdateLogs,
  } = useStatusUpdateLogs(numEntries, numHoursAgo)
  const [timeline, setTimeline] = useState([] as TimelineItem[])

  useEffect(() => {
    for (const [key, val] of searchParams.entries()) {
      if (key === 'numEntries') {
        const newNumEntries = parseInt(val)
        if (newNumEntries !== numEntries) setNumEntries(newNumEntries)
      } else if (key === 'since') {
        const sinceDate = dayjs(val)
        if (sinceDate.isValid()) {
          setNumHoursAgo(dayjs().diff(sinceDate, 'hour'))
        }
      }
    }
  }, [searchParams])

  useEffect(() => {
    const newTimeline = []
    if (statusUpdateLogs) {
      for (const statusUpdateLog of statusUpdateLogs) {
        newTimeline.push({
          datetime: dayjs(statusUpdateLog.lastOk),
          content: `${statusUpdateLog.host} OK (shards: ${statusUpdateLog.shards.join(
            ', ',
          )})`,
          icon: <HandThumbUpIcon />,
          iconBg: 'bg-purple-500',
        })
      }
    }
    setTimeline(newTimeline)
  }, [statusUpdateLogs]) // TODO: Add other dependencies to re-update timeline

  const handleChange = (selectedDate: dayjs.Dayjs) => {
    setNumHoursAgo(dayjs().diff(selectedDate, 'hour', true))
  }

  return (
    <>
      <div className="flex w-full justify-center text-center dark:text-white">
        <span className="mx-2 flex items-center">Show</span>
        <label htmlFor="numEntries" className="sr-only">
          Number of events
        </label>
        <div>
          <input
            type="number"
            name="numEntries"
            id="numEntries"
            className="block w-20 rounded-lg border border-gray-300 bg-gray-50 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-purple-500  dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-purple-500 dark:focus:ring-purple-500"
            value={numEntries}
            onChange={(e) => setNumEntries(parseInt(e.target.value))}
          />
        </div>
        <span className="mx-2 flex items-center">events starting at</span>
        <DateTimePicker
          onChange={handleChange}
          show={showDateTimePicker}
          setShow={(show) => setShowDateTimePicker(show)}
          defaultDate={dayjs().subtract(numHoursAgo, 'hour')}
        />
      </div>
      <br />
      {isLoading && <div className="dark:text-white">Loading status update logs...</div>}
      {error && (
        <div className="dark:text-white">
          Error fetching status update logs: ${JSON.stringify(error)}
        </div>
      )}
      <div className="flow-root">
        <ul className="-mb-8">
          {timeline.map((event, eventIdx) => (
            <li key={event.datetime.toISOString()}>
              <div className="relative pb-8">
                {eventIdx !== timeline.length - 1 ? (
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
    </>
  )
}

function HandThumbUpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 text-white"
      aria-hidden="true"
    >
      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
    </svg>
  )
}
