
// components/HomeIcon.tsx

import { View, StyleSheet } from "react-native";

type Props = {
  size?: number;
  color?: string;
};

export default function HomeIcon({
  size = 35,
  color = "#63272e",
}: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      {/* Roof */}
      <View
        style={[
          styles.roof,
          {
            borderLeftWidth: size * 0.42,
            borderRightWidth: size * 0.42,
            borderBottomWidth: size * 0.38,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: color,
          },
        ]}
      />

      {/* House */}
      <View
        style={[
          styles.house,
          {
            width: size * 0.65,
            height: size * 0.45,
            backgroundColor: color,
          },
        ]}
      />

      {/* Door */}
      <View
        style={[
          styles.door,
          {
            width: size * 0.18,
            height: size * 0.28,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-end",
  },

  roof: {
    width: 0,
    height: 0,
  },

  house: {
    alignItems: "center",
    justifyContent: "flex-end",
  },

  door: {
    backgroundColor: "#FDF5E6",
  },
});
