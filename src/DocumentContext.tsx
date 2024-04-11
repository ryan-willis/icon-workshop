import { createContext, FC, useCallback, useMemo, useState } from "react";
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
  children: any;
}

export const DocumentContextProvider: FC<DocumentContextProviderProps> = ({
  children,
}) => {
  let [values, setValues] = useState({});
  let [modules, setModules] = useState(DEFAULT_MODULES);
  let [previews, setPreviews] = useState({});

  let previousModules = usePreviousValue(modules);

  let effectiveValues = useMemo(() => {
    let ev: Record<string, any> = { ...values };

    for (let module of ALL_MODULES) {
      for (let group of module.propertyModel.groups) {
        for (let property of group.properties) {
          if ("default" in property && !(property.id in ev)) {
            ev[property.id] = property.default;
          }
        }
      }
    }

    return ev;
  }, [values]);

  let set = useCallback((propertyId: string, val: string | null) => {
    if (val === null || val === "") {
      setValues((values) => {
        let v: Record<string, any> = { ...values };
        delete v[propertyId];
        return v;
      });
    } else {
      setValues((values) => ({ ...values, [propertyId]: val }));
    }
  }, []);

  let generateContext = {
    values: effectiveValues,
    rawValues: values,
  } as unknown as GenerateContext;

  useAsyncDebouncedEffect(
    async (signal) => {
      // TODO: determine which modules are affected and only update those?
      let previews: Record<string, any> = {};
      let previewsArr = await Promise.all(
        modules.map((mod) => mod.generatePreview(generateContext))
      );
      for (let [i, module] of modules.entries()) {
        previews[module.type] = previewsArr[i];
      }
      if (signal.cancel) {
        return;
      }
      setPreviews(previews);
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
