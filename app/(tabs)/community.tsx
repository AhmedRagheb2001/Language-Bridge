import React, { useCallback, useState } from "react";

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
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import BottomSheet, {
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import api from "@/services/api";

import DefaultAvatarMini from "@/components/DefaultAvatarMini";

import ChatsIcon from "../../components/ChatsIcon";
import CommentsIcon from "../../components/CommentsIcon";
import FriendsIcon from "../../components/FriendsIcon";
import HomeIcon from "../../components/HomeIcon";
import LikeIcon from "../../components/LikeIcon";
import LocalAIIcon from "../../components/LocalAiIcon";

// =========================================================
// TYPES
// =========================================================

type UserProfile = {
  displayName?: string | null;
  username?: string | null;
  name?: string | null;
  profilePictureUrl?: string | null;
  profilePicture?: string | null;
  profileImage?: string | null;
  avatar?: string | null;
  imageUrl?: string | null;
};

type User = {
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  username?: string | null;
  displayName?: string | null;
  name?: string | null;
  profilePictureUrl?: string | null;
  profilePicture?: string | null;
  profileImage?: string | null;
  avatar?: string | null;
  imageUrl?: string | null;
  profile?: UserProfile | null;
  [key: string]: any;
};

type Post = {
  id: number | string;

  title?: string | null;
  content?: string | null;
  text?: string | null;
  body?: string | null;

  postPictureUrl?: string | null;
  post_picture_url?: string | null;
  postPicture?: string | null;
  pictureUrl?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  picture?: string | null;

  likesCount?: number | null;
  likeCount?: number | null;
  likes_count?: number | null;
  totalLikes?: number | null;

  commentsCount?: number | null;
  commentCount?: number | null;
  comments_count?: number | null;

  likes?: number | any[] | null;
  comments?: number | any[] | null;

  liked?: boolean | null;
  isLiked?: boolean | null;
  likedByMe?: boolean | null;
  hasLiked?: boolean | null;
  userLiked?: boolean | null;

  userId?: number | string;
  authorId?: number | string;

  username?: string | null;
  displayName?: string | null;

  profilePictureUrl?: string | null;
  profilePicture?: string | null;

  user?: User | null;
  author?: User | null;
  profile?: User | null;

  [key: string]: any;
};

type Comment = {
  id: number | string;

  content?: string | null;
  text?: string | null;
  body?: string | null;

  username?: string | null;
  displayName?: string | null;
  name?: string | null;

  userId?: number | string;
  authorId?: number | string;

  profilePictureUrl?: string | null;
  profilePicture?: string | null;

  user?: User | null;
  author?: User | null;
  profile?: User | null;

  createdAt?: string;
};

// =========================================================
// RESPONSE HELPERS
// =========================================================

const getResponseData = (response: any): any => {
  return response?.data;
};

const getArrayFromResponse = (
  data: any,
  keys: string[]
): any[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (
    data.data &&
    typeof data.data === "object"
  ) {
    for (const key of keys) {
      if (Array.isArray(data.data[key])) {
        return data.data[key];
      }
    }
  }

  return [];
};

// =========================================================
// USER HELPERS
// =========================================================

const getNestedUser = (
  item: any
): User | null => {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  if (
    item.user &&
    typeof item.user === "object"
  ) {
    return item.user;
  }

  if (
    item.author &&
    typeof item.author === "object"
  ) {
    return item.author;
  }

  if (
    item.profile &&
    typeof item.profile === "object"
  ) {
    return item.profile;
  }

  return null;
};

const getUserId = (
  user: any
): number | string | undefined => {
  if (!user) {
    return undefined;
  }

  return (
    user.id ??
    user.userId ??
    user.user_id
  );
};

const getUsername = (
  user: any
): string | null => {
  if (!user) {
    return null;
  }

  const profile =
    user.profile &&
    typeof user.profile === "object"
      ? user.profile
      : null;

  return (
    user.displayName ??
    user.username ??
    user.name ??
    profile?.displayName ??
    profile?.username ??
    profile?.name ??
    null
  );
};

const getProfilePicture = (
  user: any
): string | null => {
  if (!user) {
    return null;
  }

  const profile =
    user.profile &&
    typeof user.profile === "object"
      ? user.profile
      : null;

  return (
    user.profilePictureUrl ??
    user.profilePicture ??
    user.profileImage ??
    user.avatar ??
    user.imageUrl ??
    profile?.profilePictureUrl ??
    profile?.profilePicture ??
    profile?.profileImage ??
    profile?.avatar ??
    profile?.imageUrl ??
    null
  );
};

// =========================================================
// IMAGE URL
// =========================================================

const getImageUrl = (
  value: any
): string | null => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const trimmed = value.trim();

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("file://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  const baseURL =
    (api as any)?.defaults?.baseURL;

  if (!baseURL) {
    return trimmed;
  }

  try {
    const cleanBase = String(
      baseURL
    ).replace(/\/+$/, "");

    const serverBase =
      cleanBase.replace(
        /\/api\/v\d+\/?$/i,
        ""
      );

    if (trimmed.startsWith("/")) {
      return `${serverBase}${trimmed}`;
    }

    return `${serverBase}/${trimmed}`;
  } catch {
    return trimmed;
  }
};

// =========================================================
// ERROR MESSAGE
// =========================================================

const getErrorMessage = (
  error: any,
  fallback: string
): string => {
  const responseData =
    error?.response?.data;

  if (
    typeof responseData?.message ===
    "string"
  ) {
    return responseData.message;
  }

  if (
    typeof responseData?.error ===
    "string"
  ) {
    return responseData.error;
  }

  if (
    typeof error?.message ===
    "string"
  ) {
    return error.message;
  }

  return fallback;
};

// =========================================================
// COMMUNITY
// =========================================================

export default function Community() {
  const router = useRouter();

  // =======================================================
  // POSTS
  // =======================================================

  const [posts, setPosts] =
    useState<Post[]>([]);

  const [loadingPosts, setLoadingPosts] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  // =======================================================
  // COMMENTS
  // =======================================================

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

  // =======================================================
  // LIKES
  // =======================================================

  const [likingPosts, setLikingPosts] =
    useState<(number | string)[]>([]);

  // =======================================================
  // NORMALIZE POST
  // =======================================================

  const normalizePost = (
    raw: any
  ): Post | null => {
    if (
      !raw ||
      typeof raw !== "object"
    ) {
      return null;
    }

    const id =
      raw.id ??
      raw.postId ??
      raw.post_id;

    if (
      id === undefined ||
      id === null
    ) {
      return null;
    }

    const user =
      getNestedUser(raw);

    const liked =
      raw.likedByMe === true ||
      raw.liked === true ||
      raw.isLiked === true ||
      raw.hasLiked === true ||
      raw.userLiked === true;

    let likesCount = 0;

    if (
      typeof raw.likesCount ===
      "number"
    ) {
      likesCount =
        raw.likesCount;
    } else if (
      typeof raw.likeCount ===
      "number"
    ) {
      likesCount =
        raw.likeCount;
    } else if (
      typeof raw.likes_count ===
      "number"
    ) {
      likesCount =
        raw.likes_count;
    } else if (
      Array.isArray(raw.likes)
    ) {
      likesCount =
        raw.likes.length;
    } else if (
      typeof raw.likes ===
      "number"
    ) {
      likesCount =
        raw.likes;
    }

    let totalLikes = 0;

    if (
      typeof raw.totalLikes ===
      "number"
    ) {
      totalLikes =
        raw.totalLikes;
    } else {
      totalLikes =
        likesCount;
    }

    let commentsCount = 0;

    if (
      typeof raw.commentsCount ===
      "number"
    ) {
      commentsCount =
        raw.commentsCount;
    } else if (
      typeof raw.commentCount ===
      "number"
    ) {
      commentsCount =
        raw.commentCount;
    } else if (
      typeof raw.comments_count ===
      "number"
    ) {
      commentsCount =
        raw.comments_count;
    } else if (
      Array.isArray(raw.comments)
    ) {
      commentsCount =
        raw.comments.length;
    } else if (
      typeof raw.comments ===
      "number"
    ) {
      commentsCount =
        raw.comments;
    }

    return {
      ...raw,

      id,

      content:
        raw.content ??
        raw.text ??
        raw.body ??
        null,

      postPictureUrl:
        raw.postPictureUrl ??
        raw.post_picture_url ??
        raw.postPicture ??
        raw.pictureUrl ??
        raw.imageUrl ??
        raw.image ??
        raw.picture ??
        null,

      likesCount,

      totalLikes,

      commentsCount,

      liked,

      isLiked: liked,

      likedByMe: liked,

      user:
        user ??
        (
          raw.userId !== undefined ||
          raw.authorId !== undefined ||
          raw.username ||
          raw.displayName
            ? {
                id:
                  raw.userId ??
                  raw.authorId,

                username:
                  raw.username ??
                  null,

                displayName:
                  raw.displayName ??
                  null,

                profilePictureUrl:
                  raw.profilePictureUrl ??
                  raw.profilePicture ??
                  null,
              }
            : null
        ),
    };
  };

  // =======================================================
  // NORMALIZE COMMENT
  // =======================================================

  const normalizeComment = (
    raw: any
  ): Comment | null => {
    if (
      !raw ||
      typeof raw !== "object"
    ) {
      return null;
    }

    const id =
      raw.id ??
      raw.commentId ??
      raw.comment_id;

    if (
      id === undefined ||
      id === null
    ) {
      return null;
    }

    const user =
      getNestedUser(raw);

    return {
      ...raw,

      id,

      content:
        raw.content ??
        raw.text ??
        raw.body ??
        "",

      user:
        user ??
        (
          raw.userId !== undefined ||
          raw.authorId !== undefined ||
          raw.username ||
          raw.displayName
            ? {
                id:
                  raw.userId ??
                  raw.authorId,

                username:
                  raw.username ??
                  null,

                displayName:
                  raw.displayName ??
                  null,

                profilePictureUrl:
                  raw.profilePictureUrl ??
                  raw.profilePicture ??
                  null,
              }
            : null
        ),
    };
  };

  // =======================================================
  // FETCH POSTS
  // =======================================================

  const fetchPosts = useCallback(
    async (
      showError = true
    ) => {
      try {
        const response =
          await api.get("/posts");

        const data =
          getResponseData(response);

        console.log(
          "========== POSTS RESPONSE =========="
        );

        console.log(
          JSON.stringify(
            data,
            null,
            2
          )
        );

        console.log(
          "===================================="
        );

        const rawPosts =
          getArrayFromResponse(
            data,
            [
              "posts",
              "items",
              "results",
            ]
          );

        const normalizedPosts =
          rawPosts
            .map(normalizePost)
            .filter(
              (
                post
              ): post is Post =>
                post !== null
            );

        setPosts(
          normalizedPosts
        );
      } catch (error: any) {
        console.log(
          "FETCH POSTS ERROR:",
          error?.response?.data ??
            error?.message ??
            error
        );

        setPosts([]);

        if (showError) {
          Alert.alert(
            "Error",
            getErrorMessage(
              error,
              "Could not load posts."
            )
          );
        }
      } finally {
        setLoadingPosts(false);
        setRefreshing(false);
      }
    },
    []
  );

  // =======================================================
  // LOAD POSTS
  // =======================================================

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        if (!active) {
          return;
        }

        await fetchPosts(false);
      };

      load();

      return () => {
        active = false;
      };
    }, [fetchPosts])
  );

  // =======================================================
  // REFRESH
  // =======================================================

  const handleRefresh =
    async () => {
      if (refreshing) {
        return;
      }

      setRefreshing(true);

      await fetchPosts(false);
    };

  // =======================================================
  // LIKE / UNLIKE
  // =======================================================

  const handleLike = async (
    post: Post
  ) => {
    if (
      post.id === undefined ||
      post.id === null
    ) {
      return;
    }

    const alreadyLiking =
      likingPosts.some(
        (id) =>
          String(id) ===
          String(post.id)
      );

    if (alreadyLiking) {
      return;
    }

    const currentlyLiked =
      post.likedByMe === true;

    setLikingPosts(
      (current) => [
        ...current,
        post.id,
      ]
    );

    try {
      if (currentlyLiked) {
        await api.delete(
          `/posts/${post.id}/likes`
        );
      } else {
        await api.post(
          `/posts/${post.id}/likes`
        );
      }

      setPosts(
        (currentPosts) =>
          currentPosts.map(
            (currentPost) => {
              if (
                String(
                  currentPost.id
                ) !==
                String(post.id)
              ) {
                return currentPost;
              }

              const oldLikes =
                Number(
                  currentPost.totalLikes ??
                    currentPost.likesCount ??
                    (
                      Array.isArray(
                        currentPost.likes
                      )
                        ? currentPost.likes.length
                        : currentPost.likes
                    ) ??
                    0
                );

              const newLiked =
                !currentlyLiked;

              const newTotalLikes =
                Math.max(
                  0,
                  oldLikes +
                    (
                      newLiked
                        ? 1
                        : -1
                    )
                );

              return {
                ...currentPost,

                liked:
                  newLiked,

                isLiked:
                  newLiked,

                likedByMe:
                  newLiked,

                likesCount:
                  newTotalLikes,

                totalLikes:
                  newTotalLikes,
              };
            }
          )
      );
    } catch (error: any) {
      console.log(
        "LIKE ERROR:",
        error?.response?.data ??
          error?.message ??
          error
      );

      Alert.alert(
        "Error",
        getErrorMessage(
          error,
          "Could not update the like."
        )
      );
    } finally {
      setLikingPosts(
        (current) =>
          current.filter(
            (id) =>
              String(id) !==
              String(post.id)
          )
      );
    }
  };

  // =======================================================
  // FETCH COMMENTS
  // =======================================================

  const fetchComments =
    async (
      postId: number | string
    ) => {
      try {
        setLoadingComments(true);

        const response =
          await api.get(
            `/posts/${postId}/comments`
          );

        const data =
          getResponseData(response);

        console.log(
          "========== COMMENTS RESPONSE =========="
        );

        console.log(
          JSON.stringify(
            data,
            null,
            2
          )
        );

        console.log(
          "========================================"
        );

        const rawComments =
          getArrayFromResponse(
            data,
            [
              "comments",
              "items",
              "results",
            ]
          );

        const normalizedComments =
          rawComments
            .map(normalizeComment)
            .filter(
              (
                item
              ): item is Comment =>
                item !== null
            );

        setComments(
          normalizedComments
        );
      } catch (error: any) {
        console.log(
          "COMMENTS ERROR:",
          error?.response?.data ??
            error?.message ??
            error
        );

        setComments([]);

        Alert.alert(
          "Error",
          getErrorMessage(
            error,
            "Could not load comments."
          )
        );
      } finally {
        setLoadingComments(false);
      }
    };

  // =======================================================
  // OPEN COMMENTS
  // =======================================================

  const openComments =
    async (
      postId: number | string
    ) => {
      setSelectedPostId(
        postId
      );

      setCommentsOpen(true);
      setComments([]);
      setComment("");

      await fetchComments(
        postId
      );
    };

  // =======================================================
  // CLOSE COMMENTS
  // =======================================================

  const closeComments =
    () => {
      setCommentsOpen(false);
      setSelectedPostId(null);
      setComments([]);
      setComment("");
      setLoadingComments(false);
      setSendingComment(false);
    };

  // =======================================================
  // ADD COMMENT POST
  // =======================================================

  const submitComment =
    async () => {
      if (
        !comment.trim() ||
        selectedPostId === null ||
        sendingComment
      ) {
        return;
      }

      const postId =
        selectedPostId;

      const commentText =
        comment.trim();

      try {
        setSendingComment(true);

        let response;

        try {
          response =
            await api.post(
              `/posts/${postId}/comments`,
              {
                content:
                  commentText,
              }
            );
        } catch (firstError: any) {
          // =================================================
          // 429 RATE LIMIT
          //
          // If the server temporarily rate-limits the request,
          // wait and try the exact same request once more.
          // =================================================

          if (
            firstError?.response
              ?.status === 429
          ) {
            console.log(
              "COMMENT REQUEST WAS RATE LIMITED (429). RETRYING..."
            );

            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  2000
                )
            );

            response =
              await api.post(
                `/posts/${postId}/comments`,
                {
                  content:
                    commentText,
                }
              );
          } else {
            throw firstError;
          }
        }

        console.log(
          "NEW COMMENT RESPONSE:",
          JSON.stringify(
            response?.data,
            null,
            2
          )
        );

        const data =
          response?.data;

        /*
         * Supports:
         *
         * res.status(201).json(newComment)
         *
         * and:
         *
         * { comment: newComment }
         *
         * and:
         *
         * { data: newComment }
         */

        const rawComment =
          data?.comment ??
          data?.data?.comment ??
          data?.data ??
          data;

        const newComment =
          normalizeComment(
            rawComment
          );

        if (newComment) {
          setComments(
            (current) => [
              ...current,
              newComment,
            ]
          );
        } else {
          await fetchComments(
            postId
          );
        }

        setComment("");

        // ===================================================
        // UPDATE COMMENT COUNT
        // ===================================================

        setPosts(
          (currentPosts) =>
            currentPosts.map(
              (post) => {
                if (
                  String(
                    post.id
                  ) !==
                  String(postId)
                ) {
                  return post;
                }

                const oldComments =
                  Number(
                    post.commentsCount ??
                      (
                        Array.isArray(
                          post.comments
                        )
                          ? post.comments.length
                          : post.comments
                      ) ??
                      0
                  );

                return {
                  ...post,
                  commentsCount:
                    oldComments + 1,
                };
              }
            )
        );
      } catch (error: any) {
        console.log(
          "ADD COMMENT ERROR:",
          error?.response?.data ??
            error?.message ??
            error
        );

        // ===================================================
        // BETTER 429 MESSAGE
        // ===================================================

        if (
          error?.response
            ?.status === 429
        ) {
          Alert.alert(
            "Please wait",
            "The server is temporarily limiting requests. Please wait a few seconds and try commenting again."
          );
        } else {
          Alert.alert(
            "Error",
            getErrorMessage(
              error,
              "Could not add your comment."
            )
          );
        }
      } finally {
        setSendingComment(
          false
        );
      }
    };

  // =======================================================
  // COMMENT USER
  // =======================================================

  const handleCommentUserPress =
    (
      item: Comment
    ) => {
      const user =
        getNestedUser(item);

      const userId =
        getUserId(user) ??
        item.userId ??
        item.authorId;

      if (
        userId === undefined ||
        userId === null
      ) {
        console.log(
          "COMMENT USER ID NOT FOUND:",
          item
        );

        return;
      }

      router.push({
        pathname:
          "/seeUser" as any,

        params: {
          id: String(userId),
        },
      });
    };

  // =======================================================
  // POST USER
  // =======================================================

  const getPostUser = (
    post: Post
  ): User | null => {
    const user =
      getNestedUser(post);

    if (user) {
      return user;
    }

    if (
      post.userId !== undefined ||
      post.authorId !== undefined ||
      post.username ||
      post.displayName
    ) {
      return {
        id:
          post.userId ??
          post.authorId,

        username:
          post.username ??
          null,

        displayName:
          post.displayName ??
          null,

        profilePictureUrl:
          post.profilePictureUrl ??
          post.profilePicture ??
          null,
      };
    }

    return null;
  };

  // =======================================================
  // POST TEXT
  // =======================================================

  const getPostText = (
    post: Post
  ): string => {
    const value =
      post.content ??
      post.text ??
      post.body ??
      "";

    return typeof value ===
      "string"
      ? value
      : String(value);
  };

  // =======================================================
  // POST USERNAME
  // =======================================================

  const getPostUsername = (
    post: Post
  ): string => {
    const user =
      getPostUser(post);

    const username =
      getUsername(user);

    if (
      username &&
      username.trim()
    ) {
      return username;
    }

    return (
      post.displayName ??
      post.username ??
      "User"
    );
  };

  // =======================================================
  // POST AVATAR
  // =======================================================

  const getPostAvatar = (
    post: Post
  ): string | null => {
    const user =
      getPostUser(post);

    const picture =
      getProfilePicture(user) ??
      post.profilePictureUrl ??
      post.profilePicture ??
      null;

    return getImageUrl(
      picture
    );
  };

  // =======================================================
  // POST IMAGE
  // =======================================================

  const getPostImage = (
    post: Post
  ): string | null => {
    const image =
      post.postPictureUrl ??
      post.post_picture_url ??
      post.postPicture ??
      post.pictureUrl ??
      post.imageUrl ??
      post.image ??
      post.picture ??
      null;

    return getImageUrl(
      image
    );
  };

  // =======================================================
  // LOADING
  // =======================================================

  if (loadingPosts) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#63272e"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading posts...
        </Text>
      </View>
    );
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <View
      style={styles.container}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          Community
        </Text>

        <View
          style={
            styles.headerButtons
          }
        >
          <Pressable
            style={
              styles.addButton
            }
            onPress={() =>
              router.push(
                "/addPost"
              )
            }
          >
            <Ionicons
              name="add"
              size={27}
              color="#63272e"
            />
          </Pressable>

          <Pressable
            style={
              styles.profileButton
            }
            onPress={() =>
              router.push(
                "/profile"
              )
            }
          >
            <DefaultAvatarMini
              size={30}
            />
          </Pressable>
        </View>
      </View>

      {/* =================================================
          POSTS
      ================================================= */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          posts.length === 0 &&
            styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={
          false
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
        {posts.length === 0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Ionicons
              name="document-text-outline"
              size={55}
              color="#63272e"
            />

            <Text
              style={
                styles.emptyText
              }
            >
              No posts yet
            </Text>

            <Text
              style={
                styles.emptySubText
              }
            >
              Be the first to share
              something!
            </Text>

            <Pressable
              style={
                styles.createPostButton
              }
              onPress={() =>
                router.push(
                  "/addPost"
                )
              }
            >
              <Ionicons
                name="add"
                size={20}
                color="#FDF5E6"
              />

              <Text
                style={
                  styles.createPostText
                }
              >
                Create a post
              </Text>
            </Pressable>
          </View>
        ) : (
          posts.map((post) => {
            const liked =
              post.likedByMe ?? false;

            const likes =
              post.totalLikes ?? 0;

            const commentsCount =
              Number(
                post.commentsCount ??
                  (
                    Array.isArray(
                      post.comments
                    )
                      ? post.comments.length
                      : post.comments
                  ) ??
                  0
              );

            const postText =
              getPostText(post);

            const username =
              getPostUsername(
                post
              );

            const avatar =
              getPostAvatar(
                post
              );

            const image =
              getPostImage(
                post
              );

            const isLiking =
              likingPosts.some(
                (id) =>
                  String(id) ===
                  String(post.id)
              );

            return (
              <View
                key={String(
                  post.id
                )}
                style={
                  styles.postCard
                }
              >
                {/* =========================================
                    POST HEADER
                    ONLY THIS PART IS CLICKABLE
                ========================================= */}

                <View
                  style={
                    styles.postHeader
                  }
                >
                  <Pressable
                    style={
                      styles.postUser
                    }
                    onPress={() => {
                      const user =
                        getPostUser(
                          post
                        );

                      const userId =
                        getUserId(
                          user
                        ) ??
                        post.userId ??
                        post.authorId;

                      if (
                        userId !==
                          undefined &&
                        userId !==
                          null
                      ) {
                        router.push(
                          {
                            pathname:
                              "/seeUser" as any,
                            params: {
                              id: String(
                                userId
                              ),
                            },
                          }
                        );
                      }
                    }}
                  >
                    {avatar ? (
                      <Image
                        source={{
                          uri: avatar,
                        }}
                        style={
                          styles.postAvatar
                        }
                      />
                    ) : (
                      <DefaultAvatarMini
                        size={40}
                      />
                    )}

                    <Text
                      style={
                        styles.username
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {username}
                    </Text>
                  </Pressable>
                </View>

                {/* =========================================
                    POST TEXT

                    IMPORTANT:
                    NOT A PRESSABLE
                ========================================= */}

                {postText ? (
                  <Text
                    style={
                      styles.postText
                    }
                  >
                    {postText}
                  </Text>
                ) : null}

                {/* =========================================
                    POST IMAGE

                    IMPORTANT:
                    NOT A PRESSABLE
                ========================================= */}

                {image ? (
                  <Image
                    source={{
                      uri: image,
                    }}
                    style={
                      styles.postImage
                    }
                    resizeMode="cover"
                  />
                ) : null}

                {/* =========================================
                    ACTIONS
                ========================================= */}

                <View
                  style={
                    styles.actions
                  }
                >
                  {/* LIKE */}

                  <Pressable
                    style={
                      styles.actionButton
                    }
                    onPress={() =>
                      handleLike(
                        post
                      )
                    }
                    disabled={
                      isLiking
                    }
                  >
                    <LikeIcon
                      size={19}
                      liked={
                        liked
                      }
                    />

                    <Text
                      style={
                        styles.actionText
                      }
                    >
                      {likes}
                    </Text>
                  </Pressable>

                  {/* COMMENTS */}

                  <Pressable
                    style={
                      styles.actionButton
                    }
                    onPress={() =>
                      openComments(
                        post.id
                      )
                    }
                  >
                    <CommentsIcon
                      size={19}
                      color="#63272e"
                    />

                    <Text
                      style={
                        styles.actionText
                      }
                    >
                      {
                        commentsCount
                      }
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <View
        style={styles.navBar}
      >
        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.push(
              "/community"
            )
          }
        >
          <HomeIcon
            size={27}
            color="#FDF5E6"
          />

          <Text
            style={
              styles.navText
            }
          >
            Community
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.push(
              "/chats"
            )
          }
        >
          <ChatsIcon
            size={29}
            color="#FDF5E6"
          />

          <Text
            style={
              styles.navText
            }
          >
            Chats
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.push(
              "/friends"
            )
          }
        >
          <FriendsIcon
            size={30}
            color="#FDF5E6"
          />

          <Text
            style={
              styles.navText
            }
          >
            Friends
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.push(
              "/localAi"
            )
          }
        >
          <LocalAIIcon
            size={30}
            color="#FDF5E6"
          />

          <Text
            style={
              styles.navText
            }
          >
            Local AI
          </Text>
        </Pressable>
      </View>

      {/* =================================================
          COMMENTS BOTTOM SHEET
      ================================================= */}

      {commentsOpen && (
        <BottomSheet
          index={0}
          snapPoints={[
            "45%",
            "75%",
          ]}
          enablePanDownToClose
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          bottomInset={80}
          onClose={
            closeComments
          }
          backgroundStyle={
            styles.sheetBackground
          }
          handleIndicatorStyle={
            styles.sheetHandle
          }
        >
          <BottomSheetView
            style={
              styles.sheetContent
            }
          >
            {/* HEADER */}

            <View
              style={
                styles.sheetHeader
              }
            >
              <Text
                style={
                  styles.sheetTitle
                }
              >
                Comments
              </Text>

              <Pressable
                onPress={
                  closeComments
                }
                style={
                  styles.closeButton
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#63272e"
                />
              </Pressable>
            </View>

            {/* COMMENTS */}

            {loadingComments ? (
              <View
                style={
                  styles.commentsLoading
                }
              >
                <ActivityIndicator
                  size="small"
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
                <CommentsIcon
                  size={40}
                  color="#D8C3A5"
                />

                <Text
                  style={
                    styles.noCommentsText
                  }
                >
                  No comments yet
                </Text>

                <Text
                  style={
                    styles.noCommentsSubText
                  }
                >
                  Start the
                  conversation!
                </Text>
              </View>
            ) : (
              <ScrollView
                style={
                  styles.commentsScroll
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
              >
                {comments.map(
                  (item) => {
                    const user =
                      getNestedUser(
                        item
                      );

                    const commentUsername =
                      getUsername(
                        user
                      ) ??
                      item.displayName ??
                      item.username ??
                      item.name ??
                      "User";

                    const commentText =
                      item.content ??
                      item.text ??
                      item.body ??
                      "";

                    const commentAvatar =
                      getImageUrl(
                        getProfilePicture(
                          user
                        ) ??
                          item.profilePictureUrl ??
                          item.profilePicture ??
                          null
                      );

                    return (
                      <View
                        key={String(
                          item.id
                        )}
                        style={
                          styles.commentItem
                        }
                      >
                        {/* AVATAR */}

                        <View
                          style={
                            styles.commentAvatar
                          }
                        >
                          <Pressable
                            onPress={() =>
                              handleCommentUserPress(
                                item
                              )
                            }
                          >
                            {commentAvatar ? (
                              <Image
                                source={{
                                  uri: commentAvatar,
                                }}
                                style={
                                  styles.commentAvatarImage
                                }
                              />
                            ) : (
                              <DefaultAvatarMini
                                size={
                                  35
                                }
                              />
                            )}
                          </Pressable>
                        </View>

                        {/* COMMENT BODY */}

                        <View
                          style={
                            styles.commentBody
                          }
                        >
                          <Pressable
                            onPress={() =>
                              handleCommentUserPress(
                                item
                              )
                            }
                          >
                            <Text
                              style={
                                styles.commentUsername
                              }
                            >
                              {
                                commentUsername
                              }
                            </Text>
                          </Pressable>

                          <Text
                            style={
                              styles.commentText
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
                )}
              </ScrollView>
            )}

            {/* INPUT */}

            <KeyboardAvoidingView
              behavior={
                Platform.OS ===
                "ios"
                  ? "padding"
                  : undefined
              }
              style={
                styles.commentInputContainer
              }
            >
              <TextInput
                value={comment}
                onChangeText={
                  setComment
                }
                placeholder="Write a comment..."
                placeholderTextColor="#888"
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
                style={[
                  styles.sendButton,
                  (
                    !comment.trim() ||
                    sendingComment
                  ) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={
                  submitComment
                }
                disabled={
                  !comment.trim() ||
                  sendingComment
                }
              >
                {sendingComment ? (
                  <ActivityIndicator
                    size="small"
                    color="#FDF5E6"
                  />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color="#FDF5E6"
                  />
                )}
              </Pressable>
            </KeyboardAvoidingView>
          </BottomSheetView>
        </BottomSheet>
      )}
    </View>
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
        "#FDF5E6",
      alignItems: "center",
      justifyContent:
        "center",
    },

    loadingText: {
      marginTop: 12,
      color: "#63272e",
      fontSize: 15,
      fontWeight: "600",
    },

    // =====================================================
    // HEADER
    // =====================================================

    header: {
      height: 100,
      backgroundColor:
        "#63272e",
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent:
        "space-between",
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
    },

    title: {
      fontSize: 25,
      fontWeight: "bold",
      color: "#FDF5E6",
    },

    headerButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },

    addButton: {
      width: 42,
      height: 36,
      borderRadius: 11,
      backgroundColor:
        "#FDF5E6",
      alignItems: "center",
      justifyContent:
        "center",
    },

    profileButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent:
        "center",
    },

    // =====================================================
    // POSTS
    // =====================================================

    scroll: {
      flex: 1,
    },

    scrollContent: {
      padding: 20,
      paddingBottom: 105,
    },

    emptyContent: {
      flexGrow: 1,
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingBottom: 50,
    },

    emptyText: {
      marginTop: 15,
      fontSize: 23,
      fontWeight: "bold",
      color: "#63272e",
    },

    emptySubText: {
      marginTop: 7,
      fontSize: 15,
      color: "#777",
      textAlign: "center",
    },

    createPostButton: {
      marginTop: 22,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        "#63272e",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
      gap: 7,
    },

    createPostText: {
      color: "#FDF5E6",
      fontSize: 14,
      fontWeight: "bold",
    },

    postCard: {
      backgroundColor:
        "#D8C3A5",
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
    },

    postHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    postUser: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },

    postAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },

    username: {
      flex: 1,
      fontSize: 18,
      fontWeight: "bold",
      color: "#63272e",
    },

    postText: {
      marginTop: 12,
      fontSize: 16,
      color: "#333",
      lineHeight: 23,
    },

    postImage: {
      width: "100%",
      height: 220,
      borderRadius: 15,
      marginTop: 14,
      backgroundColor:
        "#c8b394",
    },

    // =====================================================
    // ACTIONS
    // =====================================================

    actions: {
      flexDirection: "row",
      marginTop: 20,
      gap: 12,
    },

    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#63272e",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      gap: 7,
    },

    actionText: {
      color: "#63272e",
      fontWeight: "bold",
      fontSize: 14,
    },

    // =====================================================
    // BOTTOM NAV
    // =====================================================

    navBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 78,
      backgroundColor:
        "#63272e",
      flexDirection: "row",
      justifyContent:
        "space-around",
      alignItems: "center",
      paddingHorizontal: 8,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },

    navItem: {
      width: 80,
      alignItems: "center",
      justifyContent:
        "center",
    },

    navText: {
      color: "#FDF5E6",
      fontSize: 10,
      fontWeight: "600",
      marginTop: 5,
      textAlign: "center",
    },

    // =====================================================
    // COMMENTS SHEET
    // =====================================================

    sheetBackground: {
      backgroundColor:
        "#FDF5E6",
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
    },

    sheetHandle: {
      backgroundColor:
        "#63272e",
      width: 50,
    },

    sheetContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 5,
      paddingBottom: 10,
    },

    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      minHeight: 45,
    },

    sheetTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#63272e",
    },

    closeButton: {
      position: "absolute",
      right: 0,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        "#D8C3A5",
    },

    commentsScroll: {
      flex: 1,
    },

    commentsLoading: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingTop: 50,
    },

    loadingCommentsText: {
      marginTop: 10,
      color: "#777",
      fontSize: 14,
    },

    noComments: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
    },

    noCommentsText: {
      marginTop: 12,
      fontSize: 17,
      fontWeight: "bold",
      color: "#63272e",
    },

    noCommentsSubText: {
      marginTop: 5,
      fontSize: 14,
      color: "#888",
    },

    commentItem: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      paddingVertical: 10,
    },

    commentAvatar: {
      width: 35,
      height: 35,
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 10,
    },

    commentAvatarImage: {
      width: 35,
      height: 35,
      borderRadius: 17.5,
    },

    commentBody: {
      flex: 1,
      backgroundColor:
        "#D8C3A5",
      borderRadius: 15,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    commentUsername: {
      color: "#63272e",
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 3,
    },

    commentText: {
      color: "#333",
      fontSize: 14,
      lineHeight: 20,
    },

    // =====================================================
    // COMMENT INPUT
    // =====================================================

    commentInputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      paddingBottom: 5,
    },

    commentInput: {
      flex: 1,
      minHeight: 45,
      maxHeight: 100,
      backgroundColor:
        "#D8C3A5",
      borderRadius: 18,
      paddingHorizontal: 15,
      paddingVertical: 11,
      fontSize: 15,
      color: "#333",
    },

    sendButton: {
      width: 45,
      height: 45,
      borderRadius: 18,
      backgroundColor:
        "#63272e",
      alignItems: "center",
      justifyContent:
        "center",
    },

    sendButtonDisabled: {
      opacity: 0.45,
    },
  });