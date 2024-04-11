import cn from "classnames";
import {
  FC,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import WebFont from "webfontloader";
import { useMediaQuery } from "../useMediaQuery";
import { useModalRootNode } from "../useModalRootNode";
import styles from "./FontField.module.scss";
import peStyles from "./PropertyEditor.module.scss";
import { TextWidget } from "./widgets/TextWidget";

const WEB_FONTS_API_KEY = "AIzaSyAtSe8wlXPCUaLQ4LTyPKpbzBBPJAzEXmU";
const WEB_FONTS_API_URL = `https://www.googleapis.com/webfonts/v1/webfonts?key=${WEB_FONTS_API_KEY}&fields=items(family)`;
const WEB_FONTS_CACHE_KEY = "webFontsCache";
const WEB_FONTS_CACHE_TIME = 60 * 60 * 1000; // 1 hour

const DEFAULT_FONTS = [
  "Roboto",
  "Roboto Condensed",
  "Roboto Mono",
  "Inter",
  "Abril Fatface",
  "Open Sans",
  "JetBrains Mono",
].sort();

const WEB_FONTS_LOAD_PROMISES: Record<string, Promise<void>> = {};

interface FontFieldProps {
  fieldId: string;
  property: any;
  value: any;
  effectiveValue: any;
  onValue: (value: any) => void;
}

interface MenuPosition {
  left: number;
  top: number;
  width: number;
}

export const FontField: FC<FontFieldProps> = ({
  fieldId,
  property,
  value,
  effectiveValue,
  onValue,
}) => {
  let [fonts, setFonts] = useState<string[]>([]);
  let [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  let [menuFocused, setMenuFocused] = useState(false);
  let [familyFocused, setFamilyFocused] = useState(false);
  let isTouch = !useMediaQuery("(hover: hover)");

  let textWidgetRef = useRef<HTMLInputElement | null>(null);
  let menuRef = useRef<HTMLUListElement | null>(null);
  let blurTimeout = useRef<NodeJS.Timeout | null>();
  let [somethingFocused, setSomethingFocused] = useState(false);
  let [userClosedMenu, setUserClosedMenu] = useState(false);

  useEffect(() => {
    if (!menuFocused && !familyFocused) {
      return;
    }

    setSomethingFocused(true);
    blurTimeout.current && clearTimeout(blurTimeout.current);
    return () => {
      blurTimeout.current = setTimeout(() => setSomethingFocused(false), 100);
    };
  }, [menuFocused, familyFocused]);

  effectiveValue = effectiveValue || { family: "Roboto" };

  let filteredFonts = useMemo(() => {
    let q = (value?.family || "").toLowerCase();
    return q
      ? fonts.filter((family) => family.toLowerCase().indexOf(q) >= 0)
      : fonts;
  }, [fonts, value]);

  let menuShown =
    !isTouch && !userClosedMenu && somethingFocused && !!filteredFonts.length;

  useEffect(() => {
    loadGoogleWebFontsList().then((fonts) =>
      setFonts(fonts?.length ? fonts : DEFAULT_FONTS)
    );
  }, []);

  return (
    <div className={styles.field}>
      <TextWidget
        // ref={textWidgetRef}
        id={fieldId}
        type="text"
        list={isTouch ? "fonts" : undefined}
        autoComplete="off"
        onChange={(value) => {
          onValue(value ? { ...effectiveValue, family: value } : null);
          setUserClosedMenu(false);
        }}
        onKeyDown={(ev) => {
          if (!isTouch && ev.key === "ArrowDown") {
            setUserClosedMenu(false);
            (
              menuRef.current?.querySelector(
                "button:not([disabled])"
              )! as HTMLButtonElement
            ).focus();
            ev.preventDefault();
          }
        }}
        onFocus={(ev) => {
          let v = ev.currentTarget.getBoundingClientRect();
          setMenuPosition({
            left: v.left + 1,
            top: v.top + v.height,
            width: v.width - 2,
          });
          setUserClosedMenu(false);
          setFamilyFocused(true);
        }}
        onBlur={() => setFamilyFocused(false)}
        value={value?.family || ""}
        placeholder={property.default?.family}
      />
      {menuPosition && menuShown && !!filteredFonts.length && (
        <AutocompleteMenu
          show
          ref={menuRef}
          onFocus={() => setMenuFocused(true)}
          onBlur={() => setMenuFocused(false)}
          onEscape={() => {
            textWidgetRef.current?.focus();
            setUserClosedMenu(true);
          }}
          left={menuPosition?.left}
          top={menuPosition?.top}
          width={menuPosition?.width}
        >
          {filteredFonts.map((font) => (
            <FontMenuItem
              key={font}
              family={font}
              onClick={() => {
                onValue({ ...effectiveValue, family: font });
                setTimeout(() => {
                  textWidgetRef.current?.focus();
                  setUserClosedMenu(true);
                });
              }}
            />
          ))}
        </AutocompleteMenu>
      )}
      <button
        className={cn(peStyles.button, peStyles.iconButton, {
          [peStyles.isChecked]: !!effectiveValue.bold,
        })}
        onClick={() =>
          onValue({ ...effectiveValue, bold: !effectiveValue.bold })
        }
        aria-label={effectiveValue.bold ? "Turn off bold" : "Turn on bold"}
      >
        <i className="material-icons">format_bold</i>
      </button>
      <button
        className={cn(peStyles.button, peStyles.iconButton, {
          [peStyles.isChecked]: !!effectiveValue.italic,
        })}
        onClick={() =>
          onValue({ ...effectiveValue, italic: !effectiveValue.italic })
        }
        aria-label={
          effectiveValue.italic ? "Turn off italic" : "Turn on italic"
        }
      >
        <i className="material-icons">format_italic</i>
      </button>
      {fonts && (
        <datalist id="fonts">
          {fonts.map((font) => (
            <option key={font} value={font} />
          ))}
        </datalist>
      )}
    </div>
  );
};

interface AutocompleteMenuProps {
  children: any;
  className?: string;
  show: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onEscape: () => void;
  left?: number;
  top?: number;
  width?: number;
  right?: number;
  ref?: React.LegacyRef<HTMLUListElement>;
}

export const AutocompleteMenu: FC<AutocompleteMenuProps> = forwardRef(
  (
    {
      children,
      className,
      show,
      onFocus,
      onBlur,
      onEscape,
      left,
      top,
      width,
      right,
    },
    ref
  ) => {
    let modalRoot = useModalRootNode();
    let [hasFocus, setHasFocus] = useState(false);
    let blurTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!hasFocus) {
        return;
      }

      blurTimeout.current && clearTimeout(blurTimeout.current);
      return () => {
        blurTimeout.current = setTimeout(() => onBlur && onBlur(), 100);
      };
    }, [hasFocus, onBlur]);

    return (
      <>
        {show &&
          createPortal(
            <>
              <ul
                onKeyDown={(ev) => {
                  if (ev.code === "Escape") {
                    onEscape();
                  }
                }}
                ref={ref}
                onFocus={() => {
                  setHasFocus(true);
                  onFocus && onFocus();
                }}
                onBlur={() => setHasFocus(false)}
                style={{
                  left: left === undefined ? "auto" : left,
                  top,
                  right,
                  width,
                }}
                className={cn(className, styles.autocompleteMenu)}
              >
                {children}
              </ul>
            </>,
            modalRoot
          )}
      </>
    );
  }
);

