import cn from "classnames";
import { FC, ReactElement, useContext } from "react";
import { ScrollEdges } from "../components/scroll-edges/ScrollEdges";
import { DocumentContext } from "../DocumentContext";
import { BooleanField } from "./BooleanField";
import { ClipartField } from "./clipart/ClipartField";
import { ColorField } from "./ColorField";
import { EnumField } from "./EnumField";
import { FontField } from "./FontField";
import { GradientField } from "./GradientField";
import { ImageField } from "./ImageField";
import { PaddingField } from "./PaddingField";
import styles from "./PropertyEditor.module.scss";
import { TextField } from "./TextField";
import { GenerateContext } from "../imagelib/types";
import { BaseModule } from "../base-module";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_MAP: Record<string, FC<any>> = {
  text: TextField,
  enum: EnumField,
  color: ColorField,
  font: FontField,
  clipart: ClipartField,
  image: ImageField,
  boolean: BooleanField,
  padding: PaddingField,
  gradient: GradientField,
};

interface PropertyEditorProps {
  className?: string;
  module: BaseModule;
  children?: ReactElement;
}

export const PropertyEditor: FC<PropertyEditorProps> = ({
  className,
  children,
  module,
}) => {
  const { values } = useContext(DocumentContext);

  if (!module) {
    return children;
  }

  return (
    <ScrollEdges
      className={cn(className, styles.propertyEditor)}
      edgeClassNames={{ top: styles.topScrollEdge }}
    >
      {/* @ts-expect-error wtf */}
      <ScrollEdges.Content className={styles.propertyEditorContent}>
        {module.propertyModel.groups.map(({ title, noHeader, properties }) => (
          <div className={styles.group} key={title}>
            {!noHeader && (
              <div className={styles.header}>
                <h2>{title}</h2>
              </div>
            )}
            <div className={styles.properties}>
              {properties
                .filter(({ depends }) => !depends || depends(values))
                .map((property) => (
                  <Property
                    key={property.id}
                    property={property}
                    module={module}
                  />
                ))}
            </div>
          </div>
        ))}
        {children}
      </ScrollEdges.Content>
    </ScrollEdges>
  );
};

interface PropertyProps {
  property: {
    id: keyof GenerateContext["values"];
    title: string;
    type: string;
    labelHidden?: boolean;
  };
  module: BaseModule;
}

const Property: FC<PropertyProps> = ({ property, module }) => {
  const { id, title, type, labelHidden } = property;
  const { values, rawValues, set } = useContext(DocumentContext);
  const FieldComponent = COMPONENT_MAP[type] || TextField;
  const fieldId = `prop-${module.type}-${id}`;
  return (
    <div
      data-type={type}
      className={cn(styles.property, { [styles.labelHidden]: labelHidden })}
    >
      {!labelHidden && (
        <label htmlFor={fieldId} className={styles.propertyLabel}>
          {title}
        </label>
      )}
      <FieldComponent
        fieldId={fieldId}
        property={property}
        value={rawValues[id]}
        effectiveValue={values[id]}
        onValue={(val: string) => set(id, val)}
      />
    </div>
  );
};
