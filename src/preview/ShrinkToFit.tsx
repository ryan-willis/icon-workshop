import {
  CSSProperties,
  FC,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./ShrinkToFit.module.scss";
import cn from "classnames";

interface ShrinkToFitProps {
  style?: CSSProperties;
  className?: string;
  children: ReactNode | ReactNode[];
}

export const ShrinkToFit: FC<ShrinkToFitProps> = ({
  style,
  className,
  children,
}) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  const resizeObserver = useMemo(
    () =>
      new ResizeObserver(() => {
        if (!container || !contentRef.current) {
          return;
        }

        setScale(
          Math.min(1, container.offsetWidth / contentRef.current.offsetWidth)
        );
      }),
    [container]
  );

  useLayoutEffect(() => {
    if (!container || !resizeObserver) {
      return;
    }

    resizeObserver.observe(container);
    return () => resizeObserver.unobserve(container);
  }, [container, resizeObserver]);

  return (
    <div
      style={style}
      className={cn(className, styles.container)}
      ref={(container) => setContainer(container)}
    >
      <div ref={contentRef} className={styles.content} style={{ zoom: scale }}>
        {children}
      </div>
    </div>
  );
};
