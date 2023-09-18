"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackLink = exports.getEntity = exports.getUsers = void 0;
const react_1 = __importDefault(require("react"));
const formatNotificationMetadata_1 = require("../../formatNotificationMetadata");
const NotificationBody_1 = __importDefault(require("./NotificationBody"));
const Icons_1 = require("./Icons");
const constants_1 = require("../../constants");
const utils_1 = require("../../processNotifications/utils");
const challengeRewardsConfig = {
    referred: {
        title: 'Invite your Friends',
        icon: <Icons_1.IncomingEnvelopeIcon />
    },
    referrals: {
        title: 'Invite your Friends',
        icon: <Icons_1.IncomingEnvelopeIcon />
    },
    'ref-v': {
        title: 'Invite your Fans',
        icon: <Icons_1.IncomingEnvelopeIcon />
    },
    'connect-verified': {
        title: 'Link Verified Accounts',
        icon: <Icons_1.WhiteHeavyCheckMarkIcon />
    },
    'listen-streak': {
        title: 'Listening Streak: 7 Days',
        icon: <Icons_1.HeadphoneIcon />
    },
    'mobile-install': {
        title: 'Get the Audius Mobile App',
        icon: <Icons_1.MobilePhoneWithArrowIcon />
    },
    'profile-completion': {
        title: 'Complete Your Profile',
        icon: <Icons_1.WhiteHeavyCheckMarkIcon />
    },
    'track-upload': {
        title: 'Upload 3 Tracks',
        icon: <Icons_1.MultipleMusicalNotesIcon />
    },
    'send-first-tip': {
        title: 'Send Your First Tip',
        icon: <Icons_1.MoneyMouthFaceIcon />
    },
    'first-playlist': {
        title: 'Create a Playlist',
        icon: <Icons_1.TrebleClefIcon />
    }
};
const EntityType = Object.freeze({
    Track: 'Track',
    Album: 'Album',
    Playlist: 'Playlist'
});
const HighlightText = ({ text }) => (<span className={'avenir'} style={{
        color: '#7E1BCC',
        fontSize: '14px',
        fontWeight: '500'
    }}>
    {text}
  </span>);
const BodyText = ({ text, className }) => (<span className={`avenir ${className}`} style={{
        color: '#858199',
        fontSize: '14px',
        fontWeight: '500'
    }}>
    {text}
  </span>);
