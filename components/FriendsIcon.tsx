
import { StyleSheet, View } from "react-native";

type Props = {
  size?: number;
  color?: string;
};

export default function FriendsIcon({
  size = 35,
  color = "#63272e",
}: Props) {
  const headSize = size * 0.25;

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
      {/* Left person */}
      <View
        style={[
          styles.person,
          {
            left: size * 0.05,
          },
        ]}
      >
        <View
          style={[
            styles.head,
            {
              width: headSize,
              height: headSize,
              borderRadius: headSize / 2,
              backgroundColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.body,
            {
              width: size * 0.38,
              height: size * 0.28,
              borderTopLeftRadius: size * 0.2,
              borderTopRightRadius: size * 0.2,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      {/* Right person */}
      <View
        style={[
          styles.person,
          {
            right: size * 0.05,
          },
        ]}
      >
        <View
          style={[
            styles.head,
            {
              width: headSize,
              height: headSize,
              borderRadius: headSize / 2,
              backgroundColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.body,
            {
              width: size * 0.38,
              height: size * 0.28,
              borderTopLeftRadius: size * 0.2,
              borderTopRightRadius: size * 0.2,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  person: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
  },

  head: {
    marginBottom: 2,
  },

  body: {},
});