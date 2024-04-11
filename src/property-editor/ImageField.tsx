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

interface ImageValue {
  svg: boolean;
  url: string;
  name: string;
  filterBlobs: boolean;
}

interface ImageFieldProps {
  fieldId: string;
  property: any;
  value: ImageValue;
  onValue: (value: ImageValue) => void;
}

export const ImageField: FC<ImageFieldProps> = ({
  fieldId,
  property,
  value,
  onValue,
}) => {
  let { values } = useContext(DocumentContext);
  let elRef = useRef<HTMLDivElement>(null);
  let [dropHover, setDropHover] = useState(false);
  let [capturePaste, setCapturePaste] = useState(false);

  let loadFromFileList = useCallback(
    async (fileList: FileList) => {
      fileList = fileList || [];
      if (!fileList.length) {
        return;
      }

      let file: File = Array.from(fileList).find((file) =>
        isValidImageFile(file)
      )!;
      if (!file) {
        alert("Please choose a valid image file (PNG, JPG, GIF, SVG, etc.)");
        return;
      }

      let url = window.URL.createObjectURL(file);
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
    let el = elRef.current;
    if (!el) {
      return;
    }

    let timeout: NodeJS.Timeout;

    let onDragEnter = () => {
      timeout && clearTimeout(timeout);
      setDropHover(true);
    };

    let onDragLeave = () => {
      timeout && clearTimeout(timeout);
      timeout = setTimeout(() => setDropHover(false));
    };

    let onDragOver = (ev: DragEvent) => {
      timeout && clearTimeout(timeout);
      ev.preventDefault();
      ev.dataTransfer!.dropEffect = "copy";
    };

    let onDrop = (ev: DragEvent) => {
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

    let handler = (ev: ClipboardEvent) => {
      let clipboardData: DataTransfer = ev.clipboardData!;
      if (clipboardData.files && clipboardData.files.length) {
        loadFromFileList(clipboardData.files);
      } else {
        let textItem = Array.from(clipboardData.items).find(
          ({ type }) => type === "text/plain"
        );
        if (textItem) {
          textItem.getAsString((str) => {
            let file = new File([str], "svg.svg", { type: "image/svg+xml" });
            loadFromFileList([file] as unknown as FileList);
          });
        }
      }
    };

    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [capturePaste, loadFromFileList]);

  let objectFit = property.previewFit;
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
