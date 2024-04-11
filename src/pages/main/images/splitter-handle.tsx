import { FC } from "react";

export const SplitterHandleImage: FC = (props) => (
  <svg
    width="9"
    height="15"
    viewBox="0 0 9 15"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="1.5" cy="1.5" r="1.5" />
    <circle cx="1.5" cy="7.5" r="1.5" />
    <circle cx="1.5" cy="13.5" r="1.5" />
    <circle cx="7.5" cy="1.5" r="1.5" />
    <circle cx="7.5" cy="7.5" r="1.5" />
    <circle cx="7.5" cy="13.5" r="1.5" />
  </svg>
);
