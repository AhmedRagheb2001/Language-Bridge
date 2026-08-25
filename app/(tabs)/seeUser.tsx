import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import api from "@/services/api";

import CommentsIcon from "../../components/CommentsIcon";
import DefaultAvatar from "../../components/DefaultAvatar";
import LikeIcon from "../../components/LikeIcon";

type Profile = {
  id?: string;
  userId?: string;
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string | null;
  nativeLanguage?: string;
  learningLanguage?: string;
};

type User = {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  profile?: Profile | null;
};

type Post = {
  id: string | number;

  title?: string;
  content?: string;
  text?: string;

  postPictureUrl?: string | null;
  imageUrl?: string | null;
  image?: string | null;

  likesCount?: number;
  commentsCount?: number;

  likes?: number;
  comments?: number;

  likedByMe?: boolean;
  isLiked?: boolean;

  user?: {
    id?: string;
    username?: string;

    profile?: {
      displayName?: string;
      profilePictureUrl?: string | null;
    };
  };
};

type FriendRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
};

type Comment = {
  id: string;
  content: string;
  userId?: string;
  postId?: string;
  createdAt?: string;

  user?: {
    profile?: {
      displayName?: string;
      profilePictureUrl?: string | null;
    };
  };
};

export default function SeeUser() {
  const router = useRouter();

  const params = useLocalSearchParams();

  // =========================================================
  // USER ID
  // =========================================================

  const userId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : typeof params.user_id === "string"
      ? params.user_id
      : Array.isArray(params.user_id)
      ? params.user_id[0]
      : "";

  // =========================================================
  // STATE
  // =========================================================

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [friendStatus, setFriendStatus] = useState<
    "none" | "pending" | "friends" | "received"
  >("none");

  const [friendRequestId, setFriendRequestId] =
    useState<string | null>(null);

  const [friendshipId, setFriendshipId] =
    useState<string | null>(null);

  const [friendLoading, setFriendLoading] =
    useState(false);

  // =========================================================
  // LIKE STATE
  // =========================================================

  const [likedPosts, setLikedPosts] =
    useState<Record<string, boolean>>({});

  const [postLikes, setPostLikes] =
    useState<Record<string, number>>({});

  const [likeLoading, setLikeLoading] =
    useState<Record<string, boolean>>({});

  // =========================================================
  // COMMENT STATE
  // =========================================================

  const [commentsByPost, setCommentsByPost] =
    useState<Record<string, Comment[]>>({});

  const [commentsOpen, setCommentsOpen] =
    useState<Record<string, boolean>>({});

  const [commentsLoading, setCommentsLoading] =
    useState<Record<string, boolean>>({});

  const [commentText, setCommentText] =
    useState<Record<string, string>>({});

  const [commentSending, setCommentSending] =
    useState<Record<string, boolean>>({});

  // =========================================================
  // HELPERS
  // =========================================================

  const getProfileFromResponse = (
    data: any
  ): Profile | null => {
    if (!data) return null;

    return (
      data.profileFound ??
      data.profile ??
      data.userFound?.profile ??
      data.user?.profile ??
      data
    );
  };

  const getUserFromResponse = (data: any): any => {
    if (!data) return null;

    return (
      data.userFound ??
      data.user ??
      data
    );
  };

  const getPostsFromResponse = (
    data: any
  ): Post[] => {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.posts)) {
      return data.posts;
    }

    if (Array.isArray(data.userPosts)) {
      return data.userPosts;
    }

    if (Array.isArray(data.allPosts)) {
      return data.allPosts;
    }

    if (Array.isArray(data.postsFound)) {
      return data.postsFound;
    }

    if (Array.isArray(data.postFound)) {
      return data.postFound;
    }

    return [];
  };

  // =========================================================
  // FRIEND STATUS
  // =========================================================

  const fetchFriendStatus = async () => {
    if (!userId) return;

    setFriendStatus("none");
    setFriendRequestId(null);
    setFriendshipId(null);

    // -------------------------------------------------------
    // FRIENDS
    // -------------------------------------------------------

    try {
      const response = await api.get("/friends");

      const data = response.data;

      const friends = Array.isArray(data)
        ? data
        : data?.friends ??
          data?.friendships ??
          data?.friendsFound ??
          [];

      const foundFriend = friends.find(
        (friend: any) => {
          const possibleUserId =
            friend?.id ??
            friend?.userId ??
            friend?.friendId ??
            friend?.user?.id ??
            friend?.friend?.id;

          return (
            String(possibleUserId) ===
            String(userId)
          );
        }
      );

      if (foundFriend) {
        setFriendStatus("friends");

        setFriendshipId(
          foundFriend.friendshipId ??
            foundFriend.friendship?.id ??
            foundFriend.id ??
            null
        );

        return;
      }
    } catch (error: any) {
      console.log(
        "Friends check error:",
        error?.response?.data ||
          error?.message ||
          error
      );
    }

    // -------------------------------------------------------
    // SENT REQUESTS
    // -------------------------------------------------------

    try {
      const response = await api.get(
        "/friend-requests/sent"
      );

      const data = response.data;

      const requests = Array.isArray(data)
        ? data
        : data?.requests ??
          data?.sentRequests ??
          data?.friendRequests ??
          [];

      const request = requests.find(
        (item: FriendRequest) =>
          String(item.receiverId) ===
            String(userId) &&
          String(item.status).toUpperCase() ===
            "PENDING"
      );

      if (request) {
        setFriendStatus("pending");
        setFriendRequestId(request.id);

        return;
      }
    } catch (error: any) {
      console.log(
        "Sent requests check error:",
        error?.response?.data ||
          error?.message ||
          error
      );
    }

    // -------------------------------------------------------
    // RECEIVED REQUESTS
    // -------------------------------------------------------

    try {
      const response = await api.get(
        "/friend-requests/received"
      );

      const data = response.data;

      const requests = Array.isArray(data)
        ? data
        : data?.requests ??
          data?.receivedRequests ??
          data?.friendRequests ??
          [];

      const request = requests.find(
        (item: FriendRequest) =>
          String(item.senderId) ===
            String(userId) &&
          String(item.status).toUpperCase() ===
            "PENDING"
      );

      if (request) {
        setFriendStatus("received");
        setFriendRequestId(request.id);

        return;
      }
    } catch (error: any) {
      console.log(
        "Received requests check error:",
        error?.response?.data ||
          error?.message ||
          error
      );
    }

    setFriendStatus("none");
    setFriendRequestId(null);
    setFriendshipId(null);
  };

  // =========================================================
  // FETCH COMMENTS
  // =========================================================

  const fetchComments = async (
    postId: string
  ) => {
    if (!postId) return;

    try {
      setCommentsLoading((previous) => ({
        ...previous,
        [postId]: true,
      }));

      console.log(
        "GET COMMENTS FOR POST:",
        postId
      );

      const response = await api.get(
        `/posts/${postId}/comments`
      );

      console.log(
        "COMMENTS RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      const receivedComments =
        Array.isArray(response.data)
          ? response.data
          : response.data?.comments ??
            response.data?.allComments ??
            [];

      setCommentsByPost((previous) => ({
        ...previous,
        [postId]: receivedComments,
      }));
    } catch (error: any) {
      console.log(
        "GET COMMENTS ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setCommentsByPost((previous) => ({
        ...previous,
        [postId]: [],
      }));

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not load comments."
      );
    } finally {
      setCommentsLoading((previous) => ({
        ...previous,
        [postId]: false,
      }));
    }
  };

  // =========================================================
  // TOGGLE COMMENTS
  // =========================================================

  const handleCommentsPress = async (
    postId: string
  ) => {
    const currentlyOpen =
      commentsOpen[postId] ?? false;

    if (currentlyOpen) {
      setCommentsOpen((previous) => ({
        ...previous,
        [postId]: false,
      }));

      return;
    }

    setCommentsOpen((previous) => ({
      ...previous,
      [postId]: true,
    }));

    if (!commentsByPost[postId]) {
      await fetchComments(postId);
    }
  };

  // =========================================================
  // ADD COMMENT
  // =========================================================

  const handleAddComment = async (
    postId: string
  ) => {
    const content =
      commentText[postId]?.trim() || "";

    if (!content) {
      return;
    }

    if (commentSending[postId]) {
      return;
    }

    try {
      setCommentSending((previous) => ({
        ...previous,
        [postId]: true,
      }));

      console.log(
        "ADDING COMMENT TO POST:",
        postId
      );

      const response = await api.post(
        `/posts/${postId}/comments`,
        {
          content,
        }
      );

      console.log(
        "ADD COMMENT RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      const newComment: Comment =
        response.data;

      setCommentsByPost((previous) => ({
        ...previous,
        [postId]: [
          ...(previous[postId] ?? []),
          newComment,
        ],
      }));

      setCommentText((previous) => ({
        ...previous,
        [postId]: "",
      }));

      setPosts((previousPosts) =>
        previousPosts.map((post) => {
          if (
            String(post.id) !==
            String(postId)
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
    } catch (error: any) {
      console.log(
        "ADD COMMENT ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not add your comment."
      );
    } finally {
      setCommentSending((previous) => ({
        ...previous,
        [postId]: false,
      }));
    }
  };

  // =========================================================
  // TOGGLE LIKE
  // =========================================================

  const handleLikePress = async (
    postId: string
  ) => {
    if (likeLoading[postId]) {
      return;
    }

    const currentlyLiked =
      likedPosts[postId] ?? false;

    try {
      setLikeLoading((previous) => ({
        ...previous,
        [postId]: true,
      }));

      console.log(
        currentlyLiked
          ? "DISLIKING POST:"
          : "LIKING POST:",
        postId
      );

      let response;

      if (currentlyLiked) {
        response = await api.delete(
          `/posts/${postId}/likes`
        );
      } else {
        response = await api.post(
          `/posts/${postId}/likes`
        );
      }

      console.log(
        "LIKE RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      const newLiked =
        response.data?.isLiked ??
        !currentlyLiked;

      const totalLikes =
        response.data?.totalLikes;

      setLikedPosts((previous) => ({
        ...previous,
        [postId]: newLiked,
      }));

      setPostLikes((previous) => ({
        ...previous,
        [postId]:
          typeof totalLikes === "number"
            ? totalLikes
            : Math.max(
                0,
                (previous[postId] ?? 0) +
                  (newLiked ? 1 : -1)
              ),
      }));

      setPosts((previousPosts) =>
        previousPosts.map((post) => {
          if (
            String(post.id) !==
            String(postId)
          ) {
            return post;
          }

          const oldLikes =
            postLikes[postId] ??
            post.likesCount ??
            post.likes ??
            0;

          const calculatedLikes =
            typeof totalLikes === "number"
              ? totalLikes
              : Math.max(
                  0,
                  oldLikes +
                    (newLiked ? 1 : -1)
                );

          return {
            ...post,
            likesCount:
              calculatedLikes,
            likedByMe: newLiked,
            isLiked: newLiked,
          };
        })
      );
    } catch (error: any) {
      console.log(
        "LIKE ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      if (error?.response?.status === 409) {
        setLikedPosts((previous) => ({
          ...previous,
          [postId]: true,
        }));

        Alert.alert(
          "Already Liked",
          "You already liked this post."
        );

        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not update the like."
      );
    } finally {
      setLikeLoading((previous) => ({
        ...previous,
        [postId]: false,
      }));
    }
  };

  // =========================================================
  // FETCH USER PROFILE
  // =========================================================

  const fetchUserProfile = async () => {
    if (!userId) {
      setLoading(false);
      setRefreshing(false);

      Alert.alert(
        "Error",
        "No user ID was provided."
      );

      return;
    }

    try {
      console.log("================================");
      console.log("SEE USER");
      console.log("USER ID:", userId);

      // -----------------------------------------------------
      // PROFILE
      // -----------------------------------------------------

      let profileData: Profile | null = null;

      try {
        const profileResponse =
          await api.get(
            `/users/${userId}/profile`
          );

        console.log(
          "PROFILE RESPONSE:",
          JSON.stringify(
            profileResponse.data,
            null,
            2
          )
        );

        profileData =
          getProfileFromResponse(
            profileResponse.data
          );
      } catch (error: any) {
        console.log(
          "PROFILE ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );
      }

      // -----------------------------------------------------
      // USER
      // -----------------------------------------------------

      let userData: any = null;

      try {
        const userResponse =
          await api.get(
            `/users/${userId}`
          );

        console.log(
          "USER RESPONSE:",
          JSON.stringify(
            userResponse.data,
            null,
            2
          )
        );

        userData =
          getUserFromResponse(
            userResponse.data
          );
      } catch (error: any) {
        console.log(
          "GET USER ENDPOINT ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );
      }

      // -----------------------------------------------------
      // BUILD USER
      // -----------------------------------------------------

      const finalProfile =
        profileData ??
        userData?.profile ??
        null;

      const finalUsername =
        userData?.username ??
        userData?.userName ??
        userData?.name ??
        finalProfile?.displayName ??
        "";

      const finalEmail =
        userData?.email ?? "";

      const finalRole =
        userData?.role ?? "";

      setUser({
        id: userId,
        username: finalUsername,
        email: finalEmail,
        role: finalRole,
        profile: finalProfile,
      });

      console.log(
        "FINAL USER:",
        JSON.stringify(
          {
            id: userId,
            username: finalUsername,
            email: finalEmail,
            profile: finalProfile,
          },
          null,
          2
        )
      );

      // -----------------------------------------------------
      // POSTS
      // -----------------------------------------------------

      try {
        const postsResponse =
          await api.get(
            `/users/${userId}/posts`
          );

        console.log(
          "POSTS RESPONSE:",
          JSON.stringify(
            postsResponse.data,
            null,
            2
          )
        );

        const receivedPosts =
          getPostsFromResponse(
            postsResponse.data
          );

        setPosts(receivedPosts);

        const initialLiked: Record<
          string,
          boolean
        > = {};

        const initialLikes: Record<
          string,
          number
        > = {};

        receivedPosts.forEach((post) => {
          const id = String(post.id);

          initialLiked[id] =
            post.likedByMe ??
            post.isLiked ??
            false;

          initialLikes[id] =
            post.likesCount ??
            post.likes ??
            0;
        });

        setLikedPosts(initialLiked);
        setPostLikes(initialLikes);

        console.log(
          "POST COUNT:",
          receivedPosts.length
        );
      } catch (error: any) {
        console.log(
          "POSTS ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setPosts([]);
      }

      // -----------------------------------------------------
      // FRIEND STATUS
      // -----------------------------------------------------

      await fetchFriendStatus();

      console.log("================================");
    } catch (error: any) {
      console.log(
        "SEE USER ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not load this user's profile."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // LOAD WHEN SCREEN OPENS
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [userId])
  );

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchUserProfile();
  };

  // =========================================================
  // ADD FRIEND
  // =========================================================

  const handleAddFriend = async () => {
    if (!userId || friendLoading) return;

    try {
      setFriendLoading(true);

      console.log(
        "ADDING FRIEND:",
        userId
      );

      const response = await api.post(
        `/friend-requests/${userId}`
      );

      console.log(
        "ADD FRIEND RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      setFriendStatus("pending");

      const requestId =
        response.data?.id ??
        response.data?.request?.id ??
        response.data?.friendRequest?.id ??
        null;

      if (requestId) {
        setFriendRequestId(
          String(requestId)
        );
      }

      Alert.alert(
        "Friend Request",
        "Friend request sent successfully."
      );
    } catch (error: any) {
      console.log(
        "ADD FRIEND ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      if (
        error?.response?.status === 409
      ) {
        await fetchFriendStatus();

        Alert.alert(
          "Already Exists",
          error?.response?.data?.message ||
            "A friend request already exists."
        );

        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not send friend request."
      );
    } finally {
      setFriendLoading(false);
    }
  };

  // =========================================================
  // CANCEL REQUEST
  // =========================================================

  const handleCancelRequest = async () => {
    if (
      !friendRequestId ||
      friendLoading
    ) {
      return;
    }

    try {
      setFriendLoading(true);

      await api.patch(
        `/friend-requests/${friendRequestId}/cancel`
      );

      setFriendStatus("none");
      setFriendRequestId(null);

      Alert.alert(
        "Friend Request",
        "Friend request canceled."
      );
    } catch (error: any) {
      console.log(
        "CANCEL REQUEST ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      await fetchFriendStatus();

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not cancel the request."
      );
    } finally {
      setFriendLoading(false);
    }
  };

  // =========================================================
  // ACCEPT REQUEST
  // =========================================================

  const handleAcceptRequest = async () => {
    if (
      !friendRequestId ||
      friendLoading
    ) {
      return;
    }

    try {
      setFriendLoading(true);

      const response = await api.patch(
        `/friend-requests/${friendRequestId}/accept`
      );

      console.log(
        "ACCEPT RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      setFriendStatus("friends");

      const newFriendshipId =
        response.data?.friendship?.id ??
        response.data?.friendshipId ??
        null;

      if (newFriendshipId) {
        setFriendshipId(
          String(newFriendshipId)
        );
      }

      setFriendRequestId(null);

      Alert.alert(
        "Friends",
        "You are now friends."
      );
    } catch (error: any) {
      console.log(
        "ACCEPT REQUEST ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      await fetchFriendStatus();

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not accept friend request."
      );
    } finally {
      setFriendLoading(false);
    }
  };

  // =========================================================
  // REMOVE FRIEND
  // =========================================================

  const handleRemoveFriend = () => {
    if (
      !friendshipId ||
      friendLoading
    ) {
      return;
    }

    const name =
      user?.profile?.displayName ||
      user?.username ||
      "this user";

    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${name} as a friend?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",

          onPress: async () => {
            try {
              setFriendLoading(true);

              await api.delete(
                `/friends/${friendshipId}`
              );

              setFriendStatus("none");
              setFriendshipId(null);

              Alert.alert(
                "Friend Removed",
                "This person has been removed from your friends."
              );
            } catch (error: any) {
              console.log(
                "REMOVE FRIEND ERROR:",
                error?.response?.data ||
                  error?.message ||
                  error
              );

              await fetchFriendStatus();

              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Could not remove this friend."
              );
            } finally {
              setFriendLoading(false);
            }
          },
        },
      ]
    );
  };

  // =========================================================
  // MESSAGE BUTTON
  // =========================================================

  const handleMessagePress = () => {
    if (!userId) {
      return;
    }

    router.push({
      pathname: "/chat",
      params: {
        userId: userId,
      },
    });
  };

  // =========================================================
  // FRIEND BUTTON
  // =========================================================

  const renderFriendButton = () => {
    // FRIENDS

    if (
      friendStatus === "friends"
    ) {
      return (
        <Pressable
          style={[
            styles.friendButton,
            styles.friendsButton,
          ]}
          onPress={
            handleRemoveFriend
          }
          disabled={friendLoading}
        >
          {friendLoading ? (
            <ActivityIndicator
              size="small"
              color="#63272e"
            />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#63272e"
              />

              <Text
                style={
                  styles.friendsButtonText
                }
              >
                Friends
              </Text>
            </>
          )}
        </Pressable>
      );
    }

    // REQUEST SENT

    if (
      friendStatus === "pending"
    ) {
      return (
        <Pressable
          style={[
            styles.friendButton,
            styles.pendingButton,
          ]}
          onPress={
            handleCancelRequest
          }
          disabled={friendLoading}
        >
          {friendLoading ? (
            <ActivityIndicator
              size="small"
              color="#63272e"
            />
          ) : (
            <>
              <Ionicons
                name="time-outline"
                size={20}
                color="#63272e"
              />

              <Text
                style={
                  styles.pendingButtonText
                }
              >
                Request Sent
              </Text>
            </>
          )}
        </Pressable>
      );
    }

    // RECEIVED REQUEST

    if (
      friendStatus === "received"
    ) {
      return (
        <Pressable
          style={styles.friendButton}
          onPress={
            handleAcceptRequest
          }
          disabled={friendLoading}
        >
          {friendLoading ? (
            <ActivityIndicator
              size="small"
              color="#FDF5E6"
            />
          ) : (
            <>
              <Ionicons
                name="person-add-outline"
                size={20}
                color="#FDF5E6"
              />

              <Text
                style={
                  styles.friendButtonText
                }
              >
                Accept Request
              </Text>
            </>
          )}
        </Pressable>
      );
    }

    // NOT FRIENDS

    return (
      <Pressable
        style={styles.friendButton}
        onPress={handleAddFriend}
        disabled={friendLoading}
      >
        {friendLoading ? (
          <ActivityIndicator
            size="small"
            color="#FDF5E6"
          />
        ) : (
          <>
            <Ionicons
              name="person-add-outline"
              size={20}
              color="#FDF5E6"
            />

            <Text
              style={styles.friendButtonText}
            >
              Add Friend
            </Text>
          </>
        )}
      </Pressable>
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

  const profile = user?.profile;

  const profilePicture =
    profile?.profilePictureUrl ||
    null;

  const displayName =
    profile?.displayName ||
    user?.username ||
    "User";

  const username =
    user?.username || "";

  const nativeLanguage =
    profile?.nativeLanguage ||
    "Not specified";

  const learningLanguage =
    profile?.learningLanguage ||
    "Not specified";

  const bio =
    profile?.bio?.trim() ||
    "This user hasn't added a bio yet.";

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
          onPress={() => router.back()}
          style={styles.backButton}
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
            refreshing={refreshing}
            onRefresh={
              handleRefresh
            }
            tintColor="#63272e"
          />
        }
      >
        {/* =================================================
            PROFILE
        ================================================= */}

        <View
          style={styles.profileSection}
        >
          <View
            style={
              styles.profilePictureContainer
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
                <DefaultAvatar
                  size={120}
                />
              </View>
            )}
          </View>

          <Text
            style={styles.displayName}
          >
            {displayName}
          </Text>

          {username ? (
            <Text
              style={styles.username}
            >
              @{username}
            </Text>
          ) : null}

          {user?.email ? (
            <Text
              style={styles.email}
            >
              {user.email}
            </Text>
          ) : null}

          <View
            style={
              styles.friendButtonContainer
            }
          >
            {renderFriendButton()}

            {/* MESSAGE BUTTON */}

            <Pressable
              style={
                styles.messageButton
              }
              onPress={
                handleMessagePress
              }
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color="#63272e"
              />

              <Text
                style={
                  styles.messageButtonText
                }
              >
                Message
              </Text>
            </Pressable>
          </View>
        </View>

        {/* =================================================
            LANGUAGES
        ================================================= */}

        <View
          style={styles.languagesContainer}
        >
          <View
            style={styles.languageBox}
          >
            <View
              style={styles.languageIcon}
            >
              <Ionicons
                name="language-outline"
                size={23}
                color="#63272e"
              />
            </View>

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
            style={styles.languageBox}
          >
            <View
              style={styles.languageIcon}
            >
              <Ionicons
                name="book-outline"
                size={23}
                color="#63272e"
              />
            </View>

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

        {/* =================================================
            BIO
        ================================================= */}

        <View
          style={styles.bioCard}
        >
          <Text
            style={styles.sectionTitle}
          >
            Bio
          </Text>

          <Text
            style={styles.bioText}
          >
            {bio}
          </Text>
        </View>

        {/* =================================================
            POSTS HEADER
        ================================================= */}

        <View
          style={styles.postsHeader}
        >
          <Text
            style={styles.postsTitle}
          >
            Posts
          </Text>

          <View
            style={
              styles.postCountBadge
            }
          >
            <Text
              style={styles.postCount}
            >
              {posts.length}
            </Text>
          </View>
        </View>

        {/* =================================================
            NO POSTS
        ================================================= */}

        {posts.length === 0 ? (
          <View
            style={styles.emptyPosts}
          >
            <View
              style={
                styles.emptyIconCircle
              }
            >
              <Ionicons
                name="images-outline"
                size={32}
                color="#63272e"
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              No posts yet
            </Text>

            <Text
              style={styles.emptyText}
            >
              This user hasn't shared any
              posts yet.
            </Text>
          </View>
        ) : (
          <View
            style={styles.postsContainer}
          >
            {posts.map((post) => {
              const postId =
                String(post.id);

              const postImage =
                post.postPictureUrl ||
                post.imageUrl ||
                post.image ||
                null;

              const postText =
                post.content ||
                post.text ||
                "";

              const likes =
                postLikes[postId] ??
                post.likesCount ??
                post.likes ??
                0;

              const comments =
                commentsByPost[
                  postId
                ]?.length ??
                post.commentsCount ??
                post.comments ??
                0;

              const isLiked =
                likedPosts[
                  postId
                ] ??
                post.likedByMe ??
                post.isLiked ??
                false;

              const postDisplayName =
                post.user?.profile
                  ?.displayName ||
                post.user?.username ||
                displayName;

              const postAvatar =
                post.user?.profile
                  ?.profilePictureUrl ||
                profilePicture ||
                null;

              const postComments =
                commentsByPost[
                  postId
                ] ?? [];

              return (
                <View
                  key={postId}
                  style={
                    styles.postCard
                  }
                >
                  {/* POST TOP */}

                  <View
                    style={
                      styles.postTop
                    }
                  >
                    <View
                      style={
                        styles.postUser
                      }
                    >
                      {postAvatar ? (
                        <Image
                          source={{
                            uri: postAvatar,
                          }}
                          style={
                            styles.postAvatar
                          }
                        />
                      ) : (
                        <View
                          style={
                            styles.postAvatarDefault
                          }
                        >
                          <DefaultAvatar
                            size={38}
                          />
                        </View>
                      )}

                      <Text
                        style={
                          styles.postUserName
                        }
                      >
                        {
                          postDisplayName
                        }
                      </Text>
                    </View>
                  </View>

                  {/* TITLE */}

                  {post.title ? (
                    <Text
                      style={
                        styles.postTitle
                      }
                    >
                      {post.title}
                    </Text>
                  ) : null}

                  {/* CONTENT */}

                  {postText ? (
                    <Text
                      style={
                        styles.postText
                      }
                      numberOfLines={6}
                    >
                      {postText}
                    </Text>
                  ) : null}

                  {/* IMAGE */}

                  {postImage ? (
                    <Image
                      source={{
                        uri: postImage,
                      }}
                      style={
                        styles.postImage
                      }
                      resizeMode="cover"
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
                      style={
                        styles.actionButton
                      }
                      onPress={() =>
                        handleLikePress(
                          postId
                        )
                      }
                      disabled={
                        likeLoading[
                          postId
                        ]
                      }
                    >
                      {likeLoading[
                        postId
                      ] ? (
                        <ActivityIndicator
                          size="small"
                          color="#63272e"
                        />
                      ) : (
                        <View
                          style={
                            styles.likeIconWrapper
                          }
                        >
                          <LikeIcon
                            size={23}
                            liked={isLiked}
                          />
                        </View>
                      )}

                      <Text
                        style={[
                          styles.actionText,
                          isLiked &&
                            styles.likedActionText,
                        ]}
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
                        handleCommentsPress(
                          postId
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
                        {comments}
                      </Text>
                    </Pressable>
                  </View>

                  {/* =================================================
                      COMMENTS
                  ================================================= */}

                  {commentsOpen[
                    postId
                  ] ? (
                    <View
                      style={
                        styles.commentsSection
                      }
                    >
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
                            setCommentsOpen(
                              (
                                previous
                              ) => ({
                                ...previous,
                                [postId]:
                                  false,
                              })
                            )
                          }
                        >
                          <Ionicons
                            name="close"
                            size={22}
                            color="#63272e"
                          />
                        </Pressable>
                      </View>

                      {commentsLoading[
                        postId
                      ] ? (
                        <View
                          style={
                            styles.commentsLoading
                          }
                        >
                          <ActivityIndicator
                            size="small"
                            color="#63272e"
                          />
                        </View>
                      ) : postComments.length ===
                        0 ? (
                        <Text
                          style={
                            styles.noCommentsText
                          }
                        >
                          No comments yet.
                          Be the first to
                          comment.
                        </Text>
                      ) : (
                        <View
                          style={
                            styles.commentsList
                          }
                        >
                          {postComments.map(
                            (comment) => {
                              const commentName =
                                comment
                                  .user
                                  ?.profile
                                  ?.displayName ||
                                "User";

                              const commentAvatar =
                                comment
                                  .user
                                  ?.profile
                                  ?.profilePictureUrl ||
                                null;

                              return (
                                <View
                                  key={
                                    String(
                                      comment.id
                                    )
                                  }
                                  style={
                                    styles.commentRow
                                  }
                                >
                                  {commentAvatar ? (
                                    <Image
                                      source={{
                                        uri: commentAvatar,
                                      }}
                                      style={
                                        styles.commentAvatar
                                      }
                                    />
                                  ) : (
                                    <View
                                      style={
                                        styles.commentAvatarDefault
                                      }
                                    >
                                      <DefaultAvatar
                                        size={34}
                                      />
                                    </View>
                                  )}

                                  <View
                                    style={
                                      styles.commentBubble
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.commentName
                                      }
                                    >
                                      {
                                        commentName
                                      }
                                    </Text>

                                    <Text
                                      style={
                                        styles.commentContent
                                      }
                                    >
                                      {
                                        comment.content
                                      }
                                    </Text>
                                  </View>
                                </View>
                              );
                            }
                          )}
                        </View>
                      )}

                      {/* ADD COMMENT */}

                      <View
                        style={
                          styles.commentInputRow
                        }
                      >
                        <TextInput
                          style={
                            styles.commentInput
                          }
                          placeholder="Write a comment..."
                          placeholderTextColor="#9d8587"
                          value={
                            commentText[
                              postId
                            ] ?? ""
                          }
                          onChangeText={(
                            text
                          ) =>
                            setCommentText(
                              (
                                previous
                              ) => ({
                                ...previous,
                                [postId]:
                                  text,
                              })
                            )
                          }
                          multiline
                        />

                        <Pressable
                          style={
                            styles.sendCommentButton
                          }
                          onPress={() =>
                            handleAddComment(
                              postId
                            )
                          }
                          disabled={
                            commentSending[
                              postId
                            ]
                          }
                        >
                          {commentSending[
                            postId
                          ] ? (
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
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <View
          style={{ height: 35 }}
        />
      </ScrollView>
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

  loadingContainer: {
    flex: 1,
    backgroundColor: "#63272e",
    justifyContent: "center",
    alignItems: "center",
  },

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

  scrollContent: {
    paddingBottom: 40,
  },

  // PROFILE

  profileSection: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 20,
  },

  profilePictureContainer: {
    width: 124,
    height: 124,
    borderRadius: 62,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#63272e",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fffaf0",
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
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  displayName: {
    marginTop: 13,
    fontSize: 24,
    fontWeight: "700",
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

  // FRIEND BUTTON

  friendButtonContainer: {
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 17,
  },

  friendButton: {
    height: 47,
    borderRadius: 14,
    backgroundColor: "#63272e",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  friendButtonText: {
    color: "#FDF5E6",
    fontSize: 16,
    fontWeight: "700",
  },

  friendsButton: {
    backgroundColor: "#fffaf0",
    borderWidth: 1.5,
    borderColor: "#63272e",
  },

  friendsButtonText: {
    color: "#63272e",
    fontSize: 16,
    fontWeight: "700",
  },

  pendingButton: {
    backgroundColor: "#fffaf0",
    borderWidth: 1.5,
    borderColor: "#eadbc5",
  },

  pendingButtonText: {
    color: "#63272e",
    fontSize: 16,
    fontWeight: "700",
  },

  // MESSAGE BUTTON

  messageButton: {
    height: 47,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#fffaf0",
    borderWidth: 1.5,
    borderColor: "#63272e",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  messageButtonText: {
    color: "#63272e",
    fontSize: 16,
    fontWeight: "700",
  },

  // LANGUAGES

  languagesContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },

  languageBox: {
    flex: 1,
    backgroundColor: "#fffaf0",
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eadbc5",
  },

  languageIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f7ead8",
    justifyContent: "center",
    alignItems: "center",
  },

  languageLabel: {
    marginTop: 7,
    fontSize: 12,
    color: "#8d6d70",
    fontWeight: "600",
  },

  languageValue: {
    marginTop: 3,
    fontSize: 15,
    color: "#63272e",
    fontWeight: "700",
    textAlign: "center",
  },

  // BIO

  bioCard: {
    marginHorizontal: 16,
    marginTop: 15,
    padding: 17,
    backgroundColor: "#fffaf0",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#eadbc5",
  },

  sectionTitle: {
    color: "#63272e",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 7,
  },

  bioText: {
    color: "#5f484a",
    fontSize: 15,
    lineHeight: 22,
  },

  // POSTS HEADER

  postsHeader: {
    marginTop: 28,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  postsTitle: {
    color: "#63272e",
    fontSize: 21,
    fontWeight: "700",
  },

  postCountBadge: {
    marginLeft: 8,
    minWidth: 27,
    height: 27,
    paddingHorizontal: 7,
    borderRadius: 14,
    backgroundColor: "#63272e",
    justifyContent: "center",
    alignItems: "center",
  },

  postCount: {
    color: "#FDF5E6",
    fontSize: 13,
    fontWeight: "700",
  },

  // POSTS

  postsContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 12,
  },

  postCard: {
    backgroundColor: "#fffaf0",
    borderRadius: 17,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eadbc5",
  },

  postTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  postUser: {
    flexDirection: "row",
    alignItems: "center",
  },

  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  postAvatarDefault: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#63272e",
  },

  postUserName: {
    marginLeft: 9,
    color: "#63272e",
    fontSize: 15,
    fontWeight: "700",
  },

  postTitle: {
    marginTop: 13,
    color: "#63272e",
    fontSize: 17,
    fontWeight: "700",
  },

  postText: {
    color: "#4f3c3e",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 9,
  },

  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 13,
    marginTop: 13,
  },

  postActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: "#eadbc5",
    paddingTop: 12,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 30,
  },

  likeIconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },

  actionText: {
    color: "#63272e",
    fontSize: 14,
    fontWeight: "600",
  },

  likedActionText: {
    fontWeight: "800",
  },

  // COMMENTS

  commentsSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#eadbc5",
  },

  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  commentsTitle: {
    color: "#63272e",
    fontSize: 17,
    fontWeight: "700",
  },

  commentsLoading: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  noCommentsText: {
    color: "#8d6d70",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 14,
  },

  commentsList: {
    gap: 10,
  },

  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  commentAvatarDefault: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eadbc5",
  },

  commentBubble: {
    flex: 1,
    backgroundColor: "#f7ead8",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  commentName: {
    color: "#63272e",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },

  commentContent: {
    color: "#4f3c3e",
    fontSize: 14,
    lineHeight: 20,
  },

  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 13,
    gap: 8,
  },

  commentInput: {
    flex: 1,
    minHeight: 43,
    maxHeight: 100,
    backgroundColor: "#FDF5E6",
    borderWidth: 1,
    borderColor: "#eadbc5",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#4f3c3e",
    fontSize: 14,
  },

  sendCommentButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#63272e",
    justifyContent: "center",
    alignItems: "center",
  },

  // EMPTY POSTS

  emptyPosts: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#fffaf0",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eadbc5",
  },

  emptyIconCircle: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#f7ead8",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    color: "#63272e",
    fontSize: 18,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 5,
    color: "#8d6d70",
    fontSize: 14,
    textAlign: "center",
  },
});