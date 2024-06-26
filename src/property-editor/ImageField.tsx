import cn from "classnames";
import {
  FC,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DocumentContext } from "../DocumentContext";
import styles from "./ImageField.module.scss";
import { Property } from "../imagelib/types";

interface ImageValue {
  svg: boolean;
  url: string;
  name: string;
  filterBlobs: boolean;
}

type PreviewFit = "contain" | "cover";

interface ImageFieldProps {
  fieldId: string;
  property: Property & {
    previewFit: PreviewFit | (() => PreviewFit);
    overlaySvg?: string;
    instructions?: string;
  };
  value: ImageValue;
  onValue: (value: ImageValue) => void;
}

export const ImageField: FC<ImageFieldProps> = ({
  fieldId,
  property,
  value,
  onValue,
}) => {
  const { values } = useContext(DocumentContext);
  const elRef = useRef<HTMLDivElement>(null);
  const [dropHover, setDropHover] = useState(false);
  const [capturePaste, setCapturePaste] = useState(false);

  const loadFromFileList = useCallback(
    async (fileList: FileList) => {
      fileList = fileList || [];
      if (!fileList.length) {
        return;
      }

      const file: File = Array.from(fileList).find((file) =>
        isValidImageFile(file)
      )!;
      if (!file) {
        alert("Please choose a valid image file (PNG, JPG, GIF, SVG, etc.)");
        return;
      }

      const url = window.URL.createObjectURL(file);
      if (value?.url) {
        // revoke previous
        window.URL.revokeObjectURL(value?.url);
      }

      onValue({
        svg: file.type === "image/svg+xml",
        url,
        name: file.name,
        filterBlobs: true,
      } as ImageValue);
    },
    [value, onValue]
  );

  useEffect(() => {
    const el = elRef.current;
    if (!el) {
      return;
    }

    let timeout: NodeJS.Timeout;

    const onDragEnter = () => {
      timeout && clearTimeout(timeout);
      setDropHover(true);
    };

    const onDragLeave = () => {
      timeout && clearTimeout(timeout);
      timeout = setTimeout(() => setDropHover(false));
    };

    const onDragOver = (ev: DragEvent) => {
      timeout && clearTimeout(timeout);
      ev.preventDefault();
      ev.dataTransfer!.dropEffect = "copy";
    };

    const onDrop = (ev: DragEvent) => {
      setDropHover(false);
      ev.stopPropagation();
      ev.preventDefault();
      loadFromFileList(ev.dataTransfer!.files);
    };

    el.addEventListener("dragenter", onDragEnter);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragenter", onDragEnter);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
    };
  }, [loadFromFileList]);

  useEffect(() => {
    if (!capturePaste) {
      return;
    }

    const handler = (ev: ClipboardEvent) => {
      const clipboardData: DataTransfer = ev.clipboardData!;
      if (clipboardData.files && clipboardData.files.length) {
        loadFromFileList(clipboardData.files);
      } else {
        const textItem = Array.from(clipboardData.items).find(
          ({ type }) => type === "text/plain"
        );
        if (textItem) {
          textItem.getAsString((str) => {
            const file = new File([str], "svg.svg", { type: "image/svg+xml" });
            loadFromFileList([file] as unknown as FileList);
          });
        }
      }
    };

    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [capturePaste, loadFromFileList]);

  // @ts-expect-error - TS doesn't know about ObjectFit
  let objectFit: ObjectFit = "contain";
  if (typeof property.previewFit === "function") {
    objectFit = property.previewFit(values);
  } else {
    objectFit = property.previewFit;
  }

  return (
    <div
      ref={elRef}
      className={cn(styles.field, {
        [styles.isDropHover]: dropHover,
      })}
    >
      <input
        id={fieldId}
        type="file"
        accept="image/*"
        onFocus={() => setCapturePaste(true)}
        onBlur={() => setCapturePaste(false)}
        onInput={(ev) => loadFromFileList(ev.currentTarget.files!)}
      />
      <div className={styles.preview}>
        {!value && <i className="material-icons">image</i>}
        {value && <img src={value?.url} style={{ objectFit }} alt="Preview" />}
        {value && property.overlaySvg && (
          <div
            className={styles.previewOverlay}
            dangerouslySetInnerHTML={{ __html: property.overlaySvg }}
          />
        )}
      </div>
      <div className={styles.instructions}>
        <h3>{value ? "Drop to replace" : "Drop image here"}</h3>
        {property.instructions && <p>{property.instructions}</p>}
      </div>
    </div>
  );
};

function isValidImageFile(file: File) {
  return !!file.type.toLowerCase().match(/^image\//);
}
