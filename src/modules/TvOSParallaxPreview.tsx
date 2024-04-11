import { FC, useState } from "react";
import styles from "./TvOSParallaxPreview.module.scss";
import cn from "classnames";
import { useMediaQuery } from "../useMediaQuery";

interface TvOSParallaxPreviewProps {
  layers: any[];
  width: number;
  height: number;
}

export const TvOSParallaxPreview: FC<TvOSParallaxPreviewProps> = ({
  layers,
  width,
  height,
}) => {
  let [isPointerDown, setPointerDown] = useState(false);
  let [isPointerHovering, setPointerHovering] = useState(false);
  let isNarrow = useMediaQuery("(max-width: 599px)");
  let scale = isNarrow ? 0.66666 : 1;

  return (
    <div
      onPointerDown={() => setPointerDown(true)}
      onPointerUp={() => setPointerDown(false)}
      onPointerEnter={() => setPointerHovering(true)}
      onPointerLeave={() => setPointerHovering(false)}
      onPointerMove={(ev) => {
        let el = ev.currentTarget;
        let r = el.getBoundingClientRect();
        el.style.setProperty(
          "--mx",
          `${((ev.clientX - r.left) / r.width) * 2 - 1}`
        );
        el.style.setProperty(
          "--my",
          `${((ev.clientY - r.top) / r.height) * 2 - 1}`
        );
      }}
      className={cn(styles.container, {
        [styles.isPointerActive]: isPointerDown || isPointerHovering,
      })}
    >
      <div
        className={styles.layers}
        style={{
          width,
          height,
          // @ts-ignore
          "--scale": scale,
        }}
      >
        {layers.map((layer, i) => (
          <img
            key={i}
            className={styles.layer}
            // @ts-ignore
            style={{ "--depth": i === 0 ? 0 : i / (layers.length - 1) }}
            src={layer}
            alt=""
          />
        ))}
        <div className={styles.shine} />
      </div>
    </div>
  );
};
