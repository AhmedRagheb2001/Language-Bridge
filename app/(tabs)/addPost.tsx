import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import DefaultAvatar from "@/components/DefaultAvatar";
import api from "@/services/api";

// =========================================================
// TYPES
// =========================================================

type User = {
  id?: number | string;
  username?: string | null;
  displayName?: string | null;

  profilePictureUrl?: string | null;
  profilePicture?: string | null;

  profile?: {
    displayName?: string | null;
    username?: string | null;
    profilePictureUrl?: string | null;
    profilePicture?: string | null;
  } | null;
};

// =========================================================
// ADD POST
// =========================================================

export default function AddPost() {
  const router = useRouter();

  // =======================================================
  // USER
  // =======================================================

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // =======================================================
  // POST
  // =======================================================

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // =======================================================
  // LOAD CURRENT USER
  // =======================================================

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");

      const currentUser =
        response?.data?.user ??
        response?.data?.data?.user ??
        response?.data;

      console.log(
        "CURRENT USER:",
        JSON.stringify(currentUser, null, 2)
      );

      setUser(currentUser);
    } catch (error: any) {
      console.log(
        "Load current user error:",
        error?.response?.data ||
          error?.message ||
          error
      );
    } finally {
      setLoadingUser(false);
    }
  };

  // =======================================================
  // BACK
  // =======================================================

  const handleBack = () => {
    router.replace("/community");
  };

  // =======================================================
  // GALLERY
  // =======================================================

  const openGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to your gallery."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Gallery error:", error);

      Alert.alert(
        "Error",
        "Could not open the gallery."
      );
    }
  };

  // =======================================================
  // CAMERA
  // =======================================================

  const openCamera = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to your camera."
        );
        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Camera error:", error);

      Alert.alert(
        "Error",
        "Could not open the camera."
      );
    }
  };

  // =======================================================
  // REMOVE IMAGE
  // =======================================================

  const removeImage = () => {
    setImage(null);
  };

  // =======================================================
  // CAN POST
  // =======================================================

  const canPost =
    title.trim().length > 0 &&
    content.trim().length > 0;

  // =======================================================
  // CREATE POST
  // =======================================================

  const handleCreatePost = async () => {
    if (!canPost || loading) {
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      // ===================================================
      // TEXT
      // ===================================================

      formData.append(
        "title",
        title.trim()
      );

      formData.append(
        "content",
        content.trim()
      );

      // ===================================================
      // IMAGE
      // ===================================================

      if (image) {
        const filename =
          image.split("/").pop() ||
          `post-${Date.now()}.jpg`;

        const extension =
          filename
            .split(".")
            .pop()
            ?.toLowerCase();

        let mimeType = "image/jpeg";

        if (extension === "png") {
          mimeType = "image/png";
        } else if (extension === "webp") {
          mimeType = "image/webp";
        } else if (
          extension === "jpg" ||
          extension === "jpeg"
        ) {
          mimeType = "image/jpeg";
        }

        formData.append(
          "postPicture",
          {
            uri: image,
            name: filename,
            type: mimeType,
          } as any
        );
      }

      // ===================================================
      // DEBUG
      // ===================================================

      console.log(
        "CREATING POST:",
        {
          title: title.trim(),
          content: content.trim(),
          image,
        }
      );

      // ===================================================
      // SEND TO BACKEND
      // ===================================================

      const response = await api.post(
        "/posts/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(
        "POST CREATED:",
        JSON.stringify(
          response?.data,
          null,
          2
        )
      );

      // ===================================================
      // SUCCESS
      // ===================================================

      Alert.alert(
        "Success",
        "Your post was created.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/community");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "Create post error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Could not create the post.";

      Alert.alert(
        "Error",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // USER DISPLAY
  // =======================================================

  const displayName =
    user?.displayName ||
    user?.username ||
    user?.profile?.displayName ||
    user?.profile?.username ||
    "User";

  const profilePicture =
    user?.profilePictureUrl ||
    user?.profilePicture ||
    user?.profile?.profilePictureUrl ||
    user?.profile?.profilePicture ||
    null;

  // =======================================================
  // LOADING
  // =======================================================

  if (loadingUser) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#63272e"
        />

        <Text
          style={styles.loadingText}
        >
          Loading...
        </Text>
      </View>
    );
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
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
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={10}
        >
          <Ionicons
            name="chevron-back"
            size={34}
            color="#FDF5E6"
          />
        </Pressable>

        <Text
          style={styles.headerTitle}
        >
          New Post
        </Text>
      </View>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <View style={styles.content}>
        {/* USER ROW */}

        <View style={styles.userRow}>
          {/* AVATAR */}

          <View style={styles.avatarCircle}>
            {profilePicture ? (
              <Image
                source={{
                  uri: profilePicture,
                }}
                style={styles.profileImage}
                onError={() => {
                  console.log(
                    "PROFILE IMAGE ERROR:",
                    profilePicture
                  );
                }}
              />
            ) : (
              <DefaultAvatar
                size={56}
              />
            )}
          </View>

          {/* POST AREA */}

          <View style={styles.postArea}>
            <Text
              style={styles.displayName}
              numberOfLines={1}
            >
              {displayName}
            </Text>

            {/* TITLE */}

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor="#A8A8A8"
              style={styles.titleInput}
              maxLength={100}
              autoCapitalize="sentences"
            />

            {/* CONTENT */}

            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What's new?"
              placeholderTextColor="#A8A8A8"
              multiline
              textAlignVertical="top"
              style={styles.textInput}
              autoCapitalize="sentences"
            />

            {/* MEDIA BUTTONS */}

            <View
              style={styles.mediaButtons}
            >
              {/* GALLERY */}

              <Pressable
                style={styles.mediaButton}
                onPress={openGallery}
              >
                <Ionicons
                  name="image-outline"
                  size={34}
                  color="#63272E"
                />
              </Pressable>

              {/* CAMERA */}

              <Pressable
                style={styles.mediaButton}
                onPress={openCamera}
              >
                <Ionicons
                  name="camera-outline"
                  size={34}
                  color="#63272E"
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ================================================= */}
        {/* IMAGE PREVIEW */}
        {/* ================================================= */}

        {image && (
          <View
            style={
              styles.imagePreviewContainer
            }
          >
            <Image
              source={{
                uri: image,
              }}
              style={styles.imagePreview}
            />

            <Pressable
              style={
                styles.removeImageButton
              }
              onPress={removeImage}
            >
              <Ionicons
                name="close"
                size={20}
                color="#FDF5E6"
              />
            </Pressable>
          </View>
        )}
      </View>

      {/* ================================================= */}
      {/* POST BUTTON */}
      {/* ================================================= */}

      <View
        style={styles.bottomContainer}
      >
        <Pressable
          style={[
            styles.postButton,
            !canPost &&
              styles.postButtonDisabled,
          ]}
          onPress={handleCreatePost}
          disabled={
            !canPost || loading
          }
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#FDF5E6"
            />
          ) : (
            <Text
              style={
                styles.postButtonText
              }
            >
              Post
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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

  loadingContainer: {
    flex: 1,
    backgroundColor: "#FDF5E6",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#63272e",
    fontSize: 15,
    fontWeight: "600",
  },

  // =======================================================
  // HEADER
  // =======================================================

  header: {
    height: 100,
    backgroundColor: "#63272e",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: "relative",
  },

  backButton: {
    position: "absolute",
    left: 20,
    bottom: 17,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FDF5E6",
    fontSize: 25,
    fontWeight: "bold",
  },

  // =======================================================
  // CONTENT
  // =======================================================

  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 30,
  },

  // =======================================================
  // USER
  // =======================================================

  userRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  // =======================================================
  // AVATAR
  // =======================================================

  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "#63272E",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 18,
  },

  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  // =======================================================
  // POST AREA
  // =======================================================

  postArea: {
    flex: 1,
  },

  displayName: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#63272E",
    marginTop: 2,
    marginBottom: 5,
  },

  // =======================================================
  // TITLE
  // =======================================================

  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#63272E",
    paddingHorizontal: 12,
    paddingVertical: 0,
    marginBottom: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: "#63272e",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    height: 50,
  },

  // =======================================================
  // CONTENT
  // =======================================================

  textInput: {
    minHeight: 120,
    fontSize: 18,
    color: "#63272E",
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 0,
    borderWidth: 2,
    borderColor: "#63272e",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  // =======================================================
  // MEDIA
  // =======================================================

  mediaButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 10,
  },

  mediaButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  // =======================================================
  // IMAGE PREVIEW
  // =======================================================

  imagePreviewContainer: {
    marginTop: 25,
    width: "100%",
    height: 280,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E5DCCF",
  },

  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#63272e",
    alignItems: "center",
    justifyContent: "center",
  },

  // =======================================================
  // BOTTOM
  // =======================================================

  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom:
      Platform.OS === "ios"
        ? 25
        : 20,
    paddingTop: 10,
  },

  postButton: {
    width: "100%",
    height: 58,
    borderRadius: 29,
    backgroundColor: "#63272e",
    alignItems: "center",
    justifyContent: "center",
  },

  postButtonDisabled: {
    backgroundColor: "#8d8687",
  },

  postButtonText: {
    color: "#FDF5E6",
    fontSize: 18,
    fontWeight: "bold",
  },
});