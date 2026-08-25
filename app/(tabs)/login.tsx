
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

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";

import api from "@/services/api";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter your email and password."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const { accessToken, refreshToken, user } = response.data;

      if (!accessToken) {
        throw new Error("No access token received.");
      }

      // Save access token
      await AsyncStorage.setItem(
        "accessToken",
        accessToken
      );

      // Save refresh token if the backend sends one
      if (refreshToken) {
        await AsyncStorage.setItem(
          "refreshToken",
          refreshToken
        );
      }

      // Save user returned by the backend
      if (user) {
        await AsyncStorage.setItem(
          "user",
          JSON.stringify(user)
        );
      }

      console.log("LOGIN SUCCESS");
      console.log("USER:", user);

      // Login is successful → go to Profile
      router.replace("/profile");
    } catch (error: any) {
      console.log(
        "LOGIN ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.errorMessage ||
        error?.response?.data?.error ||
        "Invalid email or password.";

      Alert.alert("Login Failed", message);
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
          {/* EMAIL */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8B6B6F"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
          />

          {/* PASSWORD */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#8B6B6F"
              value={password}
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(!showPassword)
              }
              style={styles.eyeButton}
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-off"
                    : "eye"
                }
                size={24}
                color="#63272e"
              />
            </TouchableOpacity>
          </View>

          {/* LOGIN BUTTON */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                Log In
              </Text>
            )}
          </Pressable>

          {/* OR */}
          <Text style={styles.orText}>
            OR
          </Text>

          {/* CREATE ACCOUNT */}
          <Pressable
            style={({ pressed }) => [
              styles.createAccountButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() =>
              router.push("/(tabs)/createAcc")
            }
          >
            <Text style={styles.createAccountText}>
              Create Account
            </Text>
          </Pressable>
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
  },

  card: {
    borderWidth: 2,
    backgroundColor: "#FDF5E6",
    width: 350,
    borderRadius: 50,
    borderColor: "white",
    paddingVertical: 20,
  },

  input: {
    marginTop: 20,
    marginLeft: 25,
    width: 300,
    height: 55,
    borderWidth: 2,
    borderRadius: 30,
    borderColor: "#63272e",
    backgroundColor: "#F5F0E6",
    paddingHorizontal: 20,
    color: "#63272e",
  },

  passwordContainer: {
    marginTop: 20,
    marginLeft: 25,
    width: 300,
    height: 55,
    borderWidth: 2,
    borderRadius: 30,
    borderColor: "#63272e",
    backgroundColor: "#F5F0E6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  passwordInput: {
    flex: 1,
    color: "#63272e",
  },

  eyeButton: {
    paddingLeft: 10,
  },

  button: {
    width: 250,
    height: 70,
    backgroundColor: "#722F37",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 50,
    marginBottom: 30,
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  createAccountButton: {
    alignSelf: "center",
    marginBottom: 25,
    paddingVertical: 8,
  },

  createAccountText: {
    color: "#63272e",
    fontSize: 19,
    fontWeight: "600",
    textDecorationLine: "underline",
    marginTop: 15,
  },

  orText: {
    alignSelf: "center",
    textAlign: "center",
    fontSize: 16,
    color: "#63272e",
  },
});
