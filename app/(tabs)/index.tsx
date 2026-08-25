
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to</Text>

        <Text style={styles.appName}>CypTalk</Text>

        <Text style={styles.subtitle}>
          Connect, communicate, and learn together.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#63272e",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  card: {
  width: "100%",
  maxWidth: 380,
  height: 500,
  backgroundColor: "#FDF5E6",
  borderRadius: 24,
  padding: 32,
  alignItems: "center",
  justifyContent: "center",

  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 5,
  },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 6,
},

  title: {
    marginTop: 40,
    fontSize: 24,
    color: "#63272e",
    marginBottom: 4,
  },

  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#63272e",
    textAlign: "center",
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 19,
    color: "#63272e",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    marginTop: 30,
  },

  button: {
    width: "100%",
    backgroundColor: "#63272e",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 100,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
