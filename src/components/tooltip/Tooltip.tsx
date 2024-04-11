import cn from "classnames";
import {
  Children,
  cloneElement,
  FC,
  ReactEventHandler,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useModalRootNode } from "../../useModalRootNode";
import styles from "./Tooltip.module.scss";

interface TooltipProps {
  children: any;
  tooltip: string;
  className?: string;
  onShow?: () => void;
  onHide?: () => void;
}

interface Coords {
  top: number;
  left: number;
}

export const Tooltip: FC<TooltipProps> = ({
  tooltip,
  className,
  onShow,
  onHide,
  children,
}) => {
  const [coords, setCoords] = useState<Coords>();
  let [openState, setOpenState] = useState(false);
  let modalRoot = useModalRootNode();

  useEffect(() => {
    setOpenState(true);
  }, []);

  const showTooltip: ReactEventHandler<HTMLElement> = (ev) => {
    let v = ev.currentTarget.getBoundingClientRect();
    let newCoords = {
      left: (v.left + v.right) / 2,
      top: v.bottom,
    };

    setCoords(newCoords);
    setOpenState(true);
  };
  return (
    <>
      {Children.map(
        children,
        (child) =>
          child &&
          cloneElement(child, {
            onMouseEnter: (event, ...args) => {
              child.props.onMouseMove &&
                child.props.onMouseMove(event, ...args);
              showTooltip(event);
              onShow && onShow();
            },
            onMouseLeave: (event, ...args) => {
              child.props.onMouseMove &&
                child.props.onMouseLeave(event, ...args);
              setOpenState(false);
              onHide && onHide();
            },
          })
      )}
      {!!openState &&
        !!tooltip &&
        createPortal(
          <div style={coords} className={cn(className, styles.tooltip)}>
            {tooltip}
          </div>,
          modalRoot
        )}
    </>
  );
};
