import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from './Screen';
export var SafeAreaScreen = function (props) {
    return <Screen as={SafeAreaView} {...props}/>;
};
