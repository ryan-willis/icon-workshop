import { ReactNode } from "react";
import { Artifact, GenerateContext, PropertyModel } from "./imagelib/types";

export abstract class BaseModule {
  abstract type: string;
  abstract label: string;
  abstract generateArtifacts(context: GenerateContext): Promise<Artifact[]>;
  abstract renderPreview(
    x: Record<string, string>,
    { darkTheme }: { darkTheme: boolean }
  ): ReactNode;
  abstract generatePreview(
    context: GenerateContext
  ): Promise<{ [id: string]: string }>;
  abstract propertyModel: PropertyModel;
}
