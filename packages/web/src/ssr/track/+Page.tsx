import type { MomentInput } from 'moment'
import moment from 'moment'
import { Suspense } from 'react'
import { moodMap } from 'utils/Moods'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR

export const formatSeconds = (seconds: number): string => {
  const time = moment.utc(moment.duration(seconds, 'seconds').asMilliseconds())
  if (seconds > SECONDS_PER_HOUR) {
    return time.format('h:mm:ss')
  }
  return time.format('m:ss')
}

export const formatSecondsAsText = (seconds: number): string => {
  const d = moment.duration(seconds, 'seconds')
  if (seconds > SECONDS_PER_HOUR) {
    return `${d.hours()}h ${d.minutes()}m`
  }
  return `${d.minutes()}m ${d.seconds()}s`
}

export const formatLineupTileDuration = (
  seconds: number,
  isLongFormContent = false
) => {
  if (!isLongFormContent && seconds < SECONDS_PER_HOUR) {
    return formatSeconds(seconds)
  }
  const d = moment.duration(seconds, 'seconds')
  const hourText = d.hours() > 0 ? `${d.hours()}hr ` : ''
  // Ceiling the minute value
  const minuteText = `${
    d.seconds() > 0 && d.minutes() < 59 ? d.minutes() + 1 : d.minutes()
  }m`

  return `${hourText}${minuteText}`
}

export const formatDate = (date: MomentInput, format?: string): string => {
  return moment(date, format).format('MM/DD/YY')
}

