
import { View, StyleSheet } from "react-native";

type Props = {
  size?: number;
  color?: string;
};

export default function ChatsIcon({
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
      {/* Main chat bubble */}
      <View
        style={[
          styles.bubble,
          {
            width: size * 0.72,
            height: size * 0.55,
            borderRadius: size * 0.15,
            backgroundColor: color,
          },
        ]}
      >
        <View style={styles.dotRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: "#FDF5E6" },
            ]}
          />
          <View
            style={[
              styles.dot,
              { backgroundColor: "#FDF5E6" },
            ]}
          />
          <View
            style={[
              styles.dot,
              { backgroundColor: "#FDF5E6" },
            ]}
          />
        </View>
      </View>

      {/* Small bubble */}
      <View
        style={[
          styles.smallBubble,
          {
            width: size * 0.35,
            height: size * 0.28,
            borderRadius: size * 0.1,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },

  bubble: {
    alignItems: "center",
    justifyContent: "center",
  },

  smallBubble: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },

  dotRow: {
    flexDirection: "row",
    gap: 3,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});