import { StyleSheet, View } from "react-native";

type DefaultAvatarProps = {
  size?: number;
};

export default function DefaultAvatar({ size = 50 }: DefaultAvatarProps) {
  const headSize = size * 0.34;
  const bodyWidth = size * 0.67;
  const bodyHeight = size * 0.53;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {/* Head */}
      <View
        style={[
          styles.head,
          {
            width: headSize,
            height: headSize,
            borderRadius: headSize / 2,
            marginTop: size * 0.13,
          },
        ]}
      />

      {/* Body */}
      <View
        style={[
          styles.body,
          {
            width: bodyWidth,
            height: bodyHeight,
            borderTopLeftRadius: bodyWidth / 2,
            borderTopRightRadius: bodyWidth / 2,
            marginTop: size * 0.07,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    backgroundColor: "#63272e", // red wine circle
  },

  head: {
    backgroundColor: "#FDF5E6", // beige
  },

  body: {
    backgroundColor: "#FDF5E6", // beige
  },
});