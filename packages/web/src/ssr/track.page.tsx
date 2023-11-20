import React from 'react'

import { GiantTrackTile } from 'components/track/GiantTrackTile'

import { TrackPageProps } from './track.page.server'

export function Page(props: TrackPageProps) {
  const { track } = props

  console.log(props)
  return <div>hi</div>
  // return <GiantTrackTile />

  //   return <Tile
  //       className={styles.giantTrackTile}
  //       dogEar={dogEarType}
  //       size='large'
  //       elevation='mid'
  //     >
  //       <div className={styles.topSection}>
  //         <GiantArtwork
  //           trackId={trackId}
  //           coverArtSizes={coverArtSizes}
  //           coSign={coSign}
  //           callback={onArtworkLoad}
  //         />
  //         <div className={styles.infoSection}>
  //           <div className={styles.infoSectionHeader}>
  //             {renderCardTitle(cn(fadeIn))}
  //             <div className={styles.title}>
  //               <h1 className={cn(fadeIn)}>{trackTitle}</h1>
  //               {isLoading && <Skeleton className={styles.skeleton} />}
  //             </div>
  //             <div className={styles.artistWrapper}>
  //               <div className={cn(fadeIn)}>
  //                 <span>By </span>
  //                 <UserLink
  //                   color='secondary'
  //                   variant='body'
  //                   size='large'
  //                   textAs='h2'
  //                   userId={userId}
  //                   badgeSize={18}
  //                   popover
  //                 />
  //               </div>
  //               {isLoading && (
  //                 <Skeleton className={styles.skeleton} width='60%' />
  //               )}
  //             </div>
  //           </div>

  //           <div className={cn(styles.playSection, fadeIn)}>
  //             {showPlay ? (
  //               <PlayPauseButton
  //                 disabled={!doesUserHaveAccess}
  //                 playing={playing && !previewing}
  //                 onPlay={onPlay}
  //                 trackId={trackId}
  //               />
  //             ) : null}
  //             {showPreview ? (
  //               <PlayPauseButton
  //                 playing={playing && previewing}
  //                 onPlay={onPreview}
  //                 trackId={trackId}
  //                 isPreview
  //               />
  //             ) : null}
  //             {isLongFormContent && isNewPodcastControlsEnabled ? (
  //               <GiantTrackTileProgressInfo
  //                 duration={duration}
  //                 trackId={trackId}
  //               />
  //             ) : (
  //               renderListenCount()
  //             )}
  //           </div>

  //           <div className={cn(styles.statsSection, fadeIn)}>
  //             {renderStatsRow()}
  //           </div>

  //           <div
  //             className={cn(styles.actionButtons, fadeIn)}
  //             role='group'
  //             aria-label={messages.actionGroupLabel}
  //           >
  //             {renderShareButton()}
  //             {renderMakePublicButton()}
  //             {doesUserHaveAccess && renderRepostButton()}
  //             {doesUserHaveAccess && renderFavoriteButton()}
  //             <span>
  //               {/* prop types for overflow menu don't work correctly
  //               so we need to cast here */}
  //               <Menu {...(overflowMenu as any)}>
  //                 {(ref, triggerPopup) => (
  //                   <div className={cn(styles.menuKebabContainer)} ref={ref}>
  //                     <Button
  //                       className={cn(styles.buttonFormatting, styles.moreButton)}
  //                       leftIcon={<IconKebabHorizontal />}
  //                       onClick={() => triggerPopup()}
  //                       text={null}
  //                       textClassName={styles.buttonTextFormatting}
  //                       type={ButtonType.COMMON}
  //                     />
  //                   </div>
  //                 )}
  //               </Menu>
  //             </span>
  //           </div>
  //         </div>
  //     </Tile>
}
