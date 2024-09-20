import { useCallback, useState } from 'react';
import dayjs from 'dayjs';
import { Pressable } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { TextInput, useTheme } from '@audius/harmony-native';
export var DateTimeInput = function (props) {
    var date = props.date, onChange = props.onChange, mode = props.mode, inputProps = props.inputProps, dateTimeProps = props.dateTimeProps, _a = props.formatDate, formatDate = _a === void 0 ? function (date) {
        return dayjs(date).format(mode === 'date' ? 'M/D/YY' : 'h:mm A');
    } : _a;
    var _b = useTheme(), color = _b.color, type = _b.type;
    var _c = useState(false), isDateTimeOpen = _c[0], setIsDateTimeOpen = _c[1];
    var openDateTime = useCallback(function () {
        setIsDateTimeOpen(true);
    }, [setIsDateTimeOpen]);
    var closeDateTime = useCallback(function () {
        setIsDateTimeOpen(false);
    }, [setIsDateTimeOpen]);
    var handleChange = useCallback(function (date) {
        onChange(date.toString());
        setIsDateTimeOpen(function (d) { return !d; });
    }, [onChange, setIsDateTimeOpen]);
    var dateProps = {
        display: 'inline',
        accentColor: color.primary.primary,
        themeVariant: type === 'day' ? 'light' : 'dark',
        isDarkModeEnabled: type !== 'day'
    };
    return (<>
      <Pressable onPress={openDateTime}>
        <TextInput readOnly _disablePointerEvents value={date ? formatDate(date) : ''} {...inputProps}/>
      </Pressable>
      <DateTimePickerModal {...dateTimeProps} date={date ? new Date(date) : new Date()} mode={mode} isVisible={isDateTimeOpen} onConfirm={handleChange} onCancel={closeDateTime} {...(mode === 'date' ? dateProps : {})}/>
    </>);
};
