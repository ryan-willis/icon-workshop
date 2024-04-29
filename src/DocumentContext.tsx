import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { AndroidModule } from "./modules/android-module";
import { AndroidTVModule } from "./modules/android-tv-module";
import { IosModule } from "./modules/ios-module";
import { MacosModule } from "./modules/macos-module";
import { PlayStoreModule } from "./modules/playstore-module";
import { TvOSModule } from "./modules/tvos-module";
import { WatchOSModule } from "./modules/watchos-module";
import { WebModule } from "./modules/web-module";
import { useAsyncDebouncedEffect } from "./useAsyncDebouncedEffect";
import { usePreviousValue } from "./usePreviousValue";
import { GenerateContext } from "./imagelib/types";
import { BaseModule } from "./base-module";

export const DocumentContext = createContext<GenerateContext>({
  values: {},
  rawValues: {},
});

export const ALL_MODULES = [
  AndroidModule,
  IosModule,
  WebModule,
  MacosModule,
  WatchOSModule,
  TvOSModule,
  AndroidTVModule,
  PlayStoreModule,
];

export const DEFAULT_MODULES = [MacosModule, IosModule];

const PREVIEW_THROTTLE_MS = 300;

interface DocumentContextProviderProps {
  children: ReactNode;
}

export const DocumentContextProvider: FC<DocumentContextProviderProps> = ({
  children,
}) => {
  const [values, setValues] = useState({});
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const [previews, setPreviews] = useState({});
  const previousModules = usePreviousValue<BaseModule[]>(
    modules as BaseModule[]
  );
  const effectiveValues = useMemo(() => {
    const ev: Record<string, string | number> = { ...values };

    for (const module of ALL_MODULES) {
      for (const group of module.propertyModel.groups) {
        for (const property of group.properties) {
          if ("default" in property && !(property.id in ev)) {
            ev[property.id] = property.default as string;
          }
        }
      }
    }

    return ev;
  }, [values]);

  const set = useCallback((propertyId: string, val: string | null) => {
    if (val === null || val === "") {
      setValues((values) => {
        const v: Record<string, string | number> = { ...values };
        delete v[propertyId];
        return v;
      });
    } else {
      setValues((values) => ({ ...values, [propertyId]: val }));
    }
  }, []);

  const generateContext = {
    values: effectiveValues,
    rawValues: values,
  } as unknown as GenerateContext;

  useAsyncDebouncedEffect(
    async (signal) => {
      // TODO: determine which modules are affected and only update those?
      const previews: Record<
        string,
        {
          [id: string]: string;
        }
      > = {};
      const previewsArr = await Promise.all(
        modules.map((mod) => mod.generatePreview(generateContext))
      );
      for (const [i, module] of modules.entries()) {
        previews[module.type] = previewsArr[i];
      }
      if (signal.cancel) {
        return;
      }
      setPreviews(previews);
    },
    {
      delay: PREVIEW_THROTTLE_MS,
      leadingEdge: true,
      immediate: () =>
        !Object.keys(previews).length || modules !== previousModules,
    },
    [values, modules, previousModules]
  );

  return (
    <DocumentContext.Provider
      value={{
        rawValues: values,
        values: effectiveValues,
        modules,
        setModules,
        previews,
        set,
        setAllValues: setValues,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};
