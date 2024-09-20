import { Toasts } from '../toasts';
export var ModalScreen = function (props) {
    var children = props.children;
    return (<>
      <Toasts />
      {children}
    </>);
};
