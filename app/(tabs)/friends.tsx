import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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

import DefaultAvatarMini from "@/components/DefaultAvatarMini";
import api from "@/services/api";

import ChatsIcon from "../../components/ChatsIcon";
import FriendsIcon from "../../components/FriendsIcon";
import HomeIcon from "../../components/HomeIcon";
import LocalAIIcon from "../../components/LocalAiIcon";

// =========================================================
// TYPES
// =========================================================

type User = {
  id?: number | string;
  userId?: number | string;
  username?: string;
  displayName?: string;
  profilePicture?: string | null;
  profilePictureUrl?: string | null;
  bio?: string;
  nativeLanguage?: string;
  learningLanguage?: string;

  profile?: {
    id?: number | string;
    userId?: number | string;
    displayName?: string | null;
    profilePictureUrl?: string | null;
  };

  user?: {
    id?: number | string;
    userId?: number | string;
    username?: string;
    displayName?: string;

    profile?: {
      displayName?: string | null;
      profilePictureUrl?: string | null;
    };
  };
};

type FriendRequest = {
  id?: number | string;
  friendshipId?: number | string;
  friendRequestId?: number | string;
  senderId?: number | string;
  receiverId?: number | string;
  status?: string;
  createdAt?: string;

  sender?: User;
  receiver?: User;
};

// =========================================================
// COMPONENT
// =========================================================

