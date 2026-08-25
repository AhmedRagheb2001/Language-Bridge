import React from "react";
import Svg, {
  Circle,
  Path,
} from "react-native-svg";

type SearchIconProps = {
  size?: number;
  color?: string;
};

export default function SearchIcon({
  size = 24,
  color = "#63272e",
}: SearchIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Circle
        cx="11"
        cy="11"
        r="6.5"
        stroke={color}
        strokeWidth="2"
      />

      <Path
        d="M16 16L21 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}