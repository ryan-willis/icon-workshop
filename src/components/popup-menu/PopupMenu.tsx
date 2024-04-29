import cn from "classnames";
import { FC, ReactElement, useRef } from "react";
import { createPortal } from "react-dom";
import { useModalRootNode } from "../../useModalRootNode";
import styles from "./PopupMenu.module.scss";

interface PopupMenuProps {
  children: ReactElement;
  show: boolean;
  left?: number;
  top?: number;
  right?: number;
  onClose: () => void;
  className?: string;
}

export const PopupMenu: FC<PopupMenuProps> = ({
  children,
  className,
  show,
  left,
  top,
  right,
  onClose,
}) => {
  const modalRoot = useModalRootNode();
  const blurTimeout = useRef<NodeJS.Timeout>();

  return (
    <>
      {show &&
        createPortal(
          <>
            <div className={styles.scrim} onClick={() => onClose()} />
            <ul
              onKeyDown={(ev) => ev.code === "Escape" && onClose()}
              onFocus={() =>
                blurTimeout.current && clearTimeout(blurTimeout.current)
              }
              onBlur={() => {
                blurTimeout.current && clearTimeout(blurTimeout.current);
                blurTimeout.current = setTimeout(() => onClose(), 100);
              }}
              ref={(n) => {
                n &&
                  !n.contains(document.activeElement) &&
                  setTimeout(() => {
                    const btn: HTMLButtonElement | null = n.querySelector(
                      "button:not([disabled])"
                    );
                    if (btn) {
                      btn.focus();
                    } else {
                      n.tabIndex = 0;
                      n.focus();
                      setTimeout(() => (n.tabIndex = -1));
                    }
                  });
              }}
              style={{ left: left === undefined ? "auto" : left, top, right }}
              className={cn(className, styles.menu)}
            >
              {children}
            </ul>
          </>,
          modalRoot
        )}
    </>
  );
};

interface MenuItemProps {
  icon?: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

export const MenuItem: FC<MenuItemProps> = ({
  className,
  onClick,
  icon,
  label,
  disabled,
}) => {
  return (
    <li>
      <button
        className={cn(className, styles.item)}
        disabled={!!disabled}
        onPointerDown={(ev) => {
          // For Safari... force focus on mousedown
          setTimeout(() => ev.currentTarget.focus());
        }}
        onKeyDown={(ev) => {
          if (ev.code === "ArrowUp" || ev.code === "ArrowDown") {
            const next = ev.code === "ArrowDown";
            const li = ev.currentTarget.closest("li");
            const items = [
              ...ev.currentTarget
                .closest("ul")!
                .querySelectorAll("li:not([disabled])"),
            ];
            const idx =
              (items.indexOf(li as Element) + (next ? 1 : -1) + items.length) %
              items.length;
            items[idx]?.querySelector("button")?.focus();
            ev.preventDefault();
          }
        }}
        onClick={onClick}
      >
        {icon && <i className="material-icons">{icon}</i>}
        <span>{label}</span>
      </button>
    </li>
  );
};
