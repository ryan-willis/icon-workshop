import { INVENTORY_DEFAULT } from "./inventory-default";
import { INVENTORY_OUTLINED } from "./inventory-outlined";
import { INVENTORY_ROUND } from "./inventory-round";

export const ICON_SETS = {
  default: {
    label: "Filled",
    className: "material-icons",
    family: "Material Icons",
    inventory: INVENTORY_DEFAULT,
  },
  outlined: {
    label: "Outline",
    className: "material-icons-outlined",
    family: "Material Icons Outlined",
    inventory: INVENTORY_OUTLINED,
  },
  round: {
    label: "Round",
    className: "material-icons-round",
    family: "Material Icons Round",
    inventory: INVENTORY_ROUND,
  },
};
