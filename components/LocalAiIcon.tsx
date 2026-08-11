
// components/LocalAIIcon.tsx

import { View, Text, StyleSheet } from "react-native";

type Props = {
  size?: number;
  color?: string;
};

export default function LocalAIIcon({
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
      {/* AI circle */}
      <View
        style={[
          styles.circle,
          {
            width: size * 0.75,
            height: size * 0.75,
            borderRadius: size * 0.375,
            borderColor: color,
          },
        ]}
      >
        <Text
          style={[
            styles.ai,
            {
              color,
              fontSize: size * 0.25,
            },
          ]}
        >
          AI
        </Text>
      </View>

      {/* Small connection dots */}
      <View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            top: size * 0.02,
            right: size * 0.02,
          },
        ]}
      />

      <View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            bottom: size * 0.02,
            left: size * 0.02,
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

  circle: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  ai: {
    fontWeight: "bold",
  },

  dot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});