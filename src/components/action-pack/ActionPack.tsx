import cn from "classnames";
import { Children, FC, ReactEventHandler, useState } from "react";
import { MenuItem, PopupMenu } from "../popup-menu/PopupMenu";
import { Tooltip } from "../tooltip/Tooltip";

import styles from "./ActionPack.module.scss";

interface MenuState {
  right: number;
  top: number;
}

interface ActionPackProps {
  children: any;
  className?: string;
}

export const ActionPack: FC<ActionPackProps> = ({ children, className }) => {
  const [menuState, setMenuState] = useState<MenuState | null>(null);

  let childrenArray = Children.toArray(children) as {
    key: string;
    props: Record<string, any>;
  }[];
  let visibleChildren = childrenArray.filter(({ props }) => !props.overflow);
  let overflowChildren = childrenArray.filter(({ props }) => !!props.overflow);

  let showOverflowMenu: ReactEventHandler<HTMLButtonElement> = (ev) => {
    let v = ev.currentTarget.getBoundingClientRect();
    setMenuState({
      right: window.innerWidth - v.right,
      top: v.top + v.height + 4,
    });
  };

  return (
    <div className={cn(className, styles.pack)}>
      {visibleChildren.map(({ key, props }) => (
        <VisibleAction key={key} {...props} />
      ))}
      {!!overflowChildren.length && (
        <VisibleAction
          icon="more_horiz"
          tooltip="More"
          onClick={(ev) => showOverflowMenu(ev)}
        />
      )}
      {menuState && (
        <PopupMenu
          show
          onClose={() => setMenuState(null)}
          right={menuState?.right}
          top={menuState?.top}
        >
          {overflowChildren.map(({ key, props }) => (
            <MenuItem
              key={key}
              icon={props.icon}
              label={props.label || props.tooltip}
              disabled={props.disabled}
              onClick={props.onClick}
            />
          ))}
        </PopupMenu>
      )}
    </div>
  );
};

interface VisibleActionProps {
  icon?: string | JSX.Element;
  tooltip?: string;
  label?: string;
  primary?: boolean;
  disabled?: boolean;
  onClick?: ReactEventHandler<HTMLButtonElement>;
  overflow?: boolean;
  onHideTooltip?: () => void;
}

const VisibleAction: FC<VisibleActionProps> = ({
  icon,
  tooltip,
  label,
  primary,
  disabled,
  onClick,
  onHideTooltip,
}) => {
  let button = (
    <button
      className={cn(styles.action, {
        [styles.isPrimary]: primary,
        [styles.hasIcon]: !!icon,
        [styles.iconOnly]: !label,
      })}
      onClick={onClick}
      disabled={disabled}
      aria-label={label || tooltip || ""}
    >
      {icon && typeof icon === "string" && (
        <i className="material-icons">{icon}</i>
      )}
      {icon && typeof icon === "object" && icon}
      {label && <span>{label}</span>}
    </button>
  );

  if (!tooltip || label) {
    return button;
  }

  return (
    <Tooltip tooltip={tooltip} onHide={() => onHideTooltip && onHideTooltip()}>
      {button}
    </Tooltip>
  );
};

// register-only, renders as VisibleAction or MenuItem
export const Action: FC<VisibleActionProps> = () => null;
