import { memo } from 'react';
import { BottomTabBarButton } from './BottomTabBarButton';
export var TrendingButton = memo(function (props) {
    return <BottomTabBarButton name='trending' {...props}/>;
});
