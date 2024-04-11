import cn from "classnames";
import { Children, FC, useLayoutEffect, useMemo, useState } from "react";
import styles from "./ScrollEdges.module.scss";

interface EdgeClassnames {
  left?: string;
  top?: string;
  right?: string;
  bottom?: string;
}

const WIGGLE_ROOM = 2;

interface ScrollEdgesProps {
  className?: string;
  edgeClassNames?: EdgeClassnames;
  children: any;
}

export const ScrollEdges: FC<ScrollEdgesProps> & {
  Content: FC<any>;
} = ({ className, edgeClassNames = {}, children, ...props }) => {
  let [atLeft, setAtLeft] = useState(false);
  let [atTop, setAtTop] = useState(false);
  let [atRight, setAtRight] = useState(false);
  let [atBottom, setAtBottom] = useState(false);
  let [contentEl, setContentEl] = useState<HTMLDivElement | null>(null);

  let {
    left: cnLeft,
    top: cnTop,
    right: cnRight,
    bottom: cnBottom,
  } = edgeClassNames as EdgeClassnames;

  const updateStates = (node: HTMLDivElement) => {
    if (!node) {
      return;
    }

    setAtLeft(node.scrollLeft <= WIGGLE_ROOM);
    setAtTop(node.scrollTop <= WIGGLE_ROOM);
    setAtRight(
      node.scrollLeft >= node.scrollWidth - node.offsetWidth - WIGGLE_ROOM
    );
    setAtBottom(
      node.scrollTop >= node.scrollHeight - node.offsetHeight - WIGGLE_ROOM
    );
  };

  const resizeObserver = useMemo(
    () =>
      new ResizeObserver(() => {
        if (!contentEl) {
          return;
        }

        updateStates(contentEl);
      }),
    [contentEl, updateStates]
  );

  useLayoutEffect(() => {
    if (!contentEl || !resizeObserver) {
      return;
    }

    resizeObserver.observe(contentEl);
    return () => resizeObserver.unobserve(contentEl);
  }, [contentEl, resizeObserver]);

  return (
    <div {...props} className={cn(className, styles.container)}>
      {!atLeft && !!cnLeft && <div className={cn(cnLeft, styles.left)} />}
      {!atTop && !!cnTop && <div className={cn(cnTop, styles.top)} />}
      {!atRight && !!cnRight && <div className={cn(cnRight, styles.right)} />}
      {!atBottom && !!cnBottom && (
        <div className={cn(cnBottom, styles.bottom)} />
      )}
      {Children.map(children, (child) => {
        if (child && child.type === ScrollEdges.Content) {
          return (
            <div
              {...child.props}
              className={cn(child.props.className, styles.content)}
              ref={(node) => {
                bubbleRef(child.ref, node);
                setContentEl(node!);
                node && updateStates(node);
              }}
              onScroll={(event, ...args) => {
                child.props.onScroll && child.props.onScroll(event, ...args);
                updateStates(event.currentTarget);
              }}
            />
          );
        }

        return child;
      })}
    </div>
  );
};

// register-only
ScrollEdges.Content = () => null;

function bubbleRef(
  ref: React.MutableRefObject<HTMLDivElement> | Function,
  current: HTMLDivElement | null
) {
  if (typeof ref === "function") {
    ref(current);
  } else if (!!ref) {
    ref.current = current!;
  }
}
