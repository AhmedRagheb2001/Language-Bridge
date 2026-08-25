
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

type Profile = {
  displayName?: string | null;
  profilePictureUrl?: string | null;
};

type FriendUser = {
  id?: number | string;
  displayName?: string | null;
  profilePictureUrl?: string | null;
  profile?: Profile | null;

  user?: {
    id?: number | string;
    displayName?: string | null;
    profilePictureUrl?: string | null;
    profile?: Profile | null;
  } | null;

  friend?: {
    id?: number | string;
    displayName?: string | null;
    profilePictureUrl?: string | null;
    profile?: Profile | null;
  } | null;
};

type ChatFriend = {
  id: number | string;

  profile?: {
    displayName?: string | null;
    profilePictureUrl?: string | null;
  } | null;

  displayName?: string | null;
  profilePictureUrl?: string | null;
};

type Chat = {
  chatId: string;
  chatFriend: ChatFriend;

  // Possible unread fields from backend
  unreadCount?: number | string;
  unread?: boolean;
  isUnread?: boolean;
  hasUnread?: boolean;

  // Possible timestamps from backend
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
  latestMessageAt?: string;
  lastActivityAt?: string;

  lastMessage?: {
    id?: number | string;
    content?: string | null;
    createdAt?: string;
    updatedAt?: string;
    senderId?: number | string;
    userId?: number | string;
  } | null;

  // Allows additional backend fields
  [key: string]: any;
};

// =========================================================
// CHATS
// =========================================================

