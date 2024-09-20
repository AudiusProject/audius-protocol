import { by } from 'detox';
export function byRole(role, options) {
    var name = options.name, labelOnly = options.labelOnly;
    switch (role) {
        case 'textbox':
            // @ts-ignore -- technically not an indexable native element
            return element(by.label(name)).atIndex(1);
        case 'heading':
            return element(by.label(name));
        case 'button':
            return labelOnly
                ? element(by.traits(['button']).and(by.label(name)))
                : element(by.traits(['button']).withDescendant(by.label(name)));
        case 'checkbox':
            return element(by.id(name));
        case 'radio':
            return element(by.id(name));
        default:
            return element(by.traits([role]).and(by.label(name)));
    }
}
export function byText(text) {
    return element(by.text(text));
}