interface FontMenuItemProps {
  className?: string;
  onClick: () => void;
  family: string;
}

export const FontMenuItem: FC<FontMenuItemProps> = ({
  className,
  onClick,
  family,
}) => {
  let [el, setEl] = useState<HTMLLIElement | null>(null);
  let [showPreview, setShowPreview] = useState(false);
  let [fontLoaded, setFontLoaded] = useState(false);

  const intersectionObserver = useMemo(
    () =>
      new IntersectionObserver((entries) => {
        if (!el) {
          return;
        }

        if (entries[0].isIntersecting) {
          setShowPreview(true);
        }
      }),
    [el]
  );

  useLayoutEffect(() => {
    if (!el || !intersectionObserver) {
      return;
    }

    intersectionObserver.observe(el);
    return () => intersectionObserver.unobserve(el);
  }, [el, intersectionObserver]);

  useEffect(() => {
    if (!showPreview || fontLoaded) {
      return;
    }

    tryLoadWebFont(family).then(() => setFontLoaded(true));
  }, [family, fontLoaded, showPreview]);

  return (
    <li ref={(node) => setEl(node)}>
      <button
        className={cn(className, styles.item)}
        onPointerDown={(ev) => {
          // For Safari... force focus on mousedown
          let ct = ev.currentTarget;
          setTimeout(() => ct.focus());
        }}
        onKeyDown={(ev) => {
          if (ev.code === "ArrowUp" || ev.code === "ArrowDown") {
            let next = ev.code === "ArrowDown";
            let li = ev.currentTarget.closest("li");
            let items = [
              ...ev.currentTarget
                .closest("ul")!
                .querySelectorAll("li:not([disabled])"),
            ];
            let idx =
              (items.indexOf(li as Element) + (next ? 1 : -1) + items.length) %
              items.length;
            items[idx]?.querySelector("button")!.focus();
            ev.preventDefault();
          }
        }}
        onClick={onClick}
      >
        <span className={styles.family}>{family}</span>
        {showPreview && fontLoaded && (
          <span
            className={styles.preview}
            style={{
              fontFamily: family,
            }}
          >
            Fu
          </span>
        )}
      </button>
    </li>
  );
};
export function tryLoadWebFont(
  family: string,
  { bold = false, italic = false } = {}
): Promise<void> {
  let key = family;
  if (bold && italic) {
    key += ":400,700italic"; // load normal too or else you get a 404
  } else if (bold) {
    key += ":400,700";
  } else if (italic) {
    key += ":400,400italic";
  }

  if (!WEB_FONTS_LOAD_PROMISES[key]) {
    WEB_FONTS_LOAD_PROMISES[key] = new Promise<void>((resolve) => {
      WebFont.load({
        google: {
          families: [key],
          // TODO: text parameter to customize subsetting?
        },
        fontactive: () => resolve(),
        fontinactive: () => resolve(),
      });
    });
  }

  return WEB_FONTS_LOAD_PROMISES[key];
}

async function loadGoogleWebFontsList() {
  if (WEB_FONTS_CACHE_KEY in localStorage) {
    let { fetchTime, fonts } = JSON.parse(localStorage[WEB_FONTS_CACHE_KEY]);
    if (Number(new Date()) - fetchTime < WEB_FONTS_CACHE_TIME) {
      return fonts;
    }
  }

  let data = await fetch(WEB_FONTS_API_URL).then((d) => d.json());
  let fonts = (data.items || []).map((item: { family: string }) => item.family);
  localStorage[WEB_FONTS_CACHE_KEY] = JSON.stringify({
    fetchTime: Number(new Date()),
    fonts,
  });
  return fonts;
}