export default function render(props: { track: any }) {
  const { track } = props

  return (
    <>
      <Suspense fallback={null}>
        <div className='_root_x4nci_7'>
          <div className='_root_1k0zk_1'></div>
          <div className='_app_x4nci_15'>
            <div className='_notice_1uvhn_1'>
              <div className='_content_1uvhn_30'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  className='_iconRemove_1uvhn_49'
                >
                  <g fill='none' fill-rule='evenodd'>
                    <rect width='24' height='24'></rect>
                    <path
                      d='M8.332 6.313L12 9.98l3.668-3.667a1 1 0 011.414 0l.605.605a1 1 0 010 1.414L14.02 12l3.667 3.668a1 1 0 010 1.414l-.605.605a1 1 0 01-1.414 0L12 14.02l-3.668 3.667a1 1 0 01-1.414 0l-.605-.605a1 1 0 010-1.414L9.98 12 6.313 8.332a1 1 0 010-1.414l.605-.605a1 1 0 011.414 0z'
                      fill='currentColor'
                    ></path>
                  </g>
                </svg>
              </div>
            </div>
            <div className='_navWrapper_1r2qq_1 _leftNavWrapper_1r2qq_7'>
              <nav id='leftNav' className='_leftNav_115hk_1'>
                <div className='_header_wllso_1'>
                  <a aria-label='Go to Home' href='/'>
                    <svg
                      width='93px'
                      height='24px'
                      viewBox='0 0 93 24'
                      xmlns='http://www.w3.org/2000/svg'
                      xmlnsXlink='http://www.w3.org/1999/xlink'
                      className='_logo_wllso_12'
                    >
                      <linearGradient
                        id='matrixHeaderGradient'
                        gradientTransform='rotate(323)'
                        height='100%'
                        width='100%'
                      >
                        <stop offset='0%' stop-color='#4FF069'></stop>
                        <stop offset='100%' stop-color='#09BD51'></stop>
                      </linearGradient>
                      <g
                        id='\uD83D\uDED1-Symbols'
                        stroke='none'
                        stroke-width='1'
                        fill='none'
                        fill-rule='evenodd'
                      >
                        <g
                          id='components/global/sidebar'
                          transform='translate(-35.000000, -16.000000)'
                          fill='#858199'
                        >
                          <g
                            id='audius-logo'
                            transform='translate(32.000000, 16.000000)'
                          >
                            <path
                              d='M88.5219554,14.9685213 L89.8349657,13.4196181 C90.6738291,14.0799535 91.6100512,14.4281858 92.5947697,14.4281858 C93.226896,14.4281858 93.5673119,14.2120826 93.5673119,13.8518761 L93.5673119,13.8278245 C93.5673119,13.4796439 93.2876734,13.2875923 92.1327469,13.0233858 C90.3213936,12.6151277 88.9232531,12.1108697 88.9232531,10.381889 L88.9232531,10.357889 C88.9232531,8.79696 90.1754861,7.66834065 92.217877,7.66834065 C93.6645139,7.66834065 94.7951922,8.0525471 95.7191334,8.78493419 L94.5399064,10.4298374 C93.7618726,9.88960516 92.9107806,9.60139871 92.1570996,9.60139871 C91.5856984,9.60139871 91.3059554,9.84160516 91.3059554,10.1417342 L91.3059554,10.1656826 C91.3059554,10.5499406 91.5977703,10.7180439 92.7771018,10.9822503 C94.7343625,11.402431 95.9501709,12.0267923 95.9501709,13.5996955 L95.9501709,13.6236955 C95.9501709,15.3407535 94.5763832,16.3612955 92.5096919,16.3612955 C91.0020686,16.3612955 89.5675035,15.8930116 88.5219554,14.9685213 Z M76.8785873,12.5311226 L76.8785873,7.81236129 L79.2735181,7.81236129 L79.2735181,12.4830194 C79.2735181,13.6957161 79.8935726,14.2720774 80.8419188,14.2720774 C81.790056,14.2720774 82.4101627,13.7197677 82.4101627,12.5430452 L82.4101627,7.81236129 L84.8051458,7.81236129 L84.8051458,12.4710452 C84.8051458,15.1846452 83.2368496,16.3733419 80.817566,16.3733419 C78.3982302,16.3733419 76.8785873,15.1605935 76.8785873,12.5311226 Z M69.9981622,16.2172387 L69.9981622,7.8123871 L72.3687926,7.8123871 L72.3687926,16.2172387 L69.9981622,16.2172387 Z M61.0279473,14.1520361 C62.4381596,14.1520361 63.3743817,13.3835716 63.3743817,12.0267716 L63.3743817,12.0027716 C63.3743817,10.658049 62.4381596,9.87761032 61.0279473,9.87761032 L60.0675292,9.87761032 L60.0675292,14.1520361 L61.0279473,14.1520361 Z M57.709023,7.81237161 L60.9915227,7.81237161 C64.030913,7.81237161 65.7936653,9.54135226 65.7936653,11.9667458 L65.7936653,11.9907974 C65.7936653,14.416191 64.0065603,16.2172232 60.942974,16.2172232 L57.709023,16.2172232 L57.709023,7.81237161 Z M45.2839682,12.5311226 L45.2839682,7.81236129 L47.6789513,7.81236129 L47.6789513,12.4830194 C47.6789513,13.6957161 48.2990058,14.2720774 49.2471952,14.2720774 C50.1954892,14.2720774 50.8155436,13.7197677 50.8155436,12.5430452 L50.8155436,7.81236129 L53.2105267,7.81236129 L53.2105267,12.4710452 C53.2105267,15.1846452 51.6421783,16.3733419 49.2228425,16.3733419 C46.8036634,16.3733419 45.2839682,15.1605935 45.2839682,12.5311226 Z M38.2407769,12.9033497 L37.292483,10.5139303 L36.3321171,12.9033497 L38.2407769,12.9033497 Z M36.1740856,7.75233032 L38.4474617,7.75233032 L42.0703251,16.2172077 L39.5416109,16.2172077 L38.9216087,14.7163561 L35.6391612,14.7163561 L35.0313354,16.2172077 L32.5512222,16.2172077 L36.1740856,7.75233032 Z M27.6589169,23.0107097 C27.9131575,23.446271 27.5946905,23.9903742 27.0855299,23.9900645 L20.46639,23.985729 L13.8603149,23.9814452 L8.5624945,23.9779355 C8.05343843,23.9775742 7.73565073,23.4331613 7.99046619,22.9979097 L10.54855,18.628671 C10.6668124,18.4266581 10.8852033,18.302271 11.1214667,18.3024258 L17.1330944,18.3064 C17.583777,18.3066581 17.8847895,17.8803871 17.7715963,17.4803355 C17.7569637,17.4284645 17.735642,17.3770581 17.7064814,17.3270452 L17.1970073,16.4541677 L14.4412272,11.732929 C14.2029779,11.3247226 13.6291728,11.2987097 13.3482278,11.6552516 C13.3294145,11.6792 13.3118554,11.7048 13.2958119,11.7322065 L12.889654,12.4259355 L10.2336366,16.9625032 C10.1153742,17.1644645 9.89693108,17.2888516 9.66071987,17.2886968 L4.55040523,17.2853419 C4.0412969,17.2849806 3.7235092,16.7405677 3.97832466,16.3053161 L6.68325661,11.6852387 L13.3034417,0.377832258 C13.5582572,-0.0574193548 14.1946164,-0.0570064516 14.448857,0.378554839 L17.9559665,6.38717419 L21.053887,11.6946323 L27.6589169,23.0107097 Z'
                              id='Audius-Logo'
                            ></path>
                          </g>
                        </g>
                      </g>
                    </svg>
                  </a>
                </div>
              </nav>
            </div>
            <div
              id='mainContent'
              role='main'
              className='_mainContentWrapper_x4nci_39'
            >
              <Suspense fallback={null}>
                <div style={{ opacity: 1 }} className='_pageContainer_28vz5_1'>
                  <div className='_flush_28vz5_16 _medium_28vz5_26'>
                    <div id='page' className='_pageContent_28vz5_21'>
                      <div className='_headerWrapper_61pkg_5'>
                        <div className='_coverPhoto_xiyp7_1'>
                          <div
                            className='_wrapper_1jw80_1 _photo_xiyp7_11 harmony-4evp1l-Box-DynamicImage eayk8g40'
                            role='img'
                          >
                            <div className='_image_1jw80_18'></div>
                            <div className='_image_1jw80_18'></div>
                            <div className='_children_1jw80_8'>
                              <div className='_spinner_xiyp7_28'></div>
                            </div>
                          </div>
                          <div className='_button_xiyp7_33'></div>
                        </div>
                        <div className='_wrapper_349l6_1'></div>
                        <div className='_wrapper_11rda_1'>
                          <div className='_background_11rda_8'></div>
                        </div>
                      </div>
                      <div className='_contentWrapper_61pkg_12'>
                        <div className='_root_1e46i_1 _large_1e46i_65 _mid_1e46i_47 _giantTrackTile_hvx6q_1'>
                          <div className='_topSection_hvx6q_9'>
                            <div className='_giantArtwork_1jqug_1'>
                              <div
                                className='_wrapper_1jw80_1 _imageWrapper_1jqug_9 harmony-4evp1l-Box-DynamicImage eayk8g40'
                                role='img'
                              >
                                <div
                                  className='_skeleton_1nj60_1 _skeleton_1jw80_29'
                                  aria-busy='true'
                                ></div>
                                <div className='_image_1jw80_18'></div>
                                <div className='_image_1jw80_18'></div>
                              </div>
                            </div>
                            <div className='_infoSection_hvx6q_20'>
                              <div className='_infoSectionHeader_hvx6q_34'>
                                <div className='_titleSmall_16dc6_122 _titleWeak_16dc6_133 _headerContainer_hvx6q_385 _show_hvx6q_401'>
                                  <div className='_typeLabel_hvx6q_40'>
                                    TRACK
                                  </div>
                                </div>
                                <div className='_title_hvx6q_63'>
                                  <h1 className='_show_hvx6q_401'>
                                    {track.title}
                                  </h1>
                                </div>
                                <div className='_artistWrapper_hvx6q_84'>
                                  <div className='_show_hvx6q_401'>
                                    <span>By </span>
                                    <a
                                      className='_root_16dc6_28 _body_16dc6_13 _bodyLarge_16dc6_197 _root_1upq5_1 _root_1n4n1_1'
                                      style={
                                        {
                                          '--text-color': 'var(--secondary)'
                                        } as any
                                      }
                                      href={`/${track.user.handle.toLowerCase()}`}
                                    >
                                      <h2 className='_inherit_16dc6_20 _name_1n4n1_6'>
                                        {track.user.name}
                                      </h2>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className='_badges_hvx6q_300'></div>
                          </div>
                          <div className='_bottomSection_hvx6q_333 _show_hvx6q_401'>
                            <div className='_infoLabelsSection_hvx6q_338'>
                              <div className='_infoLabelPlacement_hvx6q_343'>
                                <h2 className='_labelName_rbqg5_1'>duration</h2>
                                <h2 className='_labelValue_rbqg5_15'>
                                  {`${formatSeconds(track.duration)}`}
                                </h2>
                              </div>
                              <div className='_infoLabelPlacement_hvx6q_343'>
                                <h2 className='_labelName_rbqg5_1'>released</h2>
                                <h2 className='_labelValue_rbqg5_15'>
                                  {`${formatDate(track.release_date)}`}
                                </h2>
                              </div>
                              <div className='_infoLabelPlacement_hvx6q_343'>
                                <h2 className='_labelName_rbqg5_1'>genre</h2>
                                <h2 className='_labelValue_rbqg5_15'>
                                  {track.genre}
                                </h2>
                              </div>
                              <div className='_infoLabelPlacement_hvx6q_343'>
                                <h2 className='_labelName_rbqg5_1'>mood</h2>
                                <h2 className='_labelValue_rbqg5_15'>
                                  {track.mood in moodMap
                                    ? moodMap[track.mood]
                                    : track.mood}
                                </h2>
                              </div>
                            </div>
                            <h3
                              className='_root_16dc6_28 _body_16dc6_13 _bodySmall_16dc6_209 _root_1p2bs_1 _description_hvx6q_348'
                              style={
                                { '--text-color': 'var(--neutral)' } as any
                              }
                            >
                              {track.description}
                            </h3>
                          </div>
                        </div>
                      </div>
                      <div className='_moreByArtistLineupWrapper_61pkg_26'>
                        <div
                          className='_section_phpxx_18'
                          style={{ position: 'relative' }}
                        >
                          <div
                            style={{ display: 'flex', flexDirection: 'column' }}
                            className='_moreByArtistContainer_61pkg_35'
                          >
                            <ol></ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Suspense>
            </div>
            <div className='_playBarWrapper_ll6zl_1'>
              <div className='_customHr_ll6zl_15'></div>
              <div className='_playBar_1sp1c_1'>
                <div className='_playBarContentWrapper_1sp1c_10'></div>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </>
  )
}
