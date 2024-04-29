import { CSSProperties, FC } from "react";
import styles from "./ImageOverlays.module.scss";
import cn from "classnames";

interface ImageOverlaysProps {
  style?: CSSProperties;
  className?: string;
  src: string;
  width: number;
  height: number;
  overlays: {
    src: string;
    label?: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

export const ImageOverlays: FC<ImageOverlaysProps> = ({
  style,
  className,
  src,
  width,
  height,
  overlays,
}) => {
  return (
    <div style={style} className={cn(className, styles.container)}>
      <img
        className={styles.bg}
        src={src}
        alt=""
        style={{
          width,
          height,
        }}
      />
      {overlays.map(({ src, label, x, y, width, height }) => (
        <img
          key={`${x},${y},${width},${height}`}
          className={styles.previewIcon}
          src={src}
          alt={label || ""}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width,
            height,
          }}
        />
      ))}
    </div>
  );
};
