




import React, {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import BottomSheet, {
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import api from "@/services/api";

import CommentsIcon from "../../components/CommentsIcon";
import ProfileIcon from "../../components/DefaultAvatar";
import LikeIcon from "../../components/LikeIcon";

type User = {
  id?: string;
  username?: string;
  email?: string;
  profile?: {
    id?: string;
    displayName?: string;
    profilePictureUrl?: string | null;
    bio?: string;
    nativeLanguage?: string;
    learningLanguage?: string;
    createdAt?: string;
  };
};

type Post = {
  id: number | string;
  title?: string | null;
  content?: string | null;
  postPictureUrl?: string | null;
  likesCount?: number;
  commentsCount?: number;
  likes?: number;
  comments?: number;
  likedByMe?: boolean;
  liked?: boolean;
  isLiked?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Comment = {
  id?: number | string;
  content?: string;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id?: string;
    username?: string;
    profile?: {
      displayName?: string;
      profilePictureUrl?: string | null;
    };
  };
  author?: {
    id?: string;
    username?: string;
    profile?: {
      displayName?: string;
      profilePictureUrl?: string | null;
    };
  };
};

export default function Profile() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [uploadingPicture, setUploadingPicture] =
    useState(false);

  const [deletingPicture, setDeletingPicture] =
    useState(false);

  const [
    selectedProfilePicture,
    setSelectedProfilePicture,
  ] = useState<string | null>(null);

  const [likedPosts, setLikedPosts] = useState<
    (number | string)[]
  >([]);

  const [likingPosts, setLikingPosts] = useState<
    (number | string)[]
  >([]);

  const fetchingProfileRef = useRef(false);

  // =========================================================
  // COMMENTS STATE
  // =========================================================

  const commentsSheetRef = useRef<BottomSheet>(null);

  const [commentsOpen, setCommentsOpen] =
    useState(false);

  const [selectedPostId, setSelectedPostId] =
    useState<number | string | null>(null);

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [loadingComments, setLoadingComments] =
    useState(false);

  const [comment, setComment] =
    useState("");

  const [sendingComment, setSendingComment] =
    useState(false);

const commentInputRef = useRef<any>(null);

  const snapPoints = ["45%", "75%"];

  // =========================================================
  // FETCH PROFILE + POSTS
  // =========================================================

  const fetchProfile = useCallback(async () => {
    if (fetchingProfileRef.current) {
      return;
    }

    fetchingProfileRef.current = true;

    try {
      // -------------------------------------------------------
      // GET CURRENT USER
      // -------------------------------------------------------

      const userResponse = await api.get("/auth/me");

      const currentUser: User | null =
        userResponse?.data ?? null;

      console.log(
        "PROFILE USER:",
        JSON.stringify(currentUser, null, 2)
      );

      if (!currentUser) {
        setUser(null);
        setPosts([]);
        setLikedPosts([]);
        return;
      }

      setUser(currentUser);

      const currentUserId = currentUser.id;

      if (!currentUserId) {
        console.log("No current user ID found.");
        setPosts([]);
        setLikedPosts([]);
        return;
      }

      // -------------------------------------------------------
      // GET USER POSTS
      // -------------------------------------------------------

      try {
        const postsResponse = await api.get(
          `/users/${currentUserId}/posts`
        );

        const responseData =
          postsResponse?.data;

        const receivedPosts: Post[] =
          Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData?.posts)
            ? responseData.posts
            : Array.isArray(responseData?.data)
            ? responseData.data
            : [];

        console.log(
          "PROFILE POSTS:",
          JSON.stringify(receivedPosts, null, 2)
        );

        console.log(
          "POST PICTURES:",
          receivedPosts.map((post) => ({
            id: post.id,
            postPictureUrl:
              post.postPictureUrl,
          }))
        );

        setPosts(receivedPosts);

        // -----------------------------------------------------
        // LIKED POSTS
        // -----------------------------------------------------

        const likedIds = receivedPosts
          .filter(
            (post) =>
              post.likedByMe === true ||
              post.liked === true ||
              post.isLiked === true
          )
          .map((post) => post.id);

        setLikedPosts(likedIds);
      } catch (postError: any) {
        console.log(
          "Posts error:",
          postError?.response?.data ||
            postError?.message ||
            postError
        );

        setPosts([]);
        setLikedPosts([]);
      }
    } catch (error: any) {
      console.log(
        "Profile error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not load your profile."
      );
    } finally {
      fetchingProfileRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =========================================================
  // LOAD WHEN PROFILE GETS FOCUS
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    if (
      refreshing ||
      fetchingProfileRef.current
    ) {
      return;
    }

    setRefreshing(true);

    await fetchProfile();
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleEditProfile = () => {
    router.push("/settings");
  };

  const handleCommunity = () => {
    router.push("/community");
  };

  // =========================================================
  // FETCH COMMENTS
  // =========================================================

  const fetchComments = async (
    postId: number | string
  ) => {
    try {
      setLoadingComments(true);

      console.log(
        "FETCHING COMMENTS FOR POST:",
        postId
      );

      const response = await api.get(
        `/posts/${postId}/comments`
      );

      console.log(
        "COMMENTS RESPONSE:",
        JSON.stringify(
          response?.data,
          null,
          2
        )
      );

      const responseData =
        response?.data;

      let receivedComments: Comment[] = [];

      if (Array.isArray(responseData)) {
        receivedComments = responseData;
      } else if (
        Array.isArray(responseData?.comments)
      ) {
        receivedComments =
          responseData.comments;
      } else if (
        Array.isArray(responseData?.data)
      ) {
        receivedComments =
          responseData.data;
      }

      setComments(receivedComments);
    } catch (error: any) {
      console.log(
        "Comments fetch error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setComments([]);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not load comments."
      );
    } finally {
      setLoadingComments(false);
    }
  };

  // =========================================================
  // OPEN COMMENTS
  // =========================================================

  const handlePostComments = async (
    postId: number | string
  ) => {
    if (sendingComment) {
      return;
    }

    setSelectedPostId(postId);
    setComments([]);
    setComment("");
    setCommentsOpen(true);

    // Open the sheet directly.
    commentsSheetRef.current?.snapToIndex(0);

    // Get comments from backend.
    await fetchComments(postId);
  };

  // =========================================================
  // CLOSE COMMENTS
  // =========================================================

  const handleCommentsClose = () => {
    setCommentsOpen(false);
    setSelectedPostId(null);
    setComments([]);
    setComment("");
  };

  // =========================================================
  // SEND COMMENT
  // =========================================================

  const handleSendComment = async () => {
    const trimmedComment =
      comment.trim();

    if (!trimmedComment) {
      return;
    }

    if (!selectedPostId) {
      return;
    }

    if (sendingComment) {
      return;
    }

    try {
      setSendingComment(true);

      console.log(
        "SENDING COMMENT:",
        trimmedComment
      );

      const response = await api.post(
        `/posts/${selectedPostId}/comments`,
        {
          content: trimmedComment,
        }
      );

      console.log(
        "CREATE COMMENT RESPONSE:",
        JSON.stringify(
          response?.data,
          null,
          2
        )
      );

      setComment("");

      // Update comment count immediately.
      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (
            String(post.id) !==
            String(selectedPostId)
          ) {
            return post;
          }

          const currentComments =
            post.commentsCount ??
            post.comments ??
            0;

          return {
            ...post,
            commentsCount:
              currentComments + 1,
          };
        })
      );

      // Reload comments so the new comment
      // appears exactly as returned by backend.
      await fetchComments(
        selectedPostId
      );
    } catch (error: any) {
      console.log(
        "Send comment error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not post your comment."
      );
    } finally {
      setSendingComment(false);
    }
  };

  // =========================================================
  // PROFILE PICTURE UPLOAD
  // =========================================================

  const handleProfilePicturePress =
    async () => {
      if (
        uploadingPicture ||
        deletingPicture
      ) {
        return;
      }

      try {
        // -----------------------------------------------------
        // REQUEST PERMISSION
        // -----------------------------------------------------

        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission needed",
            "Please allow photo access to choose a profile picture."
          );

          return;
        }

        // -----------------------------------------------------
        // PICK IMAGE
        // -----------------------------------------------------

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            }
          );

        if (result.canceled) {
          return;
        }

        const asset =
          result.assets?.[0];

        if (!asset?.uri) {
          Alert.alert(
            "Error",
            "Could not get the selected image."
          );

          return;
        }

        setSelectedProfilePicture(
          asset.uri
        );

        setUploadingPicture(true);

        // -----------------------------------------------------
        // FILE INFORMATION
        // -----------------------------------------------------

        const uri = asset.uri;

        let extension =
          uri
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        if (extension === "jpeg") {
          extension = "jpg";
        }

        let mimeType =
          "image/jpeg";

        if (extension === "png") {
          mimeType = "image/png";
        } else if (
          extension === "webp"
        ) {
          mimeType = "image/webp";
        } else if (
          extension === "heic"
        ) {
          mimeType = "image/heic";
        }

        const fileName =
          asset.fileName ||
          `profile-${Date.now()}.${extension}`;

        // -----------------------------------------------------
        // FORM DATA
        // -----------------------------------------------------

        const formData =
          new FormData();

        formData.append(
          "profilePicture",
          {
            uri,
            name: fileName,
            type: mimeType,
          } as any
        );

        console.log(
          "UPLOADING PROFILE PICTURE:",
          {
            uri,
            name: fileName,
            type: mimeType,
          }
        );

        // -----------------------------------------------------
        // GET ACCESS TOKEN
        // -----------------------------------------------------

        const token =
          await AsyncStorage.getItem(
            "accessToken"
          );

        if (!token) {
          throw new Error(
            "You are not authenticated. Please log in again."
          );
        }

        // -----------------------------------------------------
        // UPLOAD
        // -----------------------------------------------------

        const response =
          await fetch(
            "https://language-bridge.onrender.com/api/v1/profiles/me/profilePicture",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );

        // -----------------------------------------------------
        // READ SERVER RESPONSE
        // -----------------------------------------------------

        const responseText =
          await response.text();

        let responseData: any;

        try {
          responseData =
            JSON.parse(responseText);
        } catch {
          responseData = {
            message: responseText,
          };
        }

        console.log(
          "PROFILE PICTURE RESPONSE:",
          responseData
        );

        if (!response.ok) {
          throw new Error(
            responseData?.message ||
              responseData?.errorMeassge ||
              "Could not upload the profile picture."
          );
        }

        // -----------------------------------------------------
        // SUCCESS
        // -----------------------------------------------------

        setSelectedProfilePicture(
          null
        );

        await fetchProfile();

        Alert.alert(
          "Success",
          "Profile picture updated."
        );
      } catch (error: any) {
        console.log(
          "Profile picture upload error:",
          error?.message || error
        );

        setSelectedProfilePicture(
          null
        );

        Alert.alert(
          "Error",
          error?.message ||
            "Could not upload the profile picture."
        );
      } finally {
        setUploadingPicture(false);
      }
    };

  // =========================================================
  // DELETE PROFILE PICTURE
  // =========================================================

  const handleDeleteProfilePicture =
    () => {
      if (
        uploadingPicture ||
        deletingPicture
      ) {
        return;
      }

      Alert.alert(
        "Delete Profile Picture",
        "Are you sure you want to remove your profile picture?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",

            onPress: async () => {
              try {
                setDeletingPicture(true);

                await api.delete(
                  "/profiles/me/profilePicture"
                );

                setSelectedProfilePicture(
                  null
                );

                setUser(
                  (currentUser) => {
                    if (!currentUser) {
                      return currentUser;
                    }

                    return {
                      ...currentUser,
                      profile:
                        currentUser.profile
                          ? {
                              ...currentUser.profile,
                              profilePictureUrl:
                                null,
                            }
                          : currentUser.profile,
                    };
                  }
                );

                Alert.alert(
                  "Success",
                  "Profile picture deleted."
                );
              } catch (
                error: any
              ) {
                console.log(
                  "Delete profile picture error:",
                  error?.response?.data ||
                    error?.message ||
                    error
                );

                Alert.alert(
                  "Error",
                  error?.response?.data
                    ?.message ||
                    error?.response?.data
                      ?.errorMeassge ||
                    "Could not delete the profile picture."
                );
              } finally {
                setDeletingPicture(
                  false
                );
              }
            },
          },
        ]
      );
    };

  // =========================================================
  // LIKE POST
  // =========================================================

  const handleLike = async (
    postId: number | string
  ) => {
    const alreadyLiking =
      likingPosts.some(
        (id) =>
          String(id) ===
          String(postId)
      );

    if (alreadyLiking) {
      return;
    }

    const currentlyLiked =
      likedPosts.some(
        (id) =>
          String(id) ===
          String(postId)
      );

    setLikingPosts(
      (current) => [
        ...current,
        postId,
      ]
    );

    // -------------------------------------------------------
    // OPTIMISTIC LIKE STATE
    // -------------------------------------------------------

    setLikedPosts(
      (current) => {
        if (currentlyLiked) {
          return current.filter(
            (id) =>
              String(id) !==
              String(postId)
          );
        }

        return [
          ...current,
          postId,
        ];
      }
    );

    // -------------------------------------------------------
    // OPTIMISTIC COUNT
    // -------------------------------------------------------

    setPosts(
      (currentPosts) =>
        currentPosts.map(
          (post) => {
            if (
              String(post.id) !==
              String(postId)
            ) {
              return post;
            }

            const currentLikes =
              post.likesCount ??
              post.likes ??
              0;

            return {
              ...post,
              likesCount:
                currentlyLiked
                  ? Math.max(
                      0,
                      currentLikes - 1
                    )
                  : currentLikes + 1,
              likedByMe:
                !currentlyLiked,
            };
          }
        )
    );

    // -------------------------------------------------------
    // BACKEND REQUEST
    // -------------------------------------------------------

    try {
      if (currentlyLiked) {
        await api.delete(
          `/posts/${postId}/likes`
        );
      } else {
        await api.post(
          `/posts/${postId}/likes`
        );
      }
    } catch (error: any) {
      console.log(
        "Like error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      // -----------------------------------------------------
      // ROLLBACK LIKE STATE
      // -----------------------------------------------------

      setLikedPosts(
        (current) => {
          if (currentlyLiked) {
            return [
              ...current,
              postId,
            ];
          }

          return current.filter(
            (id) =>
              String(id) !==
              String(postId)
          );
        }
      );

      // -----------------------------------------------------
      // ROLLBACK COUNT
      // -----------------------------------------------------

      setPosts(
        (currentPosts) =>
          currentPosts.map(
            (post) => {
              if (
                String(post.id) !==
                String(postId)
              ) {
                return post;
              }

              const currentLikes =
                post.likesCount ??
                post.likes ??
                0;

              return {
                ...post,
                likesCount:
                  currentlyLiked
                    ? currentLikes + 1
                    : Math.max(
                        0,
                        currentLikes - 1
                      ),
                likedByMe:
                  currentlyLiked,
              };
            }
          )
      );

      Alert.alert(
        "Error",
        "Could not update the like."
      );
    } finally {
      setLikingPosts(
        (current) =>
          current.filter(
            (id) =>
              String(id) !==
              String(postId)
          )
      );
    }
  };

  // =========================================================
  // DELETE POST
  // =========================================================

  const handleDeletePost = (
    postId: number | string
  ) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            try {
              await api.delete(
                `/posts/${postId}`
              );

              setPosts(
                (currentPosts) =>
                  currentPosts.filter(
                    (post) =>
                      String(
                        post.id
                      ) !==
                      String(postId)
                  )
              );

              setLikedPosts(
                (current) =>
                  current.filter(
                    (id) =>
                      String(id) !==
                      String(postId)
                  )
              );

              Alert.alert(
                "Success",
                "Post deleted successfully."
              );
            } catch (
              error: any
            ) {
              console.log(
                "Delete post error:",
                error?.response?.data ||
                  error?.message ||
                  error
              );

              Alert.alert(
                "Error",
                error?.response?.data
                  ?.message ||
                  error?.response?.data
                    ?.errorMeassge ||
                  "Could not delete the post."
              );
            }
          },
        },
      ]
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#FDF5E6"
        />
      </SafeAreaView>
    );
  }

  // =========================================================
  // PROFILE DATA
  // =========================================================

  const profilePicture =
    selectedProfilePicture ||
    user?.profile
      ?.profilePictureUrl ||
    null;

  const nativeLanguage =
    user?.profile
      ?.nativeLanguage ||
    "Native Language";

  const learningLanguage =
    user?.profile
      ?.learningLanguage ||
    "Learning Language";

  const displayName =
    user?.profile
      ?.displayName ||
    user?.username ||
    "Username";

  // =========================================================
  // UI
  // =========================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          onPress={
            handleCommunity
          }
          style={
            styles.backButton
          }
          hitSlop={10}
        >
          <Ionicons
            name="chevron-back"
            size={29}
            color="#FDF5E6"
          />
        </Pressable>

        <Text
          style={styles.headerTitle}
        >
          Profile
        </Text>

        <Pressable
          onPress={
            handleSettings
          }
          style={
            styles.settingsButton
          }
          hitSlop={10}
        >
          <Ionicons
            name="settings-outline"
            size={30}
            color="#FDF5E6"
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor="#63272e"
          />
        }
      >
        {/* PROFILE */}

        <View
          style={
            styles.profileSection
          }
        >
          <Pressable
            onPress={
              handleProfilePicturePress
            }
            style={
              styles.profilePictureButton
            }
            disabled={
              uploadingPicture ||
              deletingPicture
            }
          >
            {profilePicture ? (
              <Image
                source={{
                  uri: profilePicture,
                }}
                style={
                  styles.profilePicture
                }
              />
            ) : (
              <View
                style={
                  styles.defaultAvatarCircle
                }
              >
                <ProfileIcon
                  size={120}
                />
              </View>
            )}

            <View
              style={
                styles.cameraButton
              }
            >
              {uploadingPicture ||
              deletingPicture ? (
                <ActivityIndicator
                  size="small"
                  color="#FDF5E6"
                />
              ) : (
                <Ionicons
                  name="camera"
                  size={18}
                  color="#FDF5E6"
                />
              )}
            </View>
          </Pressable>

          {profilePicture ? (
            <Pressable
              style={
                styles.deletePictureButton
              }
              onPress={
                handleDeleteProfilePicture
              }
              disabled={
                uploadingPicture ||
                deletingPicture
              }
            >
              <Ionicons
                name="trash-outline"
                size={17}
                color="#63272e"
              />

              <Text
                style={
                  styles.deletePictureText
                }
              >
                Delete Profile Picture
              </Text>
            </Pressable>
          ) : null}

          <Text
            style={
              styles.displayName
            }
          >
            {displayName}
          </Text>

          <Text
            style={
              styles.username
            }
          >
            @{user?.username ||
              "username"}
          </Text>

          {user?.email ? (
            <Text
              style={styles.email}
            >
              {user.email}
            </Text>
          ) : null}
        </View>

        {/* LANGUAGES */}

        <View
          style={
            styles.languagesContainer
          }
        >
          <View
            style={
              styles.languageBox
            }
          >
            <Ionicons
              name="language-outline"
              size={23}
              color="#63272e"
            />

            <Text
              style={
                styles.languageLabel
              }
            >
              Native
            </Text>

            <Text
              style={
                styles.languageValue
              }
            >
              {nativeLanguage}
            </Text>
          </View>

          <View
            style={
              styles.languageBox
            }
          >
            <Ionicons
              name="book-outline"
              size={23}
              color="#63272e"
            />

            <Text
              style={
                styles.languageLabel
              }
            >
              Learning
            </Text>

            <Text
              style={
                styles.languageValue
              }
            >
              {learningLanguage}
            </Text>
          </View>
        </View>

        {/* BIO */}

        <View
          style={styles.bioCard}
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Bio
          </Text>

          <Text
            style={styles.bioText}
          >
            {user?.profile?.bio?.trim()
              ? user.profile.bio
              : "Add bio..."}
          </Text>
        </View>

        {/* EDIT PROFILE */}

        <Pressable
          style={
            styles.editButton
          }
          onPress={
            handleEditProfile
          }
        >
          <Ionicons
            name="create-outline"
            size={19}
            color="#FDF5E6"
          />

          <Text
            style={
              styles.editButtonText
            }
          >
            Edit Profile
          </Text>
        </Pressable>

        {/* POSTS HEADER */}

        <View
          style={
            styles.postsHeader
          }
        >
          <Text
            style={
              styles.postsTitle
            }
          >
            My Posts
          </Text>

          <Text
            style={
              styles.postCount
            }
          >
            {posts.length}
          </Text>
        </View>

        {/* NO POSTS */}

        {posts.length === 0 ? (
          <View
            style={
              styles.emptyPosts
            }
          >
            <Ionicons
              name="images-outline"
              size={45}
              color="#63272e"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No posts yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Your posts will appear
              here.
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.postsContainer
            }
          >
            {posts.map(
              (post) => {
                const isLiked =
                  likedPosts.some(
                    (id) =>
                      String(id) ===
                      String(
                        post.id
                      )
                  );

                const baseLikes =
                  post.likesCount ??
                  post.likes ??
                  0;

                const commentCount =
                  post.commentsCount ??
                  post.comments ??
                  0;

                const isLiking =
                  likingPosts.some(
                    (id) =>
                      String(id) ===
                      String(
                        post.id
                      )
                  );

                return (
                  /*
                   * IMPORTANT:
                   * This remains a normal View.
                   * The whole post card is NOT clickable.
                   */

                  <View
                    key={String(
                      post.id
                    )}
                    style={
                      styles.postCard
                    }
                  >
                    {/* POST HEADER */}

                    <View
                      style={
                        styles.postTop
                      }
                    >
                      <Text
                        style={
                          styles.postLabel
                        }
                      >
                        Post
                      </Text>

                      <Pressable
                        hitSlop={10}
                        onPress={() =>
                          handleDeletePost(
                            post.id
                          )
                        }
                      >
                        <Text
                          style={
                            styles.moreButton
                          }
                        >
                          •••
                        </Text>
                      </Pressable>
                    </View>

                    {/* POST TEXT */}

                    {post.content ? (
                      <Text
                        style={
                          styles.postText
                        }
                        numberOfLines={
                          5
                        }
                      >
                        {post.content}
                      </Text>
                    ) : null}

                    {/* POST IMAGE */}

                    {post.postPictureUrl ? (
                      <Image
                        source={{
                          uri: post.postPictureUrl,
                        }}
                        style={
                          styles.postImage
                        }
                        resizeMode="cover"
                        onError={(
                          event
                        ) => {
                          console.log(
                            "POST IMAGE ERROR:",
                            event.nativeEvent
                          );
                        }}
                      />
                    ) : null}

                    {/* ACTIONS */}

                    <View
                      style={
                        styles.postActions
                      }
                    >
                      {/* LIKE */}

                      <Pressable
                        style={[
                          styles.actionButton,
                          isLiking &&
                            styles.disabledAction,
                        ]}
                        disabled={
                          isLiking
                        }
                        onPress={() =>
                          handleLike(
                            post.id
                          )
                        }
                      >
                        <LikeIcon
                          size={23}
                        />

                        <Text
                          style={[
                            styles.actionText,
                            isLiked &&
                              styles.likedText,
                          ]}
                        >
                          {baseLikes}
                        </Text>
                      </Pressable>

                      {/* COMMENTS */}

                      <Pressable
                        style={
                          styles.actionButton
                        }
                        onPress={() =>
                          handlePostComments(
                            post.id
                          )
                        }
                      >
                        <CommentsIcon
                          size={23}
                          color="#63272e"
                        />

                        <Text
                          style={
                            styles.actionText
                          }
                        >
                          {
                            commentCount
                          }
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}
      </ScrollView>

      {/* =======================================================
          COMMENTS BOTTOM SHEET
          ======================================================= */}

      {commentsOpen ? (
        <BottomSheet
          ref={
            commentsSheetRef
          }
          index={0}
          snapPoints={
            snapPoints
          }
          enablePanDownToClose
          onClose={
            handleCommentsClose
          }
          backgroundStyle={
            styles.commentsSheetBackground
          }
          handleIndicatorStyle={
            styles.commentsHandle
          }
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
        >
          <BottomSheetView
            style={
              styles.commentsSheet
            }
          >
            {/* COMMENTS HEADER */}

            <View
              style={
                styles.commentsHeader
              }
            >
              <Text
                style={
                  styles.commentsTitle
                }
              >
                Comments
              </Text>

              <Pressable
                onPress={() =>
                  commentsSheetRef.current?.close()
                }
                hitSlop={10}
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#63272e"
                />
              </Pressable>
            </View>

            {/* COMMENTS LIST */}

            <ScrollView
              style={
                styles.commentsList
              }
              contentContainerStyle={
                styles.commentsListContent
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={
                false
              }
            >
              {loadingComments ? (
                <View
                  style={
                    styles.commentsLoading
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color="#63272e"
                  />

                  <Text
                    style={
                      styles.loadingCommentsText
                    }
                  >
                    Loading comments...
                  </Text>
                </View>
              ) : comments.length ===
                0 ? (
                <View
                  style={
                    styles.noComments
                  }
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={42}
                    color="#63272e"
                  />

                  <Text
                    style={
                      styles.noCommentsTitle
                    }
                  >
                    No comments yet
                  </Text>

                  <Text
                    style={
                      styles.noCommentsText
                    }
                  >
                    Be the first to
                    comment.
                  </Text>
                </View>
              ) : (
                comments.map(
                  (
                    item,
                    index
                  ) => {
                    const author =
                      item.user ||
                      item.author;

                    const authorName =
                      author?.profile
                        ?.displayName ||
                      author?.username ||
                      "User";

                    const commentText =
                      item.content ||
                      item.text ||
                      "";

                    return (
                      <View
                        key={String(
                          item.id ??
                            index
                        )}
                        style={
                          styles.commentRow
                        }
                      >
                        {/* AVATAR */}

                        {author?.profile
                          ?.profilePictureUrl ? (
                          <Image
                            source={{
                              uri:
                                author
                                  .profile
                                  .profilePictureUrl,
                            }}
                            style={
                              styles.commentAvatar
                            }
                          />
                        ) : (
                          <View
                            style={
                              styles.commentAvatarPlaceholder
                            }
                          >
                            <Ionicons
                              name="person"
                              size={20}
                              color="#FDF5E6"
                            />
                          </View>
                        )}

                        {/* COMMENT */}

                        <View
                          style={
                            styles.commentBubble
                          }
                        >
                          <Text
                            style={
                              styles.commentAuthor
                            }
                          >
                            {
                              authorName
                            }
                          </Text>

                          <Text
                            style={
                              styles.commentContent
                            }
                          >
                            {
                              commentText
                            }
                          </Text>
                        </View>
                      </View>
                    );
                  }
                )
              )}
            </ScrollView>

            {/* COMMENT INPUT */}

            <KeyboardAvoidingView
              behavior={
                Platform.OS ===
                "ios"
                  ? "padding"
                  : undefined
              }
            >
              <View
                style={
                  styles.commentInputContainer
                }
              >
                <BottomSheetTextInput
                  ref={
                    commentInputRef
                  }
                  value={
                    comment
                  }
                  onChangeText={
                    setComment
                  }
                  placeholder="Write a comment..."
                  placeholderTextColor="#9a7c7f"
                  style={
                    styles.commentInput
                  }
                  multiline
                  maxLength={500}
                  editable={
                    !sendingComment
                  }
                />

                <Pressable
                  onPress={
                    handleSendComment
                  }
                  disabled={
                    sendingComment ||
                    !comment.trim()
                  }
                  style={[
                    styles.sendCommentButton,
                    (sendingComment ||
                      !comment.trim()) &&
                      styles.disabledSendButton,
                  ]}
                >
                  {sendingComment ? (
                    <ActivityIndicator
                      size="small"
                      color="#FDF5E6"
                    />
                  ) : (
                    <Ionicons
                      name="send"
                      size={19}
                      color="#FDF5E6"
                    />
                  )}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </BottomSheetView>
        </BottomSheet>
      ) : null}
    </SafeAreaView>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#FDF5E6",
    },

    loadingContainer: {
      flex: 1,
      backgroundColor:
        "#63272e",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    header: {
      height: 90,
      backgroundColor:
        "#63272e",
      justifyContent:
        "center",
      alignItems:
        "center",
      position:
        "relative",
      borderBottomLeftRadius:
        40,
      borderBottomRightRadius:
        40,
    },

    headerTitle: {
      color: "#FDF5E6",
      fontSize: 21,
      fontWeight: "700",
    },

    backButton: {
      position:
        "absolute",
      left: 20,
      width: 40,
      height: 40,
      borderWidth: 2,
      borderColor:
        "#FDF5E6",
      borderRadius: 15,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    settingsButton: {
      position:
        "absolute",
      right: 18,
      top: 29,
    },

    scrollContent: {
      paddingBottom: 40,
    },

    profileSection: {
      alignItems:
        "center",
      paddingTop: 25,
      paddingBottom: 20,
    },

    profilePictureButton: {
      position:
        "relative",
    },

    profilePicture: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },

    defaultAvatarCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      overflow:
        "hidden",
      justifyContent:
        "center",
      alignItems:
        "center",
      borderWidth: 3,
      borderColor:
        "#63272e",
    },

    cameraButton: {
      position:
        "absolute",
      right: 2,
      bottom: 2,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor:
        "#63272e",
      justifyContent:
        "center",
      alignItems:
        "center",
      borderWidth: 2,
      borderColor:
        "#FDF5E6",
    },

    deletePictureButton: {
      marginTop: 10,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },

    deletePictureText: {
      color: "#63272e",
      fontSize: 13,
      fontWeight:
        "600",
    },

    displayName: {
      marginTop: 13,
      fontSize: 23,
      fontWeight:
        "700",
      color: "#63272e",
    },

    username: {
      marginTop: 3,
      fontSize: 15,
      color: "#7d5559",
    },

    email: {
      marginTop: 4,
      fontSize: 14,
      color: "#8d6d70",
    },

    languagesContainer: {
      flexDirection:
        "row",
      paddingHorizontal: 16,
      gap: 12,
    },

    languageBox: {
      flex: 1,
      backgroundColor:
        "#fffaf0",
      borderRadius: 15,
      paddingVertical: 16,
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "#eadbc5",
    },

    languageLabel: {
      marginTop: 5,
      fontSize: 12,
      color: "#8d6d70",
      fontWeight:
        "600",
    },

    languageValue: {
      marginTop: 3,
      fontSize: 15,
      color: "#63272e",
      fontWeight:
        "700",
    },

    bioCard: {
      marginHorizontal: 16,
      marginTop: 15,
      padding: 17,
      backgroundColor:
        "#fffaf0",
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#eadbc5",
    },

    sectionTitle: {
      color: "#63272e",
      fontSize: 17,
      fontWeight:
        "700",
      marginBottom: 7,
    },

    bioText: {
      color: "#5f484a",
      fontSize: 15,
      lineHeight: 22,
    },

    editButton: {
      marginHorizontal: 16,
      marginTop: 15,
      height: 47,
      borderRadius: 13,
      backgroundColor:
        "#63272e",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    editButtonText: {
      color: "#FDF5E6",
      fontSize: 16,
      fontWeight:
        "700",
    },

    postsHeader: {
      marginTop: 28,
      marginHorizontal: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    postsTitle: {
      color: "#63272e",
      fontSize: 21,
      fontWeight:
        "700",
    },

    postCount: {
      marginLeft: 8,
      color: "#8d6d70",
      fontSize: 16,
    },

    postsContainer: {
      marginTop: 12,
      paddingHorizontal: 16,
      gap: 12,
    },

    postCard: {
      backgroundColor:
        "#fffaf0",
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor:
        "#eadbc5",
    },

    postTop: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    postLabel: {
      color: "#63272e",
      fontWeight:
        "700",
      fontSize: 15,
    },

    moreButton: {
      color: "#63272e",
      fontSize: 18,
      fontWeight:
        "800",
      letterSpacing: 1,
    },

    postText: {
      color: "#4f3c3e",
      fontSize: 15,
      lineHeight: 22,
      marginTop: 10,
    },

    postImage: {
      width: "100%",
      height: 220,
      borderRadius: 12,
      marginTop: 12,
    },

    postActions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 14,
      gap: 22,
    },

    actionButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },

    disabledAction: {
      opacity: 0.6,
    },

    actionText: {
      color: "#63272e",
      fontSize: 14,
      fontWeight:
        "600",
    },

    likedText: {
      fontWeight:
        "800",
    },

    emptyPosts: {
      marginHorizontal: 16,
      marginTop: 12,
      paddingVertical: 40,
      alignItems:
        "center",
      backgroundColor:
        "#fffaf0",
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#eadbc5",
    },

    emptyTitle: {
      marginTop: 10,
      color: "#63272e",
      fontSize: 18,
      fontWeight:
        "700",
    },

    emptyText: {
      marginTop: 5,
      color: "#8d6d70",
      fontSize: 14,
    },

    // =======================================================
    // COMMENTS SHEET
    // =======================================================

    commentsSheetBackground: {
      backgroundColor:
        "#FDF5E6",
      borderTopLeftRadius:
        25,
      borderTopRightRadius:
        25,
    },

    commentsHandle: {
      backgroundColor:
        "#63272e",
      width: 45,
    },

    commentsSheet: {
      flex: 1,
      paddingHorizontal: 16,
    },

    commentsHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingTop: 5,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "#eadbc5",
    },

    commentsTitle: {
      color: "#63272e",
      fontSize: 20,
      fontWeight:
        "700",
    },

    commentsList: {
      flex: 1,
    },

    commentsListContent: {
      paddingVertical: 12,
      paddingBottom: 20,
    },

    commentsLoading: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingTop: 50,
    },

    loadingCommentsText: {
      marginTop: 10,
      color: "#8d6d70",
      fontSize: 14,
    },

    noComments: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingTop: 55,
    },

    noCommentsTitle: {
      marginTop: 12,
      color: "#63272e",
      fontSize: 18,
      fontWeight:
        "700",
    },

    noCommentsText: {
      marginTop: 5,
      color: "#8d6d70",
      fontSize: 14,
    },

    commentRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      marginBottom: 14,
    },

    commentAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      marginRight: 10,
    },

    commentAvatarPlaceholder: {
      width: 42,
      height: 42,
      borderRadius: 21,
      marginRight: 10,
      backgroundColor:
        "#63272e",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    commentBubble: {
      flex: 1,
      backgroundColor:
        "#fffaf0",
      borderRadius: 14,
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor:
        "#eadbc5",
    },

    commentAuthor: {
      color: "#63272e",
      fontSize: 14,
      fontWeight:
        "700",
      marginBottom: 3,
    },

    commentContent: {
      color: "#4f3c3e",
      fontSize: 14,
      lineHeight: 20,
    },

    commentInputContainer: {
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      gap: 8,
      paddingTop: 10,
      paddingBottom: 8,
      borderTopWidth: 1,
      borderTopColor:
        "#eadbc5",
    },

    commentInput: {
      flex: 1,
      minHeight: 44,
      maxHeight: 100,
      backgroundColor:
        "#fffaf0",
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#eadbc5",
      paddingHorizontal: 16,
      paddingTop: 11,
      paddingBottom: 11,
      color: "#4f3c3e",
      fontSize: 14,
    },

    sendCommentButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        "#63272e",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    disabledSendButton: {
      opacity: 0.45,
    },
  });