export default function Friends() {
  const router = useRouter();

  // =======================================================
  // STATE
  // =======================================================

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [incomingRequests, setIncomingRequests] =
    useState<FriendRequest[]>([]);

  const [outgoingRequests, setOutgoingRequests] =
    useState<FriendRequest[]>([]);

  const [allUsers, setAllUsers] =
    useState<User[]>([]);

  const [users, setUsers] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  // =======================================================
  // SEARCH
  // =======================================================

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [searchLoading, setSearchLoading] =
    useState(false);

  // =======================================================
  // REQUEST ACTIONS
  // =======================================================

  const [processingRequestIds, setProcessingRequestIds] =
    useState<(number | string)[]>([]);

  const [sendingRequestIds, setSendingRequestIds] =
    useState<(number | string)[]>([]);

  // =======================================================
  // SEE ALL
  // =======================================================

  const [showAllRequests, setShowAllRequests] =
    useState(false);

  // =======================================================
  // FETCH CONTROL
  // =======================================================

  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);

  // =======================================================
  // GET USER ID
  // =======================================================

  const getUserId = (
    user: User | null | undefined
  ): number | string | undefined => {
    if (!user) {
      return undefined;
    }

    return (
      user.userId ??
      user.id ??
      user.user?.userId ??
      user.user?.id ??
      user.profile?.userId
    );
  };

  // =======================================================
  // GET REQUEST ID
  // =======================================================

  const getRequestId = (
    request: FriendRequest | null | undefined
  ): number | string | undefined => {
    if (!request) {
      return undefined;
    }

    return (
      request.id ??
      request.friendRequestId ??
      request.friendshipId
    );
  };

  // =======================================================
  // GET USER NAME
  // =======================================================

  const getUserName = (
    user: User | null | undefined
  ): string => {
    if (!user) {
      return "User";
    }

    return (
      user.displayName ||
      user.profile?.displayName ||
      user.user?.displayName ||
      user.username ||
      user.user?.username ||
      "User"
    );
  };

  // =======================================================
  // GET USERNAME
  // =======================================================

  const getUsername = (
    user: User | null | undefined
  ): string => {
    const username =
      user?.username ||
      user?.user?.username ||
      "";

    return username ? `@${username}` : "";
  };

  // =======================================================
  // GET AVATAR
  // =======================================================

  const getAvatar = (
    user: User | null | undefined
  ): string | null => {
    if (!user) {
      return null;
    }

    return (
      user.profilePictureUrl ||
      user.profilePicture ||
      user.profile?.profilePictureUrl ||
      user.user?.profile?.profilePictureUrl ||
      null
    );
  };

  // =======================================================
  // NORMALIZE USER
  // =======================================================

  const normalizeUser = (
    value: any,
    forcedId?: number | string
  ): User | null => {
    if (!value || typeof value !== "object") {
      return null;
    }

    const nestedUser =
      value.user &&
      typeof value.user === "object"
        ? value.user
        : undefined;

    const profile =
      value.profile &&
      typeof value.profile === "object"
        ? value.profile
        : undefined;

    const id =
      forcedId ??
      value.userId ??
      nestedUser?.userId ??
      nestedUser?.id ??
      value.id;

    if (id === undefined || id === null) {
      return null;
    }

    return {
      ...value,

      id,
      userId: id,

      username:
        value.username ??
        nestedUser?.username,

      displayName:
        value.displayName ??
        nestedUser?.displayName ??
        profile?.displayName ??
        nestedUser?.profile?.displayName,

      profilePictureUrl:
        value.profilePictureUrl ??
        value.profilePicture ??
        profile?.profilePictureUrl ??
        nestedUser?.profilePictureUrl ??
        nestedUser?.profile?.profilePictureUrl ??
        null,
    };
  };

  // =======================================================
  // EXTRACT USERS
  // =======================================================

  const extractUsers = (data: any): User[] => {
    const result: User[] = [];
    const visited = new Set<any>();

    const walk = (value: any) => {
      if (!value) {
        return;
      }

      if (
        typeof value !== "object" ||
        visited.has(value)
      ) {
        return;
      }

      visited.add(value);

      // ARRAY
      if (Array.isArray(value)) {
        value.forEach((item) => {
          walk(item);
        });

        return;
      }

      // OBJECT WITH USER
      if (
        value.user &&
        typeof value.user === "object"
      ) {
        const nested = normalizeUser(value.user);

        if (nested) {
          result.push(nested);
        }
      }

      // PROFILE / USER OBJECT
      const looksLikeProfile =
        value.userId !== undefined ||
        value.username !== undefined ||
        value.displayName !== undefined ||
        value.profilePictureUrl !== undefined ||
        value.profilePicture !== undefined;

      if (looksLikeProfile) {
        const normalized =
          normalizeUser(value);

        if (normalized) {
          result.push(normalized);
        }
      }

      // RECURSIVE SEARCH
      Object.keys(value).forEach((key) => {
        const child = value[key];

        if (
          child &&
          typeof child === "object"
        ) {
          walk(child);
        }
      });
    };

    walk(data);

    // REMOVE DUPLICATES
    const unique = result.filter(
      (user, index, array) => {
        const id = getUserId(user);

        if (
          id === undefined ||
          id === null
        ) {
          return false;
        }

        return (
          array.findIndex(
            (other) =>
              String(getUserId(other)) ===
              String(id)
          ) === index
        );
      }
    );

    return unique;
  };

  // =======================================================
  // EXTRACT FRIEND REQUESTS
  // =======================================================

  const extractFriendRequests = (
    data: any
  ): FriendRequest[] => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.requests)) {
      return data.requests;
    }

    if (
      Array.isArray(data?.friendRequests)
    ) {
      return data.friendRequests;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (
      Array.isArray(data?.data?.requests)
    ) {
      return data.data.requests;
    }

    if (
      Array.isArray(
        data?.data?.friendRequests
      )
    ) {
      return data.data.friendRequests;
    }

    return [];
  };

  // =======================================================
  // RECEIVED REQUEST -> USER
  // =======================================================

  const getUserFromReceivedRequest = (
    request: FriendRequest
  ): User | null => {
    if (!request.sender) {
      return null;
    }

    return normalizeUser(
      request.sender,
      request.senderId
    );
  };

  // =======================================================
  // FETCH FRIENDS PAGE
  // =======================================================

  const fetchFriendsPage = async (
    force = false
  ) => {
    if (isFetching.current) {
      return;
    }

    const now = Date.now();

    if (
      !force &&
      now - lastFetchTime.current < 1500
    ) {
      return;
    }

    lastFetchTime.current = now;
    isFetching.current = true;

    try {
      // ===================================================
      // CURRENT USER
      // ===================================================

      let me: User | null = null;

      try {
        const meResponse =
          await api.get("/auth/me");

        me = normalizeUser(
          meResponse.data?.user ??
            meResponse.data
        );

        if (me) {
          setCurrentUser(me);
        }

        console.log(
          "CURRENT USER:",
          me
        );
      } catch (error: any) {
        console.log(
          "CURRENT USER ERROR:",
          error?.response?.status,
          error?.response?.data ||
            error?.message
        );

        me = currentUser;
      }

      // ===================================================
      // RECEIVED REQUESTS
      // ===================================================

      let receivedRequests:
        FriendRequest[] = [];

      try {
        const response =
          await api.get(
            "/friend-requests/received"
          );

        receivedRequests =
          extractFriendRequests(
            response.data
          );

        console.log(
          "RECEIVED REQUESTS:",
          JSON.stringify(
            receivedRequests,
            null,
            2
          )
        );
      } catch (error: any) {
        console.log(
          "RECEIVED REQUESTS ERROR:",
          error?.response?.status,
          error?.response?.data ||
            error?.message
        );
      }

      // ===================================================
      // SENT REQUESTS
      // ===================================================

      let sentRequests:
        FriendRequest[] = [];

      try {
        const response =
          await api.get(
            "/friend-requests/sent"
          );

        sentRequests =
          extractFriendRequests(
            response.data
          );

        console.log(
          "SENT REQUESTS:",
          JSON.stringify(
            sentRequests,
            null,
            2
          )
        );
      } catch (error: any) {
        console.log(
          "SENT REQUESTS ERROR:",
          error?.response?.status,
          error?.response?.data ||
            error?.message
        );
      }

      // ===================================================
      // ALL PROFILES
      // ===================================================

      let receivedUsers: User[] = [];

      try {
        const response =
          await api.get("/profiles");

        console.log(
          "=============================="
        );

        console.log(
          "RAW PROFILES RESPONSE:",
          JSON.stringify(
            response.data,
            null,
            2
          )
        );

        console.log(
          "=============================="
        );

        receivedUsers =
          extractUsers(
            response.data
          );

        console.log(
          "EXTRACTED USERS:",
          JSON.stringify(
            receivedUsers,
            null,
            2
          )
        );

        console.log(
          "NUMBER OF USERS:",
          receivedUsers.length
        );
      } catch (error: any) {
        console.log(
          "PROFILES API ERROR:",
          error?.response?.status,
          error?.response?.data ||
            error?.message
        );
      }

      // ===================================================
      // ONLY PENDING RECEIVED
      // ===================================================

      const incoming =
        receivedRequests.filter(
          (request) =>
            String(
              request.status ?? ""
            ).toUpperCase() ===
            "PENDING"
        );

      // ===================================================
      // ONLY PENDING SENT
      // ===================================================

      const outgoing =
        sentRequests.filter(
          (request) =>
            String(
              request.status ?? ""
            ).toUpperCase() ===
            "PENDING"
        );

      // ===================================================
      // SAVE
      // ===================================================

      setAllUsers(receivedUsers);

      if (!searchText.trim()) {
        setUsers(receivedUsers);
      }

      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);

      console.log(
        "FRIENDS PAGE FINAL DATA:",
        {
          myId: getUserId(me),
          incoming,
          outgoing,
          userCount:
            receivedUsers.length,
        }
      );
    } catch (error: any) {
      console.log(
        "FRIENDS PAGE ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Friends Error",
        error?.response?.data?.message ||
          error?.message ||
          "Could not load friends."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetching.current = false;
    }
  };

  // =======================================================
  // LOAD ON FOCUS
  // =======================================================

  useFocusEffect(
    useCallback(() => {
      fetchFriendsPage(true);

      return undefined;
    }, [])
  );

  // =======================================================
  // REFRESH
  // =======================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchFriendsPage(true);
  };

  // =======================================================
  // FRIEND IDS
  // =======================================================

  /*
   * Friends are intentionally NOT displayed on this page.
   * They belong in chats.tsx.
   */

  // =======================================================
  // INCOMING IDS
  // =======================================================

  const getIncomingIds = (): string[] => {
    return incomingRequests
      .map(
        (request) =>
          request.senderId
      )
      .filter(
        (
          id
        ): id is number | string =>
          id !== undefined &&
          id !== null
      )
      .map((id) => String(id));
  };

  // =======================================================
  // OUTGOING IDS
  // =======================================================

  const getOutgoingIds = (): string[] => {
    return outgoingRequests
      .map(
        (request) =>
          request.receiverId
      )
      .filter(
        (
          id
        ): id is number | string =>
          id !== undefined &&
          id !== null
      )
      .map((id) => String(id));
  };

  // =======================================================
  // PEOPLE YOU CAN ADD
  // =======================================================

  const getPeopleToAdd = (): User[] => {
    const myId =
      getUserId(currentUser);

    const incomingIds =
      getIncomingIds();

    const outgoingIds =
      getOutgoingIds();

    return allUsers.filter(
      (user) => {
        const userId =
          getUserId(user);

        if (
          userId === undefined ||
          userId === null
        ) {
          return false;
        }

        const id =
          String(userId);

        // Don't show yourself
        if (
          myId !== undefined &&
          String(myId) === id
        ) {
          return false;
        }

        // Don't show incoming requests
        if (
          incomingIds.includes(id)
        ) {
          return false;
        }

        // Don't show outgoing requests
        if (
          outgoingIds.includes(id)
        ) {
          return false;
        }

        return true;
      }
    );
  };

  // =======================================================
  // SEND FRIEND REQUEST
  // =======================================================

  const sendFriendRequest = async (
    user: User
  ) => {
    const userId =
      getUserId(user);

    if (
      userId === undefined ||
      userId === null
    ) {
      return;
    }

    if (
      sendingRequestIds.some(
        (id) =>
          String(id) ===
          String(userId)
      )
    ) {
      return;
    }

    try {
      setSendingRequestIds(
        (current) => [
          ...current,
          userId,
        ]
      );

      console.log(
        "SENDING FRIEND REQUEST TO:",
        userId
      );

      await api.post(
        `/friend-requests/${userId}`
      );

      await fetchFriendsPage(true);
    } catch (error: any) {
      console.log(
        "SEND FRIEND REQUEST ERROR:",
        error?.response?.status,
        error?.response?.data ||
          error?.message
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Could not send friend request."
      );
    } finally {
      setSendingRequestIds(
        (current) =>
          current.filter(
            (id) =>
              String(id) !==
              String(userId)
          )
      );
    }
  };

  // =======================================================
  // ACCEPT REQUEST
  // =======================================================

  const acceptRequest = async (
    request: FriendRequest
  ) => {
    const requestId =
      getRequestId(request);

    if (
      requestId === undefined ||
      requestId === null
    ) {
      Alert.alert(
        "Error",
        "Invalid friend request ID."
      );

      return;
    }

    if (
      processingRequestIds.some(
        (id) =>
          String(id) ===
          String(requestId)
      )
    ) {
      return;
    }

    try {
      setProcessingRequestIds(
        (current) => [
          ...current,
          requestId,
        ]
      );

      await api.patch(
        `/friend-requests/${requestId}/accept`
      );

      await fetchFriendsPage(true);
    } catch (error: any) {
      console.log(
        "ACCEPT REQUEST ERROR:",
        error?.response?.status,
        error?.response?.data ||
          error?.message
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not accept request."
      );
    } finally {
      setProcessingRequestIds(
        (current) =>
          current.filter(
            (id) =>
              String(id) !==
              String(requestId)
          )
      );
    }
  };

  // =======================================================
  // REJECT REQUEST
  // =======================================================

  const rejectRequest = async (
    request: FriendRequest
  ) => {
    const requestId =
      getRequestId(request);

    if (
      requestId === undefined ||
      requestId === null
    ) {
      Alert.alert(
        "Error",
        "Invalid friend request ID."
      );

      return;
    }

    if (
      processingRequestIds.some(
        (id) =>
          String(id) ===
          String(requestId)
      )
    ) {
      return;
    }

    try {
      setProcessingRequestIds(
        (current) => [
          ...current,
          requestId,
        ]
      );

      await api.patch(
        `/friend-requests/${requestId}/reject`
      );

      await fetchFriendsPage(true);
    } catch (error: any) {
      console.log(
        "REJECT REQUEST ERROR:",
        error?.response?.status,
        error?.response?.data ||
          error?.message
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not reject request."
      );
    } finally {
      setProcessingRequestIds(
        (current) =>
          current.filter(
            (id) =>
              String(id) !==
              String(requestId)
          )
      );
    }
  };

  // =======================================================
  // SEARCH
  // =======================================================

  const searchUsers = (
    text: string
  ) => {
    setSearchText(text);

    const search =
      text.trim().toLowerCase();

    if (!search) {
      setUsers(allUsers);
      return;
    }

    setSearchLoading(true);

    const results =
      allUsers.filter(
        (user) => {
          const username = (
            user.username ||
            user.user?.username ||
            ""
          ).toLowerCase();

          const displayName = (
            user.displayName ||
            user.profile?.displayName ||
            user.user?.displayName ||
            ""
          ).toLowerCase();

          return (
            username.includes(search) ||
            displayName.includes(search)
          );
        }
      );

    setUsers(results);
    setSearchLoading(false);
  };

  // =======================================================
  // OPEN PROFILE
  // =======================================================

  const openUserProfile = (
    user: User
  ) => {
    const userId =
      getUserId(user);

    if (
      userId === undefined ||
      userId === null
    ) {
      return;
    }

    router.push({
      pathname: "/seeUser" as any,
      params: {
        id: String(userId),
      },
    });
  };

  // =======================================================
  // RENDER USER
  // =======================================================

  const renderUser = (
    user: User,
    type:
      | "request"
      | "suggestion"
  ) => {
    const userId =
      getUserId(user);

    if (
      userId === undefined ||
      userId === null
    ) {
      return null;
    }

    const avatar =
      getAvatar(user);

    // =====================================================
    // REQUEST INFORMATION
    // =====================================================

    const request =
      incomingRequests.find(
        (item) =>
          item.senderId !== undefined &&
          String(item.senderId) ===
            String(userId)
      );

    const requestId =
      request
        ? getRequestId(request)
        : undefined;

    const processing =
      requestId !== undefined &&
      requestId !== null &&
      processingRequestIds.some(
        (id) =>
          String(id) ===
          String(requestId)
      );

    // =====================================================
    // SENDING
    // =====================================================

    const sending =
      sendingRequestIds.some(
        (id) =>
          String(id) ===
          String(userId)
      );

    // =====================================================
    // CARD
    // =====================================================

    return (
      <View
        key={`${type}-${String(
          userId
        )}`}
        style={styles.personCard}
      >
        {/* USER INFORMATION */}

        <Pressable
          style={styles.personLeft}
          onPress={() =>
            openUserProfile(user)
          }
        >
          {avatar ? (
            <Image
              source={{
                uri: avatar,
              }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <DefaultAvatarMini
              size={48}
            />
          )}

          <View
            style={styles.personInfo}
          >
            <Text
              style={styles.personName}
              numberOfLines={1}
            >
              {getUserName(user)}
            </Text>

            {getUsername(user) ? (
              <Text
                style={styles.username}
                numberOfLines={1}
              >
                {getUsername(user)}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {/* REQUEST BUTTONS */}

        {type === "request" ? (
          <View
            style={styles.requestButtons}
          >
            {/* ACCEPT */}

            <Pressable
              style={styles.acceptButton}
              onPress={() => {
                if (request) {
                  acceptRequest(
                    request
                  );
                }
              }}
              disabled={
                processing ||
                !request
              }
            >
              {processing ? (
                <ActivityIndicator
                  size="small"
                  color="#FDF5E6"
                />
              ) : (
                <Text
                  style={
                    styles.acceptText
                  }
                >
                  Accept
                </Text>
              )}
            </Pressable>

            {/* REJECT */}

            <Pressable
              style={styles.rejectButton}
              onPress={() => {
                if (request) {
                  rejectRequest(
                    request
                  );
                }
              }}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator
                  size="small"
                  color="#63272e"
                />
              ) : (
                <Ionicons
                  name="close"
                  size={20}
                  color="#63272e"
                />
              )}
            </Pressable>
          </View>
        ) : (
          /* ADD */

          <Pressable
            style={styles.addButton}
            onPress={() =>
              sendFriendRequest(
                user
              )
            }
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator
                size="small"
                color="#FDF5E6"
              />
            ) : (
              <>
                <Ionicons
                  name="person-add-outline"
                  size={18}
                  color="#FDF5E6"
                />

                <Text
                  style={
                    styles.addText
                  }
                >
                  Add
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    );
  };

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
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
          style={styles.loadingText}
        >
          Loading friends...
        </Text>
      </View>
    );
  }

  // =======================================================
  // REQUEST USERS
  // =======================================================

  const requestUsers =
    incomingRequests
      .map(
        getUserFromReceivedRequest
      )
      .filter(
        (
          user
        ): user is User =>
          user !== null
      );

  // =======================================================
  // UNIQUE REQUEST USERS
  // =======================================================

  const uniqueRequestUsers =
    requestUsers.filter(
      (
        user,
        index,
        array
      ) => {
        const userId =
          getUserId(user);

        return (
          array.findIndex(
            (otherUser) =>
              String(
                getUserId(
                  otherUser
                )
              ) ===
              String(userId)
          ) === index
        );
      }
    );

  // =======================================================
  // PEOPLE TO ADD
  // =======================================================

  /*
   * Use the filtered list from allUsers.
   * This excludes:
   * - yourself
   * - incoming requests
   * - outgoing requests
   */

  const peopleToAdd =
    getPeopleToAdd();

  // =======================================================
  // SEARCHED PEOPLE
  // =======================================================

  const searchedPeople =
    searchText.trim()
      ? users.filter((user) =>
          peopleToAdd.some(
            (person) =>
              String(
                getUserId(person)
              ) ===
              String(
                getUserId(user)
              )
          )
        )
      : peopleToAdd;

  // =======================================================
  // VISIBLE REQUESTS
  // =======================================================

  const visibleRequests =
    showAllRequests
      ? uniqueRequestUsers
      : uniqueRequestUsers.slice(
          0,
          3
        );

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
          Friends
        </Text>

        <View
          style={
            styles.headerButtons
          }
        >
          <Pressable
            style={
              styles.searchButton
            }
            onPress={() =>
              setSearchOpen(
                !searchOpen
              )
            }
          >
            <Ionicons
              name="search-outline"
              size={23}
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
          SEARCH
      ================================================= */}

      {searchOpen && (
        <View
          style={
            styles.searchContainer
          }
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="#777"
          />

          <TextInput
            value={searchText}
            onChangeText={
              searchUsers
            }
            placeholder="Search users..."
            placeholderTextColor="#888"
            autoFocus
            style={
              styles.searchInput
            }
          />

          {searchLoading && (
            <ActivityIndicator
              size="small"
              color="#63272e"
            />
          )}
        </View>
      )}

      {/* =================================================
          CONTENT
      ================================================= */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
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
        {/* =================================================
            ADDED YOU
        ================================================= */}

        <View
          style={styles.section}
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Added You
          </Text>

          {uniqueRequestUsers.length ===
          0 ? (
            <View
              style={
                styles.smallEmptyContainer
              }
            >
              <Text
                style={
                  styles.smallEmptyText
                }
              >
                No pending requests
              </Text>
            </View>
          ) : (
            <>
              {visibleRequests.map(
                (user) =>
                  renderUser(
                    user,
                    "request"
                  )
              )}

              {uniqueRequestUsers.length >
                3 && (
                <Pressable
                  style={
                    styles.seeAllButton
                  }
                  onPress={() =>
                    setShowAllRequests(
                      !showAllRequests
                    )
                  }
                >
                  <Text
                    style={
                      styles.seeAllText
                    }
                  >
                    {showAllRequests
                      ? "Show less"
                      : "See all"}
                  </Text>

                  <Ionicons
                    name={
                      showAllRequests
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={17}
                    color="#63272e"
                  />
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* =================================================
            PEOPLE YOU CAN ADD
        ================================================= */}

        <View
          style={styles.section}
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            People You Can Add
          </Text>

          {searchedPeople.length ===
          0 ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Ionicons
                name="people-outline"
                size={45}
                color="#63272e"
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                No people to add
              </Text>

              <Text
                style={
                  styles.emptySubText
                }
              >
                {allUsers.length ===
                0
                  ? "No users were returned by the profiles API."
                  : searchText.trim()
                  ? "No users match your search."
                  : "Everyone is already your friend or has a pending request."}
              </Text>
            </View>
          ) : (
            searchedPeople.map(
              (user) =>
                renderUser(
                  user,
                  "suggestion"
                )
            )
          )}
        </View>
      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <View
        style={styles.navBar}
      >
        {/* COMMUNITY */}

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
            style={styles.navText}
          >
            Community
          </Text>
        </Pressable>

        {/* CHATS */}

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
            style={styles.navText}
          >
            Chats
          </Text>
        </Pressable>

        {/* FRIENDS */}

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
            style={styles.navText}
          >
            Friends
          </Text>
        </Pressable>

        {/* LOCAL AI */}

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
            style={styles.navText}
          >
            Local AI
          </Text>
        </Pressable>
      </View>
    </View>
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
    marginTop: 12,
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
    justifyContent: "space-between",
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

  searchButton: {
    width: 42,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#FDF5E6",
    alignItems: "center",
    justifyContent: "center",
  },

  profileButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  // =======================================================
  // SEARCH
  // =======================================================

  searchContainer: {
    marginHorizontal: 20,
    marginTop: 14,
    height: 46,
    backgroundColor: "#D8C3A5",
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },

  // =======================================================
  // CONTENT
  // =======================================================

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 105,
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#63272e",
    marginBottom: 14,
  },

  // =======================================================
  // PERSON CARD
  // =======================================================

  personCard: {
    backgroundColor: "#D8C3A5",
    borderRadius: 18,
    padding: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  personLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  personInfo: {
    marginLeft: 12,
    flex: 1,
    minWidth: 0,
  },

  personName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#63272e",
  },

  username: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  // =======================================================
  // REQUEST BUTTONS
  // =======================================================

  requestButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginLeft: 8,
  },

  acceptButton: {
    minWidth: 72,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#63272e",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
  },

  acceptText: {
    color: "#FDF5E6",
    fontSize: 13,
    fontWeight: "bold",
  },

  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FDF5E6",
    alignItems: "center",
    justifyContent: "center",
  },

  // =======================================================
  // ADD BUTTON
  // =======================================================

  addButton: {
    minWidth: 65,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#63272e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 5,
  },

  addText: {
    color: "#FDF5E6",
    fontSize: 13,
    fontWeight: "bold",
  },

  // =======================================================
  // SEE ALL
  // =======================================================

  seeAllButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 9,
    gap: 4,
  },

  seeAllText: {
    color: "#63272e",
    fontSize: 14,
    fontWeight: "bold",
  },

  // =======================================================
  // EMPTY
  // =======================================================

  smallEmptyContainer: {
    paddingVertical: 15,
    alignItems: "center",
  },

  smallEmptyText: {
    color: "#888",
    fontSize: 14,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#63272e",
  },

  emptySubText: {
    marginTop: 6,
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 25,
    lineHeight: 20,
  },

  // =======================================================
  // NAVIGATION
  // =======================================================

  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: "#63272e",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  navItem: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },

  navText: {
    color: "#FDF5E6",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 5,
    textAlign: "center",
  },
});