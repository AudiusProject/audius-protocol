var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { Text, View, Image } from 'react-native';
import Sophisticated from 'app/assets/images/emojis/face-with-monocle.png';
import { Tile } from 'app/components/core';
import { makeStyles } from 'app/styles';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette, typography = _a.typography;
    var cardText = {
        fontSize: 16,
        fontFamily: typography.fontByWeight.medium,
        color: palette.neutral,
        lineHeight: 26,
        letterSpacing: 0.2,
        textAlign: 'center'
    };
    return {
        emptyTabRoot: {
            margin: spacing(3)
        },
        emptyTab: {
            paddingVertical: spacing(8),
            paddingHorizontal: spacing(6)
        },
        emptyTabContent: {
            alignItems: 'center'
        },
        emptyCardTextRoot: {
            flexDirection: 'row'
        },
        emptyCardTextEmoji: {
            height: 20,
            width: 20,
            marginLeft: spacing(1)
        },
        emptyCardText: cardText,
        secondaryCardText: __assign(__assign({}, cardText), { width: 220, marginVertical: spacing(4) })
    };
});
export var EmptyTile = function (props) {
    var styles = useStyles();
    var style = props.style, message = props.message, secondaryMessage = props.secondaryMessage, children = props.children;
    return (<Tile styles={{
            root: [styles.emptyTabRoot, style],
            tile: styles.emptyTab,
            content: styles.emptyTabContent
        }}>
      <View style={styles.emptyCardTextRoot}>
        <Text style={styles.emptyCardText}>
          {message}
          <View>
            <Image style={styles.emptyCardTextEmoji} source={Sophisticated}/>
          </View>
        </Text>
      </View>
      {!secondaryMessage ? null : (<Text style={styles.secondaryCardText}>{secondaryMessage}</Text>)}
      {children}
    </Tile>);
};