const getUsers = (users) => {
    const [firstUser] = users;
    if (users.length > 1) {
        const userCount = users.length - 1;
        return (<>
        <HighlightText text={firstUser.name}/>
        <BodyText text={` and ${userCount.toLocaleString()} other${users.length > 2 ? 's' : ''}`}/>
      </>);
    }
    return <HighlightText text={firstUser.name}/>;
};
exports.getUsers = getUsers;
const getEntity = (entity) => {
    if (entity.type === EntityType.Track) {
        return (<> <BodyText text={'track '}/><HighlightText text={entity.name}/> </>);
    }
    else if (entity.type === EntityType.Album) {
        return (<> <BodyText text={'album '}/><HighlightText text={entity.name}/> </>);
    }
    else if (entity.type === EntityType.Playlist) {
        return (<> <BodyText text={'playlist '}/><HighlightText text={entity.name}/> </>);
    }
};
exports.getEntity = getEntity;
const notificationMap = {
    [constants_1.notificationTypes.Favorite.base](notification) {
        const user = (0, exports.getUsers)(notification.users);
        const entity = (0, exports.getEntity)(notification.entity);
        return (<span className={'notificationText'}>
        {user}<BodyText text={` favorited your `}/>{entity}
      </span>);
    },
    [constants_1.notificationTypes.Repost.base](notification) {
        const user = (0, exports.getUsers)(notification.users);
        const entity = (0, exports.getEntity)(notification.entity);
        return (<span className={'notificationText'}>
        {user}<BodyText text={` reposted your `}/>{entity}
      </span>);
    },
    [constants_1.notificationTypes.Follow](notification) {
        const user = (0, exports.getUsers)(notification.users);
        return (<span className={'notificationText'}>
        {user}<BodyText text={` followed you`}/>
      </span>);
    },
    [constants_1.notificationTypes.Announcement](notification) {
        return <BodyText className={'notificationText'} text={notification.text}/>;
    },
    [constants_1.notificationTypes.Milestone](notification) {
        if (notification.entity) {
            const entity = notification.entity.type.toLowerCase();
            const highlight = notification.entity.name;
            const count = notification.value;
            return (<span className={'notificationText'}>
          <BodyText text={`Your ${entity} `}/>
          <HighlightText text={highlight}/>
          <BodyText text={` has reached over ${count.toLocaleString()} ${notification.achievement}s`}/>
        </span>);
        }
        else {
            return (<BodyText className={'notificationText'} text={`You have reached over ${notification.value} Followers `}/>);
        }
    },
    [constants_1.notificationTypes.TrendingTrack](notification) {
        const highlight = notification.entity.title;
        const rank = notification.rank;
        const rankSuffix = (0, formatNotificationMetadata_1.getRankSuffix)(rank);
        return (<span className={'notificationText'}>
        <BodyText text={`Your Track `}/>
        <HighlightText text={highlight}/>
        <BodyText text={` is ${rank}${rankSuffix} on Trending Right Now! 🍾`}/>
      </span>);
    },
    [constants_1.notificationTypes.UserSubscription](notification) {
        const [user] = notification.users;
        if (notification.entity.type === constants_1.notificationTypes.Track && !isNaN(notification.entity.count) && notification.entity.count > 1) {
            return (<span className={'notificationText'}>
          <HighlightText text={user.name}/>
          <BodyText text={` released ${notification.entity.count} new ${notification.entity.type}`}/>
        </span>);
        }
        return (<span className={'notificationText'}>
        <HighlightText text={user.name}/>
        <BodyText text={` released a new ${notification.entity.type} ${notification.entity.name}`}/>
      </span>);
    },
    [constants_1.notificationTypes.RemixCreate](notification) {
        const { remixUser, remixTrack, parentTrackUser, parentTrack } = notification;
        return (<span className={'notificationText'}>
        <HighlightText text={remixTrack.title}/>
        <BodyText text={` by `}/>
        <HighlightText text={remixUser.name}/>
      </span>);
    },
    [constants_1.notificationTypes.RemixCosign](notification) {
        const { parentTrackUser, parentTracks } = notification;
        const parentTrack = parentTracks.find(t => t.owner_id === parentTrackUser.user_id);
        return (<span className={'notificationText'}>
        <HighlightText text={parentTrackUser.name}/>
        <BodyText text={` Co-signed your Remix of `}/>
        <HighlightText text={parentTrack.title}/>
      </span>);
    },
    [constants_1.notificationTypes.ChallengeReward](notification) {
        const { rewardAmount } = notification;
        const { title, icon } = challengeRewardsConfig[notification.challengeId];
        let bodyText;
        if (notification.challengeId === 'referred') {
            bodyText = `You’ve received ${rewardAmount} $AUDIO for being referred! Invite your friends to join to earn more!`;
        }
        else {
            bodyText = `You’ve earned ${rewardAmount} $AUDIO for completing this challenge!`;
        }
        return (<span className={'notificationText'}>
            <table cellspacing='0' cellpadding='0' style={{ marginBottom: '4px' }}>
              <tr>
                  <td>{icon}</td>
                  <td><HighlightText text={title}/></td>
            </tr>
          </table>
        <BodyText text={bodyText}/>
      </span>);
    },
    [constants_1.notificationTypes.AddTrackToPlaylist](notification) {
        return (<span className={'notificationText'}>
        <HighlightText text={notification.playlistOwner.name}/>
        <BodyText text={` added your track `}/>
        <HighlightText text={notification.track.title}/>
        <BodyText text={` to their playlist `}/>
        <HighlightText text={notification.playlist.playlist_name}/>
      </span>);
    },
    [constants_1.notificationTypes.Reaction](notification) {
        return (<span className={'notificationText'}>
        <HighlightText text={(0, utils_1.capitalize)(notification.reactingUser.name)}/>
        <BodyText text={` reacted to your tip of `}/>
        <HighlightText text={notification.amount}/>
        <BodyText text={` $AUDIO`}/>
      </span>);
    },
    [constants_1.notificationTypes.SupporterRankUp](notification) {
        return (<span className={'notificationText'}>
        <HighlightText text={(0, utils_1.capitalize)(notification.sendingUser.name)}/>
        <BodyText text={` became your `}/>
        <HighlightText text={`#${notification.rank}`}/>
        <BodyText text={` Top Supporter!`}/>
      </span>);
    },
    [constants_1.notificationTypes.SupportingRankUp](notification) {
        return (<span className={'notificationText'}>
        <BodyText text={`You're now `}/>
        <HighlightText text={(0, utils_1.capitalize)(notification.receivingUser.name)}/>
        <BodyText text={`'s `}/>
        <HighlightText text={`#${notification.rank}`}/>
        <BodyText text={` Top Supporter!`}/>
      </span>);
    },
    [constants_1.notificationTypes.TipReceive](notification) {
        return (<span className={'notificationText'}>
        <HighlightText text={(0, utils_1.capitalize)(notification.sendingUser.name)}/>
        <BodyText text={` sent you a tip of `}/>
        <HighlightText text={notification.amount}/>
        <BodyText text={` $AUDIO`}/>
      </span>);
    }
};
const getMessage = (notification) => {
    const getNotificationMessage = notificationMap[notification.type];
    if (!getNotificationMessage)
        return null;
    return getNotificationMessage(notification);
};
const getTitle = (notification) => {
    switch (notification.type) {
        case constants_1.notificationTypes.RemixCreate: {
            const { parentTrack } = notification;
            return (<span className={'notificationText'}>
          <BodyText text={`New remix of your track `}/>
          <HighlightText text={parentTrack.title}/>
        </span>);
        }
        default:
            return null;
    }
};
const getTrackMessage = (notification) => {
    switch (notification.type) {
        case constants_1.notificationTypes.RemixCosign: {
            const { remixTrack } = notification;
            return (<span className={'notificationText'}>
          <HighlightText text={remixTrack.title}/>
        </span>);
        }
        default:
            return null;
    }
};
const getTrackLink = (track) => {
    return `https://audius.co/${track.route_id}-${track.track_id}`;
};
exports.getTrackLink = getTrackLink;
const getTwitter = (notification) => {
    switch (notification.type) {
        case constants_1.notificationTypes.RemixCreate: {
            const { parentTrack, parentTrackUser, remixUser, remixTrack } = notification;
            const twitterHandle = parentTrackUser.twitterHandle
                ? `@${parentTrackUser.twitterHandle}`
                : parentTrackUser.name;
            const text = `New remix of ${parentTrack.title} by ${twitterHandle} on @AudiusProject #Audius`;
            const url = (0, exports.getTrackLink)(remixTrack);
            return {
                message: 'Share With Your Friends',
                href: `http://twitter.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
            };
        }
        case constants_1.notificationTypes.RemixCosign: {
            const { parentTracks, parentTrackUser, remixTrack } = notification;
            const parentTrack = parentTracks.find(t => t.owner_id === parentTrackUser.user_id);
            const url = (0, exports.getTrackLink)(remixTrack);
            const twitterHandle = parentTrackUser.twitterHandle
                ? `@${parentTrackUser.twitterHandle}`
                : parentTrackUser.name;
            const text = `My remix of ${parentTrack.title} was Co-Signed by ${twitterHandle} on @AudiusProject #Audius`;
            return {
                message: 'Share With Your Friends',
                href: `http://twitter.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
            };
        }
        case constants_1.notificationTypes.TrendingTrack: {
            const { rank, entity } = notification;
            const url = (0, exports.getTrackLink)(entity);
            const rankSuffix = (0, formatNotificationMetadata_1.getRankSuffix)(rank);
            const text = `My track ${entity.title} is trending ${rank}${rankSuffix} on @AudiusProject! #AudiusTrending #Audius`;
            return {
                message: 'Share this Milestone',
                href: `http://twitter.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
            };
        }
        case constants_1.notificationTypes.ChallengeReward: {
            const text = `I earned $AUDIO for completing challenges on @AudiusProject #AudioRewards`;
            return {
                message: 'Share this with your fans',
                href: `http://twitter.com/share?text=${encodeURIComponent(text)}`
            };
        }
        default:
            return null;
    }
};
const Notification = (props) => {
    const message = getMessage(props);
    const title = getTitle(props);
    const trackMessage = getTrackMessage(props);
    const twitter = getTwitter(props);
    return (<NotificationBody_1.default {...props} title={title} message={message} trackMessage={trackMessage} twitter={twitter}/>);
};
exports.default = Notification;