export default function Chats() {
  const router = useRouter();

  // =======================================================
  // STATE
  // =======================================================

  const [friends, setFriends] =
    useState<FriendUser[]>([]);

  const [chats, setChats] =
    useState<Chat[]>([]);

  const [loading, setLoading] =
    useState(true);

  // =======================================================
  // GET FRIEND ID
  // =======================================================

  const getFriendId = (
    friend: FriendUser
  ): string | null => {
    if (
      friend?.id !== undefined &&
      friend?.id !== null
    ) {
      return String(friend.id);
    }

    if (
      friend?.user?.id !== undefined &&
      friend?.user?.id !== null
    ) {
      return String(friend.user.id);
    }

    if (
      friend?.friend?.id !== undefined &&
      friend?.friend?.id !== null
    ) {
      return String(friend.friend.id);
    }

    return null;
  };

  // =======================================================
  // GET FRIEND NAME
  // =======================================================

  const getFriendName = (
    friend: FriendUser
  ): string => {
    return (
      friend?.profile?.displayName ||
      friend?.displayName ||
      friend?.user?.profile?.displayName ||
      friend?.user?.displayName ||
      friend?.friend?.profile?.displayName ||
      friend?.friend?.displayName ||
      "User"
    );
  };

  // =======================================================
  // GET FRIEND IMAGE
  // =======================================================

  const getFriendImage = (
    friend: FriendUser
  ): string | null => {
    return (
      friend?.profile?.profilePictureUrl ||
      friend?.profilePictureUrl ||
      friend?.user?.profile?.profilePictureUrl ||
      friend?.user?.profilePictureUrl ||
      friend?.friend?.profile?.profilePictureUrl ||
      friend?.friend?.profilePictureUrl ||
      null
    );
  };

  // =======================================================
  // CHECK FOR NEW MESSAGE
  // =======================================================

  const hasNewMessage = (
    chat: Chat
  ): boolean => {
    // unreadCount as a number
    if (
      typeof chat?.unreadCount === "number" &&
      chat.unreadCount > 0
    ) {
      return true;
    }

    // unreadCount as a string
    if (
      chat?.unreadCount !== undefined &&
      Number(chat.unreadCount) > 0
    ) {
      return true;
    }

    // Boolean fields
    if (chat?.hasUnread === true) {
      return true;
    }

    if (chat?.isUnread === true) {
      return true;
    }

    if (chat?.unread === true) {
      return true;
    }

    return false;
  };

  // =======================================================
  // GET CHAT TIMESTAMP
  // =======================================================

  const getChatTimestamp = (
    chat: Chat
  ): number => {
    const dateValue =
      chat?.lastMessage?.createdAt ||
      chat?.lastMessage?.updatedAt ||
      chat?.lastMessageAt ||
      chat?.latestMessageAt ||
      chat?.lastActivityAt ||
      chat?.updatedAt ||
      chat?.createdAt;

    if (!dateValue) {
      return 0;
    }

    const timestamp =
      new Date(dateValue).getTime();

    return Number.isNaN(timestamp)
      ? 0
      : timestamp;
  };

  // =======================================================
  // SORT CHATS
  // =======================================================
  //
  // New/unread chats are placed first.
  // Within the same unread/read group,
  // newest activity is first.
  // =======================================================

  const sortChats = (
    chatList: Chat[]
  ): Chat[] => {
    return [...chatList].sort(
      (a, b) => {
        const aUnread =
          hasNewMessage(a);

        const bUnread =
          hasNewMessage(b);

        // Unread chats first
        if (
          aUnread &&
          !bUnread
        ) {
          return -1;
        }

        if (
          !aUnread &&
          bUnread
        ) {
          return 1;
        }

        // Newest activity first
        return (
          getChatTimestamp(b) -
          getChatTimestamp(a)
        );
      }
    );
  };

  // =======================================================
  // FETCH ALL FRIENDS
  // =======================================================

  const fetchFriends = async () => {
    try {
      const response =
        await api.get("/friends");

      console.log(
        "FRIENDS RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      let receivedFriends: any[] = [];

      if (
        Array.isArray(response.data)
      ) {
        receivedFriends =
          response.data;
      } else if (
        Array.isArray(
          response.data?.friends
        )
      ) {
        receivedFriends =
          response.data.friends;
      } else if (
        Array.isArray(
          response.data?.data
        )
      ) {
        receivedFriends =
          response.data.data;
      } else if (
        Array.isArray(
          response.data?.data?.friends
        )
      ) {
        receivedFriends =
          response.data.data.friends;
      }

      console.log(
        "TOTAL FRIENDS:",
        receivedFriends.length
      );

      setFriends(
        receivedFriends
      );
    } catch (error: any) {
      console.log(
        "Fetch friends error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setFriends([]);
    }
  };

  // =======================================================
  // FETCH EXISTING CHATS
  // =======================================================

  const fetchChats = async () => {
    try {
      const response =
        await api.get("/chats");

      console.log(
        "CHATS RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      let receivedChats: Chat[] = [];

      if (
        Array.isArray(response.data)
      ) {
        receivedChats =
          response.data;
      } else if (
        Array.isArray(
          response.data?.chats
        )
      ) {
        receivedChats =
          response.data.chats;
      } else if (
        Array.isArray(
          response.data?.data?.chats
        )
      ) {
        receivedChats =
          response.data.data.chats;
      } else if (
        Array.isArray(
          response.data?.data
        )
      ) {
        receivedChats =
          response.data.data;
      }

      console.log(
        "TOTAL CHATS:",
        receivedChats.length
      );

      // Sort newest/unread chats first
      const sortedChats =
        sortChats(receivedChats);

      console.log(
        "SORTED CHATS:",
        JSON.stringify(
          sortedChats,
          null,
          2
        )
      );

      setChats(sortedChats);
    } catch (error: any) {
      console.log(
        "Fetch chats error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setChats([]);
    }
  };

  // =======================================================
  // LOAD PAGE
  // =======================================================

  const loadData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchFriends(),
        fetchChats(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // REFRESH WHEN PAGE OPENS
  // =======================================================

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // =======================================================
  // OPEN FRIEND CHAT
  // =======================================================

  const openFriendChat = (
    friend: FriendUser
  ) => {
    const friendId =
      getFriendId(friend);

    if (!friendId) {
      console.log(
        "NO FRIEND ID:",
        friend
      );
      return;
    }

    console.log(
      "================================="
    );

    console.log(
      "OPENING FRIEND CHAT"
    );

    console.log(
      "Friend:",
      getFriendName(friend)
    );

    console.log(
      "Friend ID:",
      friendId
    );

    console.log(
      "================================="
    );

    router.push({
      pathname: "/chat" as any,
      params: {
        friendId,
      },
    });
  };

  // =======================================================
  // OPEN EXISTING CHAT
  // =======================================================

  const openChat = (
    chat: Chat
  ) => {
    if (!chat?.chatId) {
      console.log(
        "NO CHAT ID:",
        chat
      );
      return;
    }

    const friendId =
      chat?.chatFriend?.id;

    console.log(
      "OPENING EXISTING CHAT:",
      chat.chatId
    );

    router.push({
      pathname: "/chat" as any,
      params: {
        chatId: String(
          chat.chatId
        ),

        ...(friendId !==
        undefined
          ? {
              friendId:
                String(
                  friendId
                ),
            }
          : {}),
      },
    });
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
          style={
            styles.loadingText
          }
        >
          Loading chats...
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
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          Chats
        </Text>

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

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ================================================= */}
        {/* FRIENDS */}
        {/* ================================================= */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Friends
        </Text>

        {friends.length === 0 ? (
          <View
            style={
              styles.noFriends
            }
          >
            <Text
              style={
                styles.noFriendsText
              }
            >
              No friends yet
            </Text>

            <Text
              style={
                styles.noFriendsSubText
              }
            >
              Add a friend to
              start chatting.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.friendsRow
            }
          >
            {friends.map(
              (
                friend,
                index
              ) => {
                const friendId =
                  getFriendId(
                    friend
                  );

                const name =
                  getFriendName(
                    friend
                  );

                const image =
                  getFriendImage(
                    friend
                  );

                return (
                  <Pressable
                    key={
                      friendId
                        ? `friend-${friendId}`
                        : `friend-${index}`
                    }
                    style={
                      styles.friendCard
                    }
                    onPress={() =>
                      openFriendChat(
                        friend
                      )
                    }
                    android_ripple={{
                      color:
                        "#B9A17F",
                    }}
                  >
                    <View
                      style={
                        styles.friendAvatarContainer
                      }
                    >
                      {image ? (
                        <Image
                          source={{
                            uri: image,
                          }}
                          style={
                            styles.friendAvatar
                          }
                          resizeMode="cover"
                        />
                      ) : (
                        <DefaultAvatarMini
                          size={48}
                        />
                      )}
                    </View>

                    <Text
                      style={
                        styles.friendName
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {name}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>
        )}

        {/* ================================================= */}
        {/* MESSAGES */}
        {/* ================================================= */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Messages
        </Text>

        {chats.length === 0 ? (
          <View
            style={
              styles.emptyMessages
            }
          >
            <ChatsIcon
              size={50}
              color="#D8C3A5"
            />

            <Text
              style={
                styles.emptyMessagesTitle
              }
            >
              No messages yet
            </Text>

            <Text
              style={
                styles.emptyMessagesText
              }
            >
              Tap a friend above
              to start a
              conversation.
            </Text>
          </View>
        ) : (
          <View
            style={styles.chatList}
          >
            {chats.map(
              (
                chat,
                index
              ) => {
                const friend =
                  chat.chatFriend;

                const name =
                  friend?.profile
                    ?.displayName ||
                  friend?.displayName ||
                  "User";

                const image =
                  friend?.profile
                    ?.profilePictureUrl ||
                  friend?.profilePictureUrl ||
                  null;

                const newMessage =
                  hasNewMessage(
                    chat
                  );

                return (
                  <Pressable
                    key={
                      chat.chatId
                        ? `message-${chat.chatId}`
                        : `message-${index}`
                    }
                    style={[
                      styles.chatItem,
                      newMessage &&
                        styles.unreadChatItem,
                    ]}
                    onPress={() =>
                      openChat(
                        chat
                      )
                    }
                    android_ripple={{
                      color:
                        "#E5D8C5",
                    }}
                  >
                    {/* AVATAR */}

                    <View
                      style={
                        styles.chatAvatarContainer
                      }
                    >
                      {image ? (
                        <Image
                          source={{
                            uri: image,
                          }}
                          style={
                            styles.chatAvatar
                          }
                          resizeMode="cover"
                        />
                      ) : (
                        <DefaultAvatarMini
                          size={54}
                        />
                      )}
                    </View>

                    {/* CHAT INFO */}

                    <View
                      style={
                        styles.chatInfo
                      }
                    >
                      <Text
                        style={
                          styles.chatName
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {name}
                      </Text>

                      <Text
                        style={
                          styles.chatSubText
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {newMessage
                          ? "New message"
                          : "Tap to open conversation"}
                      </Text>
                    </View>

                    {/* ================================================= */}
                    {/* NEW MESSAGE DOT */}
                    {/* ================================================= */}

                    {newMessage && (
                      <View
                        style={
                          styles.notificationDot
                        }
                      />
                    )}

                    {/* ARROW */}

                    <Text
                      style={
                        styles.chatArrow
                      }
                    >
                      ›
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        )}
      </ScrollView>

      {/* ================================================= */}
      {/* BOTTOM NAVIGATION */}
      {/* ================================================= */}

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
            style={styles.navText}
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
            style={styles.navText}
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
            style={styles.navText}
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
      borderBottomLeftRadius:
        40,
      borderBottomRightRadius:
        40,
    },

    title: {
      fontSize: 25,
      fontWeight: "bold",
      color: "#FDF5E6",
    },

    profileButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent:
        "center",
    },

    // =====================================================
    // SCROLL
    // =====================================================

    scroll: {
      flex: 1,
    },

    scrollContent: {
      padding: 20,
      paddingBottom: 105,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#63272e",
      marginBottom: 14,
    },

    // =====================================================
    // FRIENDS
    // =====================================================

    friendsRow: {
      paddingBottom: 28,
      paddingRight: 10,
      gap: 12,
    },

    friendCard: {
      width: 78,
      backgroundColor:
        "#D8C3A5",
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent:
        "center",
    },

    friendAvatarContainer: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 7,
      borderRadius: 24,
      overflow: "hidden",
    },

    friendAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },

    friendName: {
      width: 65,
      textAlign: "center",
      color: "#63272e",
      fontSize: 12,
      fontWeight: "bold",
    },

    noFriends: {
      backgroundColor:
        "#D8C3A5",
      borderRadius: 18,
      padding: 20,
      alignItems: "center",
      marginBottom: 28,
    },

    noFriendsText: {
      color: "#63272e",
      fontSize: 16,
      fontWeight: "bold",
    },

    noFriendsSubText: {
      color: "#777",
      fontSize: 13,
      marginTop: 5,
      textAlign: "center",
    },

    // =====================================================
    // CHAT LIST
    // =====================================================

    chatList: {
      width: "100%",
      gap: 10,
    },

    chatItem: {
      width: "100%",
      minHeight: 76,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor:
        "#E5D8C5",
    },

    unreadChatItem: {
      borderColor:
        "#D8C3A5",
    },

    chatAvatarContainer: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent:
        "center",
      overflow: "hidden",
      marginRight: 13,
    },

    chatAvatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
    },

    chatInfo: {
      flex: 1,
      justifyContent:
        "center",
    },

    chatName: {
      color: "#63272e",
      fontSize: 16,
      fontWeight: "bold",
    },

    chatSubText: {
      color: "#8A7A68",
      fontSize: 13,
      marginTop: 5,
    },

    // =====================================================
    // NOTIFICATION DOT
    // =====================================================

    notificationDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor:
        "#63272e",
      marginLeft: 8,
      marginRight: 8,
    },

    chatArrow: {
      color: "#63272e",
      fontSize: 28,
      fontWeight: "300",
      marginLeft: 2,
    },

    // =====================================================
    // EMPTY MESSAGES
    // =====================================================

    emptyMessages: {
      backgroundColor:
        "#D8C3A5",
      borderRadius: 22,
      minHeight: 230,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
      marginTop: 2,
    },

    emptyMessagesTitle: {
      marginTop: 14,
      fontSize: 20,
      fontWeight: "bold",
      color: "#63272e",
    },

    emptyMessagesText: {
      marginTop: 7,
      fontSize: 14,
      color: "#777",
      textAlign: "center",
      lineHeight: 20,
    },

    // =====================================================
    // BOTTOM NAVIGATION
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
      borderTopLeftRadius:
        28,
      borderTopRightRadius:
        28,
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
  });
