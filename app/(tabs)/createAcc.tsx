
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useState } from "react";

import api from "@/services/api";

export default function CreateAcc() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [Email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [nativeLang, setNativeLang] = useState("");
  const [learnLang, setLearnLang] = useState("");

  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (loading) return;

    // Required fields
    if (
      !userName.trim() ||
      !Email.trim() ||
      !password.trim()
    ) {
      Alert.alert(
        "Missing Information",
        "Please enter your username, email, and password."
      );
      return;
    }

    // Languages are required
    if (!nativeLang || !learnLang) {
      Alert.alert(
        "Missing Languages",
        "Please select your native language and the language you want to learn."
      );
      return;
    }

    // Email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(Email.trim())) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }

    // Password validation
    if (password.length < 8) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * Create the account.
       *
       * api.ts should already contain /api/v1
       * in its baseURL, so we only use /auth/register here.
       */
      const response = await api.post(
        "/auth/register",
        {
          username: userName.trim(),
          email: Email.trim(),
          password: password,

          displayName: displayName.trim(),
          bio: bio.trim(),

          nativeLanguage: nativeLang,
          learningLanguage: learnLang,
        }
      );

      console.log(
        "REGISTER SUCCESS:",
        response.data
      );

      /*
       * IMPORTANT:
       *
       * The account has already been created
       * successfully at this point.
       *
       * Now send the user to LOGIN.
       */
      Alert.alert(
        "Account Created",
        "Your account has been created successfully.",
        [
          {
            text: "Log In",
            onPress: () => {
              router.replace("/login");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "REGISTER ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      const status =
        error?.response?.status;

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.errorMessage ||
        error?.response?.data?.error;

      if (status === 409) {
        Alert.alert(
          "Account Already Exists",
          message ||
            "This email or username already exists."
        );
      } else if (status === 400) {
        Alert.alert(
          "Registration Failed",
          message ||
            "Please check your information."
        );
      } else {
        Alert.alert(
          "Registration Failed",
          message ||
            "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>
            Create Account
          </Text>

          {/* USERNAME */}
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#8B6B6F"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* EMAIL */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8B6B6F"
            value={Email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* PASSWORD */}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8B6B6F"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* DISPLAY NAME */}
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            placeholderTextColor="#8B6B6F"
            value={displayName}
            onChangeText={setDisplayName}
          />

          {/* BIO */}
          <TextInput
            style={[
              styles.input,
              styles.bioInput,
            ]}
            placeholder="Bio"
            placeholderTextColor="#8B6B6F"
            value={bio}
            onChangeText={setBio}
            multiline
          />

          {/* NATIVE LANGUAGE */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={nativeLang}
              onValueChange={(value) =>
                setNativeLang(value)
              }
            >
              <Picker.Item
                label="Native Language"
                value=""
              />

              <Picker.Item
                label="English"
                value="ENGLISH"
              />

              <Picker.Item
                label="Turkish"
                value="TURKISH"
              />

              <Picker.Item
                label="Arabic"
                value="ARABIC"
              />

              <Picker.Item
                label="French"
                value="FRENCH"
              />

              <Picker.Item
                label="Spanish"
                value="SPANISH"
              />
            </Picker>
          </View>

          {/* LEARNING LANGUAGE */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={learnLang}
              onValueChange={(value) =>
                setLearnLang(value)
              }
            >
              <Picker.Item
                label="Language to Learn"
                value=""
              />

              <Picker.Item
                label="English"
                value="ENGLISH"
              />

              <Picker.Item
                label="Turkish"
                value="TURKISH"
              />

              <Picker.Item
                label="Arabic"
                value="ARABIC"
              />

              <Picker.Item
                label="French"
                value="FRENCH"
              />

              <Picker.Item
                label="Spanish"
                value="SPANISH"
              />
            </Picker>
          </View>

          {/* CREATE ACCOUNT */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && {
                opacity: 0.8,
              },
            ]}
            onPress={handleCreateAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="white"
              />
            ) : (
              <Text style={styles.buttonText}>
                Create Account
              </Text>
            )}
          </Pressable>

          {/* LOGIN */}
          <TouchableOpacity
            onPress={() =>
              router.push("/login")
            }
            style={styles.loginButton}
          >
            <Text style={styles.loginText}>
              Already have an account? Log In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#63272e",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },

  card: {
    width: 350,
    backgroundColor: "#FDF5E6",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "white",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },

  title: {
    color: "#63272e",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  input: {
    marginTop: 20,
    width: "100%",
    height: 55,
    borderWidth: 2,
    borderRadius: 30,
    borderColor: "#63272e",
    backgroundColor: "#F5F0E6",
    paddingHorizontal: 20,
    color: "#63272e",
  },

  bioInput: {
    height: 100,
    paddingTop: 15,
    textAlignVertical: "top",
    borderRadius: 25,
  },

  pickerContainer: {
    marginTop: 20,
    width: "100%",
    height: 55,
    borderWidth: 2,
    borderRadius: 30,
    borderColor: "#63272e",
    backgroundColor: "#F5F0E6",
    justifyContent: "center",
    overflow: "hidden",
  },

  button: {
    width: 250,
    height: 70,
    backgroundColor: "#722F37",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 40,
    marginBottom: 20,
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  loginButton: {
    alignSelf: "center",
    paddingVertical: 8,
  },

  loginText: {
    color: "#63272e",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
