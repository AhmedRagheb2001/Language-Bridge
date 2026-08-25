import React, { useCallback, useState } from "react";
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
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "@/services/api";

type Profile = {
  id?: string;
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string | null;
  nativeLanguage?: string;
  learningLanguage?: string;
};

type User = {
  id?: string;
  username?: string;
  email?: string;
  profile?: Profile;
};

const LANGUAGES = [
  {
    label: "English",
    value: "ENGLISH",
  },
  {
    label: "Spanish",
    value: "SPANISH",
  },
  {
    label: "French",
    value: "FRENCH",
  },
  {
    label: "Arabic",
    value: "ARABIC",
  },
  {
    label: "Turkish",
    value: "TURKISH",
  },
] as const;

export default function Settings() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const [nativeLanguage, setNativeLanguage] = useState<string | null>(
    null
  );

  const [learningLanguage, setLearningLanguage] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // =========================================================
  // FETCH PROFILE
  // =========================================================

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/auth/me");

      const currentUser: User = response?.data ?? null;

      if (!currentUser) {
        setUser(null);
        return;
      }

      setUser(currentUser);

      const profile = currentUser.profile;

      setDisplayName(profile?.displayName ?? "");
      setBio(profile?.bio ?? "");

      setNativeLanguage(profile?.nativeLanguage ?? null);
      setLearningLanguage(profile?.learningLanguage ?? null);
    } catch (error: any) {
      console.log(
        "Settings profile error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data?.errorMeassge ||
          "Could not load your profile."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // LOAD SETTINGS WHEN SCREEN GETS FOCUS
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  // =========================================================
  // BACK BUTTON
  // =========================================================

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    if (loggingOut) {
      return;
    }

    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              setLoggingOut(true);

              await AsyncStorage.removeItem("accessToken");

              router.replace("/");
            } catch (error) {
              console.log("Logout error:", error);

              Alert.alert(
                "Error",
                "Could not log you out. Please try again."
              );

              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const trimmedDisplayName = displayName.trim();
    const trimmedBio = bio.trim();

    // -------------------------------------------------------
    // DISPLAY NAME VALIDATION
    // -------------------------------------------------------

    if (!trimmedDisplayName) {
      Alert.alert(
        "Error",
        "Please enter your display name."
      );
      return;
    }

    if (trimmedDisplayName.length < 7) {
      Alert.alert(
        "Error",
        "Display name must be at least 7 characters long."
      );
      return;
    }

    if (trimmedDisplayName.length > 30) {
      Alert.alert(
        "Error",
        "Display name cannot be longer than 30 characters."
      );
      return;
    }

    // -------------------------------------------------------
    // BIO VALIDATION
    // -------------------------------------------------------

    if (trimmedBio.length > 500) {
      Alert.alert(
        "Error",
        "Bio cannot be longer than 500 characters."
      );
      return;
    }

    // -------------------------------------------------------
    // LANGUAGE VALIDATION
    // -------------------------------------------------------

    if (!nativeLanguage) {
      Alert.alert(
        "Error",
        "Please select your native language."
      );
      return;
    }

    if (!learningLanguage) {
      Alert.alert(
        "Error",
        "Please select your learning language."
      );
      return;
    }

    if (nativeLanguage === learningLanguage) {
      Alert.alert(
        "Error",
        "Native language and learning language cannot be the same."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.patch(
        "/profiles/me",
        {
          displayName: trimmedDisplayName,
          bio: trimmedBio,
          nativeLanguage,
          learningLanguage,
        }
      );

      console.log(
        "PROFILE UPDATE RESPONSE:",
        response?.data
      );

      // Update local user immediately
      setUser((currentUser) => {
        if (!currentUser) {
          return currentUser;
        }

        return {
          ...currentUser,
          profile: {
            ...currentUser.profile,
            displayName: trimmedDisplayName,
            bio: trimmedBio,
            nativeLanguage,
            learningLanguage,
          },
        };
      });

      Alert.alert(
        "Success",
        "Your profile has been updated successfully."
      );
    } catch (error: any) {
      console.log(
        "Update profile error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data?.errorMeassge ||
          "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#FDF5E6"
        />
      </SafeAreaView>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={10}
          >
            <Ionicons
              name="chevron-back"
              size={29}
              color="#FDF5E6"
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Settings
          </Text>
        </View>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* ================================================= */}
          {/* ACCOUNT INFORMATION */}
          {/* ================================================= */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Account Information
            </Text>

            <View style={styles.infoCard}>
              {/* USERNAME */}

              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={21}
                  color="#63272e"
                />

                <View
                  style={
                    styles.infoTextContainer
                  }
                >
                  <Text style={styles.infoLabel}>
                    Username
                  </Text>

                  <Text style={styles.infoValue}>
                    {user?.username ||
                      "Username"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* EMAIL */}

              <View style={styles.infoRow}>
                <Ionicons
                  name="mail-outline"
                  size={21}
                  color="#63272e"
                />

                <View
                  style={
                    styles.infoTextContainer
                  }
                >
                  <Text style={styles.infoLabel}>
                    Email
                  </Text>

                  <Text style={styles.infoValue}>
                    {user?.email || "Email"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================================================= */}
          {/* PROFILE INFORMATION */}
          {/* ================================================= */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Profile Information
            </Text>

            {/* DISPLAY NAME */}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Display Name
              </Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-circle-outline"
                  size={21}
                  color="#63272e"
                />

                <TextInput
                  value={displayName}
                  onChangeText={
                    setDisplayName
                  }
                  placeholder="Enter your display name"
                  placeholderTextColor="#a88e90"
                  style={styles.input}
                  maxLength={30}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.characterCount}>
                {displayName.length}/30
              </Text>
            </View>

            {/* BIO */}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Bio
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  styles.bioInputWrapper,
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={21}
                  color="#63272e"
                  style={styles.bioIcon}
                />

                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell people a little about yourself..."
                  placeholderTextColor="#a88e90"
                  style={[
                    styles.input,
                    styles.bioInput,
                  ]}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>

              <Text style={styles.characterCount}>
                {bio.length}/500
              </Text>
            </View>
          </View>

          {/* ================================================= */}
          {/* LANGUAGES */}
          {/* ================================================= */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Languages
            </Text>

            {/* NATIVE LANGUAGE */}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Native Language
              </Text>

              <View style={styles.pickerWrapper}>
                <Ionicons
                  name="language-outline"
                  size={21}
                  color="#63272e"
                />

                <Picker
                  selectedValue={
                    nativeLanguage
                  }
                  onValueChange={(value) => {
                    if (
                      value === null ||
                      value === ""
                    ) {
                      setNativeLanguage(
                        null
                      );
                      return;
                    }

                    setNativeLanguage(
                      String(value)
                    );
                  }}
                  style={styles.picker}
                  dropdownIconColor="#63272e"
                >
                  <Picker.Item
                    label="Select native language"
                    value={null}
                  />

                  {LANGUAGES.map(
                    (language) => (
                      <Picker.Item
                        key={
                          language.value
                        }
                        label={
                          language.label
                        }
                        value={
                          language.value
                        }
                      />
                    )
                  )}
                </Picker>
              </View>
            </View>

            {/* LEARNING LANGUAGE */}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Learning Language
              </Text>

              <View style={styles.pickerWrapper}>
                <Ionicons
                  name="book-outline"
                  size={21}
                  color="#63272e"
                />

                <Picker
                  selectedValue={
                    learningLanguage
                  }
                  onValueChange={(value) => {
                    if (
                      value === null ||
                      value === ""
                    ) {
                      setLearningLanguage(
                        null
                      );
                      return;
                    }

                    setLearningLanguage(
                      String(value)
                    );
                  }}
                  style={styles.picker}
                  dropdownIconColor="#63272e"
                >
                  <Picker.Item
                    label="Select learning language"
                    value={null}
                  />

                  {LANGUAGES.map(
                    (language) => (
                      <Picker.Item
                        key={
                          language.value
                        }
                        label={
                          language.label
                        }
                        value={
                          language.value
                        }
                      />
                    )
                  )}
                </Picker>
              </View>
            </View>
          </View>

          {/* ================================================= */}
          {/* SAVE BUTTON */}
          {/* ================================================= */}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[
              styles.saveButton,
              saving &&
                styles.disabledButton,
            ]}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color="#FDF5E6"
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color="#FDF5E6"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>

          {/* ================================================= */}
          {/* LOGOUT BUTTON */}
          {/* ================================================= */}

          <Pressable
            style={[
              styles.logoutButton,
              loggingOut &&
                styles.disabledLogoutButton,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator
                size="small"
                color="#63272e"
              />
            ) : (
              <>
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color="#63272e"
                />

                <Text
                  style={
                    styles.logoutButtonText
                  }
                >
                  Logout
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF5E6",
  },

  keyboardContainer: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#63272e",
    justifyContent: "center",
    alignItems: "center",
  },

  // =======================================================
  // HEADER
  // =======================================================

  header: {
    height: 90,
    backgroundColor: "#63272e",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  headerTitle: {
    color: "#FDF5E6",
    fontSize: 21,
    fontWeight: "700",
  },

  backButton: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: "#FDF5E6",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  // =======================================================
  // SCROLL
  // =======================================================

  scrollContent: {
    paddingTop: 22,
    paddingBottom: 40,
  },

  // =======================================================
  // SECTIONS
  // =======================================================

  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },

  sectionTitle: {
    color: "#63272e",
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 11,
  },

  // =======================================================
  // ACCOUNT INFO
  // =======================================================

  infoCard: {
    backgroundColor: "#fffaf0",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#eadbc5",
    paddingHorizontal: 16,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },

  infoLabel: {
    color: "#8d6d70",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 3,
  },

  infoValue: {
    color: "#63272e",
    fontSize: 15,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#eadbc5",
  },

  // =======================================================
  // INPUTS
  // =======================================================

  inputContainer: {
    marginBottom: 16,
  },

  inputLabel: {
    color: "#63272e",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 7,
  },

  inputWrapper: {
    minHeight: 50,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#eadbc5",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  input: {
    flex: 1,
    color: "#4f3c3e",
    fontSize: 15,
    marginLeft: 9,
    paddingVertical: 11,
  },

  bioInputWrapper: {
    minHeight: 125,
    alignItems: "flex-start",
    paddingTop: 13,
  },

  bioIcon: {
    marginTop: 1,
  },

  bioInput: {
    minHeight: 100,
  },

  characterCount: {
    color: "#8d6d70",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },

  // =======================================================
  // PICKERS
  // =======================================================

  pickerWrapper: {
    height: 52,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#eadbc5",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 13,
    overflow: "hidden",
  },

  picker: {
    flex: 1,
    color: "#63272e",
    height: 52,
  },

  // =======================================================
  // SAVE
  // =======================================================

  saveButton: {
    marginHorizontal: 16,
    height: 49,
    borderRadius: 13,
    backgroundColor: "#63272e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },

  disabledButton: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: "#FDF5E6",
    fontSize: 16,
    fontWeight: "700",
  },

  // =======================================================
  // LOGOUT
  // =======================================================

  logoutButton: {
    marginHorizontal: 16,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#63272e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    marginTop: 4,
  },

  disabledLogoutButton: {
    opacity: 0.65,
  },

  logoutButtonText: {
    color: "#63272e",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },

  bottomSpace: {
    height: 20,
  },
});