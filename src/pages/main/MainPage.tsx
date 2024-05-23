import {
  CSSProperties,
  FC,
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { Action, ActionPack } from "../../components/action-pack/ActionPack";
import { AnimatedIcon } from "../../components/animated-icon/AnimatedIcon";
import { Splitter } from "../../components/splitter/Splitter";
import {
  ALL_MODULES,
  DocumentContext,
  DocumentContextProvider,
} from "../../DocumentContext";
import { PropertyEditor } from "../../property-editor/PropertyEditor";
import { documentFromUrl, documentToUrl } from "../../serialization";
import { useAsyncDebouncedEffect } from "../../useAsyncDebouncedEffect";
import { useKeyboardMode } from "../../useKeyboardMode";
import { useMediaQuery } from "../../useMediaQuery";
import { useTimedConfirmation } from "../../useTimedConfirmation";
import { downloadFile, generateZip } from "../../util";
import { SplitterHandleImage } from "./images/splitter-handle";
import DownloadCheckAnimation from "./images/sprite-download-check-white@2x.png";
import styles from "./MainPage.module.scss";
import { ModulePicker } from "./ModulePicker";
import { LogoImage } from "./images/logo";
import { BaseModule } from "../../base-module";
import { Artifact } from "../../imagelib/types";

export const MainPage: FC = (props) => {
  return (
    <DocumentContextProvider>
      <MainPageInner {...props} />
    </DocumentContextProvider>
  );
};

const MainPageInner: FC = () => {
  const [darkTheme, setDarkTheme] = useState(
    window.localStorage.darkTheme !== "false"
  );
  const [activeModule, setActiveModule] = useState<BaseModule>();
  const context = useContext(DocumentContext);
  const { rawValues, setAllValues, set, setModules } = context;
  const [isGeneratingZip, setGeneratingZip] = useState(false);
  const [animateDownloadIcon, setAnimateDownloadIcon] = useState(false);
  const [splitSize, setSplitSize] = useState(30);
  const [isConfirmingCopy, confirmCopy, clearConfirmCopy] =
    useTimedConfirmation(3000);
  const isNarrow = useMediaQuery("(max-width: 599px)");

  useKeyboardMode(document.body, "is-keyboard-mode");

  const { modules } = context;

  // path handling
  // TODO: refactor to react-router
  useLayoutEffect(() => {
    const path = document.location.pathname.replace(/^\/i\//, "");
    if (!path || path === "/") {
      return;
    }
    try {
      const { values, modules: moduleTypes } = documentFromUrl(path);
      setAllValues(values);
      const modules = moduleTypes
        .map((type) => ALL_MODULES.find((m) => m.type === type))
        .filter((m) => !!m);
      setModules(modules);
      setTimeout(() => setActiveModule(modules[0] as BaseModule));
    } catch (e) {
      console.warn("Invalid path, starting from scratch.");
    }
  }, [setAllValues, setModules]);

  useAsyncDebouncedEffect(
    async () => {
      if (Object.keys(rawValues).length > 0) {
        const hash = `/i/${documentToUrl({
          values: rawValues,
          modules: modules.map(({ type }: { type: string }) => type),
        })}`;
        window.history.replaceState(null, "", hash);
      }
    },
    { delay: 500 },
    [rawValues, modules]
  );

  useLayoutEffect(() => {
    window.localStorage.darkTheme = !!darkTheme;
    document.body.classList.toggle("dark-theme", darkTheme);
    set("darkTheme", darkTheme);
  }, [darkTheme, set]);

  useEffect(() => {
    // swallow up accidental drops
    const el = document.body;
    const onDrop = (ev: DragEvent) => {
      ev.preventDefault();
    };
    const onDragOver = (ev: DragEvent) => {
      ev.preventDefault();
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  useEffect(() => {
    if (modules.length === 0) {
      setActiveModule(undefined);
      return;
    }

    if (!activeModule || modules.indexOf(activeModule) < 0) {
      setActiveModule(modules[0]);
    }
  }, [modules, activeModule]);

  const generateAndDownload = async () => {
    (async () => {
      // @ts-ignore
      window.umami.track("download", { types: modules.map((m) => m.type) });
    })().catch(() => void 0);
    setAnimateDownloadIcon(false);
    setGeneratingZip(true);
    try {
      const m = [...modules];
      const pairs = (
        await Promise.all(m.map((m) => m.generateArtifacts(context)))
      ).map((a, i) => [m[i], a]);
      let allArtifacts: Artifact[] = [];
      for (const [module, artifacts] of pairs) {
        allArtifacts = allArtifacts.concat(
          artifacts.map((a: Artifact) => ({
            ...a,
            filename: `${module.type}/${a.filename}`,
          }))
        );
      }
      // note: JSZip handles promises in artifact content
      const zipBlob = await generateZip(allArtifacts);
      downloadFile(zipBlob, "IconWorkshop.zip");
      setAnimateDownloadIcon(true);
    } finally {
      setGeneratingZip(false);
    }
  };

  return (
    <div
      className={styles.page}
      style={{ "--split-size": `${splitSize}vw` } as unknown as CSSProperties}
    >
      <Header />
      <Toolbar>
        <ModulePicker
          activeModule={activeModule!}
          onChange={(m) => setActiveModule(m)}
        />
        <ActionPack className={styles.toolbarButtons}>
          <Action
            primary
            disabled={isGeneratingZip || !activeModule}
            onClick={() => {
              generateAndDownload();
            }}
            icon={
              <AnimatedIcon
                icon="file_download"
                animation={DownloadCheckAnimation}
                playing={animateDownloadIcon}
                onStopped={() => setAnimateDownloadIcon(false)}
              />
            }
            label={isGeneratingZip ? "Generating..." : "Download"}
          />
          <Action
            icon="link"
            tooltip={isConfirmingCopy ? "Copied!" : "Copy link"}
            onHideTooltip={() => clearConfirmCopy()}
            disabled={!activeModule}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              confirmCopy();
            }}
            overflow={isNarrow}
          />
          <Action
            icon={darkTheme ? "brightness_7" : "brightness_2"}
            tooltip={
              darkTheme ? "Switch to light theme" : "Switch to dark theme"
            }
            onClick={() => setDarkTheme(!darkTheme)}
            overflow={isNarrow}
          />
          <Action
            icon="delete_sweep"
            tooltip="Start over"
            onClick={() => (window.location.href = "/")}
            overflow={true}
          />
        </ActionPack>
      </Toolbar>
      {activeModule && (
        <PropertyEditor
          className={styles.propertyEditor}
          module={activeModule}
        />
      )}
      <Preview module={activeModule} darkTheme={darkTheme}>
        <Splitter
          className={styles.splitter}
          storageKey="property-editor"
          thickness={24}
          min={0}
          max={50}
          onResize={(splitSize) => setSplitSize(splitSize)}
        >
          <SplitterHandleImage />
        </Splitter>
      </Preview>
    </div>
  );
};

const Header: FC = () => {
  return (
    <header className={styles.header}>
      <LogoImage className={styles.logo} />
      <h1>Icon Workshop</h1>
      <p className={styles.subtitle}>App Icon Creator</p>
    </header>
  );
};

interface ToolbarProps {
  children: React.ReactNode;
}
const Toolbar: FC<ToolbarProps> = ({ children }) => {
  return <div className={styles.toolbar}>{children}</div>;
};

interface PreviewProps {
  module: BaseModule | undefined;
  darkTheme: boolean;
  children: React.ReactNode;
}

const Preview: FC<PreviewProps> = ({ module, children, darkTheme }) => {
  const { previews } = useContext(DocumentContext);

  return (
    <div className={styles.preview}>
      {children}
      {module && (
        <>
          {!!Object.keys(previews[module.type] || {}).length &&
            (module.renderPreview ? (
              <Fragment key={module.type}>
                {module.renderPreview(previews[module.type], { darkTheme })}
              </Fragment>
            ) : (
              <SimplePreview
                module={module}
                imgSrc={previews[module.type].main}
              />
            ))}
        </>
      )}
    </div>
  );
};

interface SimplePreviewProps {
  module: BaseModule;
  imgSrc: string;
}

const SimplePreview: FC<SimplePreviewProps> = ({ module, imgSrc }) => {
  return (
    <div className={styles.simplePreview}>
      <img src={imgSrc} alt={`Preview of ${module.label} output`} />
    </div>
  );
};
