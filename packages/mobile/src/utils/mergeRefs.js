export function mergeRefs(refs) {
    return function (value) {
        refs.forEach(function (ref) {
            if (typeof ref === 'function') {
                ref(value);
            }
            else if (ref != null) {
                ;
                ref.current = value;
            }
        });
    };
}
