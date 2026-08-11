
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { Picker } from "@react-native-picker/picker";

import api from "@/services/api";

export default function Edit() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [nativeLanguage, setNativeLanguage] = useState("");
  const [learnedLanguage, setLearnedLanguage] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Get current profile information
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/me");
        const user = response.data;

        setUsername(user.username ?? "");
        setDisplayName(user.displayName ?? "");
        setProfileImage(user.profilePicture ?? null);

        setNativeLanguage(user.nativeLanguage ?? "");
        setLearnedLanguage(user.learnedLanguage ?? "");
      } catch (error) {
        console.log("Error fetching profile:", error);

        Alert.alert(
          "Error",
          "Could not load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Pick profile picture
  const handlePickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow access to your photos."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleLogout = async () => { try { await AsyncStorage.removeItem("accessToken"); router.replace("/login"); } catch (error) { console.log("Logout error:", error); Alert.alert( "Error", "Could not log out." ); } };

  // Save changes
  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty.");
      return;
    }

    if (!displayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty.");
      return;
    }

    if (!nativeLanguage || !learnedLanguage) {
      Alert.alert(
        "Error",
        "Please select both languages."
      );
      return;
    }

    if (password.length > 0) {
      if (password.length < 6) {
        Alert.alert(
          "Error",
          "Password must be at least 6 characters."
        );
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(
          "Error",
          "Passwords do not match."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const data: any = {
        username: username.trim(),
        displayName: displayName.trim(),
        nativeLanguage,
        learnedLanguage,
      };

      // Only send password if user entered one
      if (password.length > 0) {
        data.password = password;
      }

      /*
        NOTE:

        profileImage is currently only changed locally.

        If your backend has an image-upload endpoint,
        we can add the upload here later.
      */

      await api.patch("/me", data);

      Alert.alert(
        "Success",
        "Your profile has been updated.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.log("Error updating profile:", error);

      Alert.alert(
        "Error",
        "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#63272e"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* HEADER */}

        <View style={styles.header}>

          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              {"<"}
            </Text>
          </Pressable>

          <Text style={styles.headerText}>
            Edit Profile
          </Text>

          <View style={styles.headerSpace} />

        </View>


        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* PROFILE PICTURE */}

          <Pressable
            style={styles.picContainer}
            onPress={handlePickImage}
          >

            {profileImage ? (

              <Image
                source={{
                  uri: profileImage,
                }}
                style={styles.profileImage}
              />

            ) : (

              <>
                <View style={styles.oneDraw} />
                <View style={styles.twoDraw} />
              </>

            )}

          </Pressable>


          <Pressable
            onPress={handlePickImage}
          >
            <Text style={styles.changePhoto}>
              Change Profile Picture
            </Text>
          </Pressable>


          {/* USERNAME */}

          <Text style={styles.label}>
            Username
          </Text>

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor="#999"
            style={styles.input}
            autoCapitalize="none"
          />


          {/* DISPLAY NAME */}

          <Text style={styles.label}>
            Display Name
          </Text>

          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display Name"
            placeholderTextColor="#999"
            style={styles.input}
          />


          {/* NATIVE LANGUAGE */}

          <Text style={styles.label}>
            Native Language
          </Text>

          <View style={styles.pickerContainer}>

            <Picker
              selectedValue={nativeLanguage}
              onValueChange={(value) =>
                setNativeLanguage(value)
              }
              style={styles.picker}
            >

              <Picker.Item
                label="Select Native Language"
                value=""
              />

              <Picker.Item
                label="English"
                value="English"
              />

              <Picker.Item
                label="Turkish"
                value="Turkish"
              />

              <Picker.Item
                label="Arabic"
                value="Arabic"
              />

              <Picker.Item
                label="French"
                value="French"
              />

              <Picker.Item
                label="Spanish"
                value="Spanish"
              />

              <Picker.Item
                label="German"
                value="German"
              />

            </Picker>

          </View>


          {/* LEARNED LANGUAGE */}

          <Text style={styles.label}>
            Learned Language
          </Text>

          <View style={styles.pickerContainer}>

            <Picker
              selectedValue={learnedLanguage}
              onValueChange={(value) =>
                setLearnedLanguage(value)
              }
              style={styles.picker}
            >

              <Picker.Item
                label="Select Learned Language"
                value=""
              />

              <Picker.Item
                label="English"
                value="English"
              />

              <Picker.Item
                label="Turkish"
                value="Turkish"
              />

              <Picker.Item
                label="Arabic"
                value="Arabic"
              />

              <Picker.Item
                label="French"
                value="French"
              />

              <Picker.Item
                label="Spanish"
                value="Spanish"
              />

              <Picker.Item
                label="German"
                value="German"
              />

            </Picker>

          </View>


          {/* PASSWORD */}

          <Text style={styles.label}>
            New Password
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Leave empty to keep current password"
            placeholderTextColor="#999"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />


          {/* CONFIRM PASSWORD */}

          <Text style={styles.label}>
            Confirm New Password
          </Text>

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#999"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />


          {/* SAVE BUTTON */}

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleSave}
            disabled={saving}
          >

            {saving ? (

              <ActivityIndicator
                color="#FDF5E6"
              />

            ) : (

              <Text style={styles.saveText}>
                Save Changes
              </Text>

            )}

          </Pressable>


          {/* CANCEL */}

          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
          >

            <Text style={styles.cancelText}>
              Cancel
            </Text>

          </Pressable>

          <Pressable
  style={({ pressed }) => [
    styles.logoutButton,
    pressed && { opacity: 0.8 },
  ]}
  onPress={handleLogout}
>
  <Text style={styles.logoutText}>
    Log Out
  </Text>
</Pressable>

        </ScrollView>

      </View>
    </SafeAreaView>




  );
}


const styles = StyleSheet.create({

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FDF5E6",
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#FDF5E6",
  },

  container: {
    flex: 1,
    backgroundColor: "#FDF5E6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },

  backButton: {
    width: 45,
    height: 45,
    borderWidth: 2,
    borderColor: "#63272e",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#63272e",
  },

  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#63272e",
  },

  headerSpace: {
    width: 45,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  picContainer: {
    width: 140,
    height: 140,

    borderWidth: 2,
    borderColor: "#63272e",

    borderRadius: 70,

    alignSelf: "center",

    marginTop: 10,

    alignItems: "center",

    justifyContent: "flex-start",

    overflow: "hidden",
  },

  profileImage: {
    width: "100%",
    height: "100%",
  },

  oneDraw: {
    width: 45,
    height: 45,

    borderRadius: 23,

    backgroundColor: "#63272e",

    marginTop: 20,
  },

  twoDraw: {
    width: 90,
    height: 70,

    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,

    backgroundColor: "#63272e",

    marginTop: 8,
  },

  changePhoto: {
    alignSelf: "center",
    marginTop: 10,

    fontSize: 15,
    fontWeight: "bold",

    color: "#63272e",
  },

  label: {
    fontSize: 17,
    fontWeight: "bold",

    color: "#63272e",

    marginTop: 20,
    marginBottom: 8,
  },

  input: {
    height: 52,

    borderWidth: 2,
    borderColor: "#63272e",

    borderRadius: 15,

    backgroundColor: "#63272e",

    paddingHorizontal: 15,

    color: "#FDF5E6",

    fontSize: 16,
  },

  pickerContainer: {
    borderWidth: 2,
    borderColor: "#63272e",

    borderRadius: 15,

    backgroundColor: "#63272e",

    overflow: "hidden",
  },

  picker: {
    color: "#FDF5E6",
    height: 55,
  },

  saveButton: {
    height: 55,

    backgroundColor: "#63272e",

    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",

    marginTop: 30,
  },

  saveText: {
    color: "#FDF5E6",

    fontSize: 18,

    fontWeight: "bold",
  },

  cancelButton: {
    height: 55,

    borderWidth: 2,
    borderColor: "#63272e",

    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",

    marginTop: 12,
  },

  cancelText: {
    color: "#63272e",

    fontSize: 18,

    fontWeight: "bold",
  },
logoutButton: { 
  height: 55,
   borderWidth: 2,
    borderColor: "#63272e", 
    borderRadius: 18, 
    justifyContent: "center",
     alignItems: "center",
      marginTop: 25,
       marginBottom: 20,
        backgroundColor: "#FDF5E6",
      
      },
      
      logoutText: {
         color: "#63272e",
          fontSize: 18,
           fontWeight: "bold", },
});