import { View } from 'react-native';
import { SelectablePill } from '@audius/harmony-native';
export var ScreenHeaderButton = function (props) {
    return (<View>
      <SelectablePill type='button' isSelected isControlled {...props}/>
    </View>);
};
