import DefaultAvatarMini from "@/components/DefaultAvatarMini";
import api from "@/services/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { io, Socket } from "socket.io-client";

// ============================================================
// TYPES
// ============================================================

type ChatFriend = {
  id: string | number;
  profile?: {
    displayName?: string | null;
    profilePictureUrl?: string | null;
  } | null;
};

type ChatResponse = {
  chatId: string;
  chatFriend: ChatFriend;
};

type Message = {
  id?: string | number;
  chatId?: string;
  senderId?: string | number;
  receiverId?: string | number;
  content?: string;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
  sender?: {
    id?: string | number;
    profile?: {
      displayName?: string | null;
      profilePictureUrl?: string | null;
    } | null;
  };
};

// ============================================================
// SOCKET URL
// ============================================================

const SOCKET_URL =
  "https://language-bridge-1.onrender.com";

// ============================================================
// CHAT
// ============================================================

export default function Chat() {
  const router = useRouter();

  // ==========================================================
  // PARAMETERS
  // ==========================================================

  const params =
    useLocalSearchParams<{
      friendId?: string;
      chatId?: string;
      id?: string;
    }>();

  /*
   * IMPORTANT:
   *
   * friendId = user we selected from Friends
   *
   * chatId = existing conversation
   *
   * We DO NOT treat friendId as chatId.
   */

  const friendId = params.friendId
    ? String(params.friendId)
    : null;

  const existingChatId = params.chatId
    ? String(params.chatId)
    : null;

  // ==========================================================
  // STATE
  // ==========================================================

  const [chatId, setChatId] =
    useState<string | null>(
      existingChatId
    );

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [friend, setFriend] =
    useState<ChatFriend | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [messageText, setMessageText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [online, setOnline] =
    useState(false);

  const [typing, setTyping] =
    useState(false);

  // ==========================================================
  // REFS
  // ==========================================================

  const socketRef =
    useRef<Socket | null>(null);

  const scrollViewRef =
    useRef<ScrollView | null>(null);

  const typingTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  // ==========================================================
  // FRIEND NAME
  // ==========================================================

  const getFriendName = useCallback(() => {
    return (
      friend?.profile?.displayName ||
      "User"
    );
  }, [friend]);

  // ==========================================================
  // FRIEND IMAGE
  // ==========================================================

  const getFriendImage = useCallback(() => {
    return (
      friend?.profile?.profilePictureUrl ||
      null
    );
  }, [friend]);

  // ==========================================================
  // LOAD CURRENT USER
  // ==========================================================

  const loadCurrentUser =
    useCallback(async () => {
      try {
        const response =
          await api.get("/auth/me");

        const user =
          response.data?.user ??
          response.data;

        if (
          user?.id !== undefined &&
          user?.id !== null
        ) {
          setCurrentUserId(
            String(user.id)
          );
        }
      } catch (error) {
        console.log(
          "Could not load current user:",
          error
        );
      }
    }, []);

  // ==========================================================
  // LOAD CHAT
  // ==========================================================

  const loadChat =
    useCallback(async () => {
      try {
        setLoading(true);

        let response: any;

        // ====================================================
        // CASE 1:
        // We already know the chat ID.
        // ====================================================

        if (existingChatId) {
          console.log(
            "Loading EXISTING CHAT:",
            existingChatId
          );

          response =
            await api.get(
              `/chats/${existingChatId}`
            );
        }

        // ====================================================
        // CASE 2:
        // We came from the FRIENDS section.
        //
        // We have a FRIEND ID, not a CHAT ID.
        // ====================================================

        else if (friendId) {
          console.log(
            "Loading chat for FRIEND:",
            friendId
          );

          /*
           * First try to find an existing chat
           * belonging to this friend.
           *
           * This prevents accidentally opening
           * another user's chat.
           */

          try {
            const chatsResponse =
              await api.get("/chats");

            const allChats =
              Array.isArray(
                chatsResponse.data
              )
                ? chatsResponse.data
                : chatsResponse.data?.chats ??
                  [];

            const matchingChat =
              allChats.find(
                (item: any) => {
                  const itemFriendId =
                    item?.chatFriend?.id;

                  return (
                    itemFriendId !==
                      undefined &&
                    String(
                      itemFriendId
                    ) ===
                      String(friendId)
                  );
                }
              );

            if (matchingChat?.chatId) {
              console.log(
                "FOUND EXISTING CHAT:",
                matchingChat.chatId
              );

              response = {
                data: matchingChat,
              };
            }
          } catch (error) {
            console.log(
              "Could not search existing chats:",
              error
            );
          }

          /*
           * If no existing chat was found,
           * create/get the chat for THIS friend.
           */

          if (!response) {
            console.log(
              "No existing chat found."
            );

            console.log(
              "Creating/getting chat for friend:",
              friendId
            );

            response =
              await api.post(
                `/chats/${friendId}`
              );
          }
        }

        // ====================================================
        // CASE 3:
        // Old `id` parameter.
        // ====================================================

        else if (params.id) {
          const oldId =
            String(params.id);

          console.log(
            "Using old chat ID:",
            oldId
          );

          response =
            await api.get(
              `/chats/${oldId}`
            );
        } else {
          console.log(
            "No friendId or chatId received."
          );

          setLoading(false);
          return;
        }

        // ====================================================
        // CHAT RESPONSE
        // ====================================================

        const data =
          response?.data as ChatResponse;

        console.log(
          "CHAT DATA:",
          JSON.stringify(
            data,
            null,
            2
          )
        );

        if (!data?.chatId) {
          console.log(
            "Invalid chat response:",
            data
          );

          setLoading(false);
          return;
        }

        // ====================================================
        // SAVE REAL CHAT ID
        // ====================================================

        const realChatId =
          String(data.chatId);

        setChatId(realChatId);

        // ====================================================
        // SAVE FRIEND
        // ====================================================

        if (data.chatFriend) {
          setFriend(
            data.chatFriend
          );
        }

        console.log(
          "REAL CHAT ID:",
          realChatId
        );

        console.log(
          "REAL FRIEND:",
          data.chatFriend
        );

        // ====================================================
        // LOAD MESSAGES
        // ====================================================

        try {
          const messagesResponse =
            await api.get(
              `/chats/${realChatId}/messages`
            );

          const receivedMessages =
            messagesResponse.data
              ?.allMessages;

          if (
            Array.isArray(
              receivedMessages
            )
          ) {
            setMessages(
              receivedMessages
            );
          } else {
            setMessages([]);
          }
        } catch (messageError) {
          console.log(
            "Could not load messages:",
            messageError
          );

          setMessages([]);
        }
      } catch (error: any) {
        console.log(
          "Load chat error:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setMessages([]);
      } finally {
        setLoading(false);
      }
    }, [
      friendId,
      existingChatId,
      params.id,
    ]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadCurrentUser();
    loadChat();
  }, [
    loadCurrentUser,
    loadChat,
  ]);

  // ==========================================================
  // SOCKET.IO
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    let socket: Socket | null =
      null;

    const connectSocket =
      async () => {
        try {
          const token =
            await AsyncStorage.getItem(
              "accessToken"
            );

          if (!token) {
            console.log(
              "No access token for Socket.IO."
            );

            return;
          }

          socket = io(
            SOCKET_URL,
            {
              path:
                "/api/socket-io/socket.io",

              transports: [
                "websocket",
                "polling",
              ],

              auth: {
                token,
              },

              reconnection: true,
              reconnectionAttempts: 10,
              reconnectionDelay: 1000,
            }
          );

          socketRef.current =
            socket;

          // ==================================================
          // CONNECT
          // ==================================================

          socket.on(
            "connect",
            () => {
              console.log(
                "Socket connected:",
                socket?.id
              );

              if (
                chatId &&
                mounted
              ) {
                socket?.emit(
                  "join:chat",
                  {
                    chatId,
                  }
                );

                console.log(
                  "Joined chat:",
                  chatId
                );
              }
            }
          );

          // ==================================================
          // CONNECT ERROR
          // ==================================================

          socket.on(
            "connect_error",
            (error) => {
              console.log(
                "Socket connection error:",
                error.message
              );
            }
          );

          // ==================================================
          // PRESENCE
          // ==================================================

          socket.on(
            "presence:update",
            (data) => {
              if (!data?.userId) {
                return;
              }

              if (
                friend &&
                String(
                  data.userId
                ) ===
                  String(friend.id)
              ) {
                setOnline(
                  Boolean(
                    data.online
                  )
                );
              }
            }
          );

          // ==================================================
          // TYPING START
          // ==================================================

          socket.on(
            "typing:start",
            (data) => {
              if (
                !data?.chatId ||
                String(
                  data.chatId
                ) !==
                  String(chatId)
              ) {
                return;
              }

              if (
                String(
                  data.userId
                ) !==
                  String(
                    currentUserId
                  )
              ) {
                setTyping(true);
              }
            }
          );

          // ==================================================
          // TYPING STOP
          // ==================================================

          socket.on(
            "typing:stop",
            (data) => {
              if (
                !data?.chatId ||
                String(
                  data.chatId
                ) !==
                  String(chatId)
              ) {
                return;
              }

              if (
                String(
                  data.userId
                ) !==
                  String(
                    currentUserId
                  )
              ) {
                setTyping(false);
              }
            }
          );

          // ==================================================
          // NEW MESSAGE
          // ==================================================

          socket.on(
            "new:message",
            (message: Message) => {
              if (!message) {
                return;
              }

              if (
                message.chatId &&
                String(
                  message.chatId
                ) !==
                  String(chatId)
              ) {
                return;
              }

              setMessages(
                (previous) => {
                  if (
                    message.id &&
                    previous.some(
                      (item) =>
                        item.id &&
                        String(
                          item.id
                        ) ===
                          String(
                            message.id
                          )
                    )
                  ) {
                    return previous;
                  }

                  return [
                    ...previous,
                    message,
                  ];
                }
              );

              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd(
                  {
                    animated: true,
                  }
                );
              }, 100);
            }
          );
        } catch (error) {
          console.log(
            "Socket setup error:",
            error
          );
        }
      };

    connectSocket();

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      mounted = false;

      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );
      }

      if (
        socket &&
        socket.connected &&
        chatId
      ) {
        socket.emit(
          "leave:chat",
          {
            chatId,
          }
        );
      }

      socket?.disconnect();

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current =
          null;
      }
    };
  }, [
    chatId,
    friend,
    currentUserId,
  ]);

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const sendMessage =
    async () => {
      const text =
        messageText.trim();

      if (!text) {
        return;
      }

      if (!chatId) {
        console.log(
          "Cannot send: no chat ID."
        );

        return;
      }

      if (sending) {
        return;
      }

      try {
        setSending(true);

        const socket =
          socketRef.current;

        if (
          socket &&
          socket.connected
        ) {
          socket.emit(
            "typing:stop",
            {
              chatId,
            }
          );
        }

        await api.post(
          `/chats/${chatId}/messages`,
          {
            content: text,
          }
        );

        setMessageText("");
        setTyping(false);
      } catch (error: any) {
        console.log(
          "Send message error:",
          error?.response?.data ||
            error?.message ||
            error
        );
      } finally {
        setSending(false);
      }
    };

  // ==========================================================
  // HANDLE TYPING
  // ==========================================================

  const handleTyping =
    (text: string) => {
      setMessageText(text);

      const socket =
        socketRef.current;

      if (
        !socket ||
        !socket.connected ||
        !chatId
      ) {
        return;
      }

      if (!text.trim()) {
        socket.emit(
          "typing:stop",
          {
            chatId,
          }
        );

        return;
      }

      socket.emit(
        "typing:start",
        {
          chatId,
        }
      );

      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );
      }

      typingTimeoutRef.current =
        setTimeout(() => {
          socket.emit(
            "typing:stop",
            {
              chatId,
            }
          );
        }, 1200);
    };

  // ==========================================================
  // MESSAGE TEXT
  // ==========================================================

  const getMessageText =
    (message: Message) => {
      return (
        message.content ??
        message.text ??
        ""
      );
    };

  // ==========================================================
  // MESSAGE SENDER
  // ==========================================================

  const getSenderId =
    (message: Message) => {
      return (
        message.senderId ??
        message.sender?.id ??
        null
      );
    };

  // ==========================================================
  // IS MY MESSAGE
  // ==========================================================

  const isMyMessage =
    (message: Message) => {
      const senderId =
        getSenderId(message);

      if (
        senderId === null ||
        currentUserId === null
      ) {
        return false;
      }

      return (
        String(senderId) ===
        String(currentUserId)
      );
    };

  // ==========================================================
  // LOADING
  // ==========================================================

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
          Loading chat...
        </Text>
      </View>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
      keyboardVerticalOffset={0}
    >
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <View
        style={styles.header}
      >
        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#FDF5E6"
          />
        </Pressable>

        <View
          style={
            styles.headerAvatarContainer
          }
        >
          {getFriendImage() ? (
            <Image
              source={{
                uri:
                  getFriendImage()!,
              }}
              style={
                styles.headerAvatar
              }
            />
          ) : (
            <DefaultAvatarMini
              size={44}
            />
          )}

          {online && (
            <View
              style={
                styles.onlineDot
              }
            />
          )}
        </View>

        <View
          style={
            styles.headerInfo
          }
        >
          {/* ================================================== */}
          {/* USERNAME BUTTON */}
          {/* ================================================== */}

          <Pressable
            onPress={() => {
              if (friend?.id) {
                router.push({
                  pathname:
                    "/seeUser",
                  params: {
                    userId:
                      String(
                        friend.id
                      ),
                  },
                });
              }
            }}
            disabled={!friend?.id}
            hitSlop={5}
          >
            <Text
              style={
                styles.headerName
              }
              numberOfLines={1}
            >
              {getFriendName()}
            </Text>
          </Pressable>

          <Text
            style={
              styles.headerStatus
            }
          >
            {typing
              ? "typing..."
              : online
                ? "Online"
                : "Offline"}
          </Text>
        </View>
      </View>

      {/* ================================================== */}
      {/* MESSAGES */}
      {/* ================================================== */}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messages}
        contentContainerStyle={
          styles.messagesContent
        }
        showsVerticalScrollIndicator={
          false
        }
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd(
            {
              animated: false,
            }
          )
        }
      >
        {messages.length === 0 ? (
          <View
            style={
              styles.emptyChat
            }
          >
            {getFriendImage() ? (
              <Image
                source={{
                  uri:
                    getFriendImage()!,
                }}
                style={
                  styles.emptyAvatar
                }
              />
            ) : (
              <DefaultAvatarMini
                size={70}
              />
            )}

            <Text
              style={
                styles.emptyName
              }
            >
              {getFriendName()}
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Start a conversation
              with{" "}
              {getFriendName()}.
            </Text>
          </View>
        ) : (
          messages.map(
            (
              message,
              index
            ) => {
              const mine =
                isMyMessage(
                  message
                );

              const text =
                getMessageText(
                  message
                );

              if (!text) {
                return null;
              }

              return (
                <View
                  key={
                    message.id
                      ? String(
                          message.id
                        )
                      : `message-${index}`
                  }
                  style={[
                    styles.messageRow,
                    mine
                      ? styles.myMessageRow
                      : styles.friendMessageRow,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      mine
                        ? styles.myBubble
                        : styles.friendBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        mine
                          ? styles.myMessageText
                          : styles.friendMessageText,
                      ]}
                    >
                      {text}
                    </Text>
                  </View>
                </View>
              );
            }
          )
        )}
      </ScrollView>

      {/* ================================================== */}
      {/* INPUT */}
      {/* ================================================== */}

      <View
        style={
          styles.inputContainer
        }
      >
        <TextInput
          value={messageText}
          onChangeText={
            handleTyping
          }
          placeholder="Write a message..."
          placeholderTextColor="#9A8A75"
          style={styles.input}
          multiline
          maxLength={2000}
          editable={!sending}
          onSubmitEditing={() => {
            if (
              Platform.OS !== "ios"
            ) {
              sendMessage();
            }
          }}
        />

        <Pressable
          style={[
            styles.sendButton,
            (
              !messageText.trim() ||
              sending
            ) &&
              styles.sendButtonDisabled,
          ]}
          onPress={
            sendMessage
          }
          disabled={
            !messageText.trim() ||
            sending
          }
        >
          {sending ? (
            <ActivityIndicator
              size="small"
              color="#FDF5E6"
            />
          ) : (
            <Ionicons
              name="send"
              size={21}
              color="#FDF5E6"
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
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

    header: {
      height: 100,
      backgroundColor: "#63272e",
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 15,
      paddingBottom: 16,
      borderBottomLeftRadius: 35,
      borderBottomRightRadius: 35,
    },

    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 5,
      marginBottom: 1,
    },

    headerAvatarContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 11,
      position: "relative",
    },

    headerAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },

    onlineDot: {
      position: "absolute",
      right: -1,
      bottom: 1,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#48A868",
      borderWidth: 2,
      borderColor: "#63272e",
    },

    headerInfo: {
      flex: 1,
      justifyContent: "center",
      marginBottom: 2,
    },

    headerName: {
      color: "#FDF5E6",
      fontSize: 18,
      fontWeight: "bold",
    },

    headerStatus: {
      color: "#D8C3A5",
      fontSize: 12,
      marginTop: 2,
    },

    messages: {
      flex: 1,
    },

    messagesContent: {
      paddingHorizontal: 15,
      paddingTop: 18,
      paddingBottom: 15,
      flexGrow: 1,
    },

    messageRow: {
      width: "100%",
      marginBottom: 9,
      flexDirection: "row",
    },

    myMessageRow: {
      justifyContent: "flex-end",
    },

    friendMessageRow: {
      justifyContent: "flex-start",
    },

    messageBubble: {
      maxWidth: "78%",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 19,
    },

    myBubble: {
      backgroundColor: "#63272e",
      borderBottomRightRadius: 5,
    },

    friendBubble: {
      backgroundColor: "#D8C3A5",
      borderBottomLeftRadius: 5,
    },

    messageText: {
      fontSize: 15,
      lineHeight: 21,
    },

    myMessageText: {
      color: "#FDF5E6",
    },

    friendMessageText: {
      color: "#63272e",
    },

    emptyChat: {
      flex: 1,
      minHeight: 450,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 35,
    },

    emptyAvatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginBottom: 12,
    },

    emptyName: {
      color: "#63272e",
      fontSize: 21,
      fontWeight: "bold",
      marginTop: 10,
    },

    emptyText: {
      color: "#777",
      fontSize: 14,
      textAlign: "center",
      marginTop: 7,
      lineHeight: 20,
    },

    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 12,
      paddingTop: 9,
      paddingBottom:
        Platform.OS === "ios"
          ? 18
          : 10,
      backgroundColor: "#FDF5E6",
      borderTopWidth: 1,
      borderTopColor: "#E5D8C5",
    },

    input: {
      flex: 1,
      minHeight: 46,
      maxHeight: 110,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#D8C3A5",
      borderRadius: 23,
      paddingHorizontal: 17,
      paddingTop: 12,
      paddingBottom: 10,
      color: "#63272e",
      fontSize: 15,
    },

    sendButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: "#63272e",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },

    sendButtonDisabled: {
      opacity: 0.45,
    },
  });