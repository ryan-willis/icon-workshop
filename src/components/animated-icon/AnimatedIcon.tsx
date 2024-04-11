import cn from "classnames";
import { FC, useEffect, useState } from "react";
import { loadImageFromUri } from "../../imagelib/imageutil";
import styles from "./AnimatedIcon.module.scss";

const ANIMATION_FPS = 60;

let uniqueCounter = 0;

interface Prep {
  id: string;
  numFrames: number;
  w: number;
  h: number;
}

interface AnimatedIconProps {
  className?: string;
  icon: string;
  animation: string;
  playing: boolean;
  onStopped?: () => void;
}

export const AnimatedIcon: FC<AnimatedIconProps> = ({
  className,
  icon,
  animation,
  playing,
  onStopped,
  ...props
}) => {
  let [prep, setPrep] = useState<Prep | null>(null);

  // preload animation info
  useEffect(() => {
    if (!animation) {
      setPrep(null);
      return;
    }

    let cancel = false;
    (async () => {
      let img = await loadImageFromUri(animation);
      if (cancel) {
        return;
      }

      setPrep({
        w: img.naturalWidth,
        h: img.naturalHeight,
        numFrames: Math.floor(img.naturalWidth / img.naturalHeight),
        id: `animated-icon-mask_${uniqueCounter++}`,
      });
    })();

    return () => {
      cancel = true;
    };
  }, [animation]);

  return (
    <div className={cn(className, styles.icon)} {...props}>
      {(!prep || !playing) && <i className="material-icons">{icon}</i>}
      {!!prep && playing && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          className={styles.sprite}
          width={`${prep.numFrames || 0}em`}
          height="1em"
          ref={(node) => {
            if (!node) {
              return;
            }

            let animSession = node.animate(
              [
                { transform: "translatex(0)" },
                { transform: `translatex(-${prep.numFrames - 1}em)` },
              ],
              {
                fill: "forwards",
                easing: `steps(${prep.numFrames - 1}, end)`,
                duration: (prep.numFrames * 1000) / ANIMATION_FPS,
                iterations: 1,
              }
            );

            animSession.onfinish = () => onStopped && onStopped();
          }}
        >
          <defs>
            <mask id={prep.id}>
              <image width="100%" height="100%" xlinkHref={animation} />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            mask={`url(#${prep.id})`}
          />
        </svg>
      )}
    </div>
  );
};
