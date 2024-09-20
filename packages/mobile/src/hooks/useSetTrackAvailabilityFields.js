import { useCallback, useMemo } from 'react';
import { useField } from 'formik';
// This hook allows us to set track availability fields during upload.
// It has to be used with a Formik context because it uses formik's useField hook.
export var useSetEntityAvailabilityFields = function () {
    var entityType = useField('entityType')[0].value;
    var _a = useField('is_stream_gated'), setIsStreamGated = _a[2].setValue;
    var _b = useField('stream_conditions'), setStreamConditions = _b[2].setValue;
    var _c = useField(entityType === 'track' ? 'is_unlisted' : 'is_private'), setIsUnlisted = _c[2].setValue;
    var _d = useField('preview_start_seconds'), setPreviewStartSeconds = _d[2].setValue;
    var _e = useField('field_visibility.genre'), setGenre = _e[2].setValue;
    var _f = useField('field_visibility.mood'), setMood = _f[2].setValue;
    var _g = useField('field_visibility.tags'), setTags = _g[2].setValue;
    var _h = useField('field_visibility.share'), setShare = _h[2].setValue;
    var _j = useField('field_visibility.play_count'), setPlayCount = _j[2].setValue;
    var _k = useField('field_visibility.remixes'), setRemixes = _k[2].setValue;
    var fieldSetters = useMemo(function () {
        return {
            is_stream_gated: setIsStreamGated,
            stream_conditions: setStreamConditions,
            is_unlisted: setIsUnlisted,
            preview_start_seconds: setPreviewStartSeconds,
            'field_visibility.genre': setGenre,
            'field_visibility.mood': setMood,
            'field_visibility.tags': setTags,
            'field_visibility.share': setShare,
            'field_visibility.play_count': setPlayCount,
            'field_visibility.remixes': setRemixes
        };
        // adding the useField setters cause infinite rendering
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    var set = useCallback(function (fieldValues) {
        var givenKeys = Object.keys(fieldValues);
        givenKeys.forEach(function (key) {
            var value = fieldValues[key];
            var setter = fieldSetters[key];
            setter(value);
        });
    }, [fieldSetters]);
    return set;
};
