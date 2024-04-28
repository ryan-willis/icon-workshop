import cn from "classnames";
import { FC, ReactEventHandler, useContext, useState } from "react";
import { MenuItem, PopupMenu } from "../../components/popup-menu/PopupMenu";
import { ScrollEdges } from "../../components/scroll-edges/ScrollEdges";
import { ALL_MODULES, DocumentContext } from "../../DocumentContext";
import { ArrowNwCwImage } from "./images/arrow-nw-cw";
import styles from "./ModulePicker.module.scss";

interface ModulePickerProps {
  activeModule: any;
  onChange: (module: any) => void;
}

interface MenuState {
  left: number;
  top: number;
}

export const ModulePicker: FC<ModulePickerProps> = ({
  activeModule,
  onChange,
}) => {
  let { modules, setModules, previews } = useContext(DocumentContext);
  let [menuState, setMenuState] = useState<MenuState | null>(null);

  let showMenu: ReactEventHandler<HTMLButtonElement> = (ev) => {
    let v = ev.currentTarget.getBoundingClientRect();
    setMenuState({
      left: v.left,
      top: v.top + v.height + 4,
    });
  };

  let addModule = (module: any) => {
    if (modules.indexOf(module) < 0) {
      setModules([...modules, module]);
    }
    onChange(module);
    setMenuState(null);
  };

  return (
    <ScrollEdges
      className={styles.container}
      edgeClassNames={{
        left: styles.leftScrollEdge,
        right: styles.rightScrollEdge,
      }}
    >
      <ScrollEdges.Content className={styles.picker}>
        {modules.map((module: any) => {
          return (
            <label
              key={module.type}
              className={cn(styles.item, {
                [styles.isSelected]: activeModule === module,
              })}
            >
              <input
                type="radio"
                name="module-picker"
                value={module.type}
                onChange={() => onChange(module)}
                checked={activeModule === module}
              />
              {!!Object.keys(previews[module.type] || {}).length && (
                <img
                  src={previews[module.type].main}
                  alt={`Preview for ${module.label}`}
                />
              )}
              {!Object.keys(previews[module.type] || {}).length && (
                <div className={styles.previewLoading} />
              )}
              <div className={styles.moduleLabel}>{module.label}</div>
              <button
                className={styles.deleteButton}
                onClick={() => {
                  let idx = modules.indexOf(module);
                  modules.splice(idx, 1);
                  setModules([...modules]);
                  if (module === activeModule) {
                    onChange(modules[Math.min(idx, modules.length - 1)]);
                  }
                }}
                aria-label={`Remove ${module.label}`}
              >
                <i className="material-icons">cancel</i>
              </button>
            </label>
          );
        })}
        {modules.length < ALL_MODULES.length && (
          <button
            className={cn(styles.addButton, {
              [styles.isZeroState]: !modules.length,
            })}
            onClick={(ev) => showMenu(ev)}
            aria-label="Add target"
          >
            <i className="material-icons">add</i>
          </button>
        )}
        {menuState && (
          <PopupMenu
            show
            onClose={() => setMenuState(null)}
            left={menuState?.left}
            top={menuState?.top}
          >
            {ALL_MODULES.map((module) => (
              <MenuItem
                key={module.type}
                disabled={modules.indexOf(module) >= 0}
                onClick={() => addModule(module)}
                label={module.label}
              />
            ))}
          </PopupMenu>
        )}
      </ScrollEdges.Content>
      {!modules.length && (
        <div className={styles.zeroStateEdu}>
          <ArrowNwCwImage style={{ fill: "var(--color-ink)" }} />
          <span>
            Add a target
            <br />
            to continue
          </span>
        </div>
      )}
    </ScrollEdges>
  );
};
