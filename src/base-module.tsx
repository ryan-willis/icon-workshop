import { Artifact, GenerateContext, PropertyModel } from "./imagelib/types";

export abstract class BaseModule {
  abstract type: string;
  abstract label: string;
  abstract generateArtifacts(context: GenerateContext): Promise<Artifact[]>;
  abstract generatePreview(
    context: GenerateContext
  ): Promise<{ [id: string]: string }>;
  abstract propertyModel: PropertyModel;
}
