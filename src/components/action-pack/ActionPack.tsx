import cn from "classnames";
import { FC, ReactElement, ReactEventHandler, useState } from "react";
import { MenuItem, PopupMenu } from "../popup-menu/PopupMenu";
import { Tooltip } from "../tooltip/Tooltip";

import styles from "./ActionPack.module.scss";

interface MenuState {
  right: number;
  top: number;
}

interface ActionPackProps {
  children: ReactElement[];
  className?: string;
}

export const ActionPack: FC<ActionPackProps> = ({ children, className }) => {
  const [menuState, setMenuState] = useState<MenuState | null>(null);

  const visibleChildren = children.filter(({ props }) => !props.overflow);
  const overflowChildren = children.filter(({ props }) => !!props.overflow);

  const showOverflowMenu: ReactEventHandler<HTMLButtonElement> = (ev) => {
    const v = ev.currentTarget.getBoundingClientRect();
    setMenuState({
      right: window.innerWidth - v.right,
      top: v.top + v.height + 4,
    });
  };

  return (
    <div className={cn(className, styles.pack)}>
      {visibleChildren.map(({ key, props }, i) => (
        <VisibleAction key={key || i} {...props} />
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
          {overflowChildren.map(({ key, props }, i) => (
            <MenuItem
              key={key || i}
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
  const Button = (
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
    return Button;
  }

  return (
    <Tooltip tooltip={tooltip} onHide={() => onHideTooltip && onHideTooltip()}>
      {Button}
    </Tooltip>
  );
};

// register-only, renders as VisibleAction or MenuItem
export const Action: FC<VisibleActionProps> = () => null;
