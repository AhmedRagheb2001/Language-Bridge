
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { useRouter } from "expo-router";
import { useState } from "react";

import BottomSheet, {
  BottomSheetView,
} from "@gorhom/bottom-sheet";

export default function App() {
  const router = useRouter();

  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comment, setComment] = useState("");

  /*
   * TEMPORARY POSTS
   *
   * TODO:
   * Connect GET /api/v1/posts here later.
   *
   * The backend posts connection is intentionally
   * left for last, as requested.
   */
  const posts = [
    {
      id: 1,
      username: "Ahmed",
      userId: 1,
      text: "This is my first post 🚀",
      image: null,
      likes: 12,
    },
    {
      id: 2,
      username: "Sara",
      userId: 2,
      text: "Beautiful day today! ☀️",
      image:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7",
      likes: 24,
    },
    {
      id: 3,
      username: "Omar",
      userId: 3,
      text: "Anyone interested in learning a new language together?",
      image: null,
      likes: 8,
    },
    {
      id: 4,
      username: "Maya",
      userId: 4,
      text: "Had an amazing time exploring this place! 🌿",
      image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      likes: 31,
    },
  ];

  const handleLike = (postId: number) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(
        likedPosts.filter((id) => id !== postId)
      );
    } else {
      setLikedPosts([...likedPosts, postId]);
    }

    /*
     * TODO:
     * Connect like/unlike to the backend.
     *
     * The current API documentation does not provide
     * like/unlike endpoints, so this is temporarily local.
     */
  };

  const openComments = (post: any) => {
    setSelectedPost(post);
  };

  const closeComments = () => {
    setSelectedPost(null);
    setComment("");
  };

  const submitComment = () => {
    if (!comment.trim()) {
      return;
    }

    /*
     * TODO:
     * Send the comment to the backend.
     *
     * The API documentation currently provides:
     * GET    /posts/:postId/comments
     * PUT    /posts/:postId/comments/:commentId
     * DELETE /posts/:postId/comments/:commentId
     *
     * A POST create-comment endpoint was not provided.
     */

    setComment("");
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <Text style={styles.title}>
          Community
        </Text>

        <View style={styles.headerButtons}>

          {/* ADD POST */}

          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/addPost")}
          >
            <Text style={styles.plus}>
              +
            </Text>
          </Pressable>

          {/* PROFILE */}

          <Pressable
            style={styles.profileButton}
            onPress={() => router.push("/profile")}
          >
            {/* 
              TODO:
              Replace 👤 with the current user's profile
              picture from GET /api/v1/auth/me.
            */}

            <Text style={styles.profileEmoji}>
              👤
            </Text>
          </Pressable>

        </View>

      </View>


      {/* POSTS */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          posts.length === 0 && styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
      >

        {posts.length === 0 ? (

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No posts yet
            </Text>
          </View>

        ) : (

          posts.map((post) => {

            const liked = likedPosts.includes(post.id);

            return (
              <View
                style={styles.postCard}
                key={post.id}
              >

                {/* USERNAME */}

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/seeUser",
                      params: {
                        userId: post.userId,
                      },
                    })
                  }
                >
                  <Text style={styles.username}>
                    {post.username}
                  </Text>
                </Pressable>


                {/* IMAGE */}

                {post.image && (
                  <Image
                    source={{ uri: post.image }}
                    style={styles.postImage}
                  />
                )}


                {/* DESCRIPTION */}

                {post.text && (
                  <Text style={styles.postText}>
                    {post.text}
                  </Text>
                )}


                {/* ACTIONS */}

                <View style={styles.actions}>

                  {/* LIKE */}

                  <Pressable
                    style={[
                      styles.button,
                      liked && styles.likedButton,
                    ]}
                    onPress={() => handleLike(post.id)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        liked && styles.likedText,
                      ]}
                    >
                      ❤️ {post.likes + (liked ? 1 : 0)}
                    </Text>
                  </Pressable>


                  {/* COMMENT */}

                  <Pressable
                    style={styles.button}
                    onPress={() => openComments(post)}
                  >
                    <Text style={styles.buttonText}>
                      💬 Comments
                    </Text>
                  </Pressable>

                </View>

              </View>
            );
          })

        )}

      </ScrollView>


      {/* BOTTOM NAVIGATION */}

      <View style={styles.navBar}>

        {/* COMMUNITY */}

        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/community")}
        >
          <Text style={styles.navIcon}>
            🏠
          </Text>

          <Text style={styles.navText}>
            Community
          </Text>
        </Pressable>


        {/* CHATS */}

        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/chats")}
        >
          <Text style={styles.navIcon}>
            💬
          </Text>

          <Text style={styles.navText}>
            Chats
          </Text>
        </Pressable>


        {/* FRIENDS */}

        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/friends")}
        >
          <Text style={styles.navIcon}>
            👥
          </Text>

          <Text style={styles.navText}>
            Friends
          </Text>
        </Pressable>


        {/* AI */}

        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/localAi")}
        >
          <Text style={styles.navIcon}>
            🤖
          </Text>

          <Text style={styles.navText}>
            AI
          </Text>
        </Pressable>

      </View>


      {/* COMMENT BOTTOM SHEET */}

      {selectedPost && (
        <BottomSheet
          index={0}
          snapPoints={["45%", "75%"]}
          enablePanDownToClose
          onClose={closeComments}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.sheetHandle}
        >

          <BottomSheetView style={styles.sheetContent}>

            <Text style={styles.sheetTitle}>
              Comments
            </Text>

            <Text style={styles.sheetPostUsername}>
              {selectedPost.username}
            </Text>


            {/* 
              TODO:
              Load comments from:

              GET /posts/:postId/comments
            */}

            <View style={styles.noComments}>
              <Text style={styles.noCommentsText}>
                No comments yet
              </Text>
            </View>


            <KeyboardAvoidingView
              behavior={
                Platform.OS === "ios"
                  ? "padding"
                  : undefined
              }
              style={styles.commentInputContainer}
            >

              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Write a comment..."
                placeholderTextColor="#888"
                style={styles.commentInput}
              />

              <Pressable
                style={styles.sendButton}
                onPress={submitComment}
              >
                <Text style={styles.sendButtonText}>
                  Send
                </Text>
              </Pressable>

            </KeyboardAvoidingView>

          </BottomSheetView>

        </BottomSheet>
      )}

    </View>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FDF5E6",
  },


  /* HEADER */

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
    gap: 8,
  },


  /* PLUS BUTTON */

  addButton: {
    width: 42,
    height: 34,

    borderRadius: 10,

    backgroundColor: "#FDF5E6",

    alignItems: "center",
    justifyContent: "center",
  },


  plus: {
    fontSize: 25,
    color: "#63272e",
    fontWeight: "bold",

    marginTop: -2,
  },


  /* PROFILE BUTTON */

  profileButton: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor: "#FDF5E6",

    alignItems: "center",
    justifyContent: "center",
  },


  profileEmoji: {
    fontSize: 20,
  },


  /* POSTS */

  scroll: {
    flex: 1,
  },


  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },


  emptyContent: {
    flexGrow: 1,
  },


  emptyContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },


  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#63272e",
  },


  /* POST CARD */

  postCard: {
    backgroundColor: "#D8C3A5",

    borderRadius: 20,

    padding: 20,

    marginBottom: 20,
  },


  username: {
    fontSize: 18,
    fontWeight: "bold",

    color: "#63272e",

    marginBottom: 5,
  },


  postImage: {
    width: "100%",
    height: 200,

    borderRadius: 15,

    marginTop: 15,
  },


  postText: {
    marginTop: 15,

    fontSize: 16,

    color: "#333",

    lineHeight: 23,
  },


  /* ACTIONS */

  actions: {
    flexDirection: "row",

    marginTop: 20,

    gap: 15,
  },


  button: {
    borderWidth: 2,

    borderColor: "#63272e",

    paddingVertical: 8,
    paddingHorizontal: 15,

    borderRadius: 20,
  },


  likedButton: {
    backgroundColor: "#63272e",
  },


  buttonText: {
    color: "#63272e",

    fontWeight: "bold",
  },


  likedText: {
    color: "#FDF5E6",
  },


  /* BOTTOM NAVIGATION */

  navBar: {
    position: "absolute",

    bottom: 0,
    left: 0,
    right: 0,

    height: 75,

    backgroundColor: "#63272e",

    flexDirection: "row",

    justifyContent: "space-around",

    alignItems: "center",

    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },


  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },


  navIcon: {
    fontSize: 23,
  },


  navText: {
    color: "#FDF5E6",

    fontSize: 11,

    marginTop: 3,
  },


  /* COMMENT SHEET */

  sheetBackground: {
    backgroundColor: "#FDF5E6",

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },


  sheetHandle: {
    backgroundColor: "#63272e",

    width: 50,
  },


  sheetContent: {
    flex: 1,

    padding: 20,
  },


  sheetTitle: {
    fontSize: 22,

    fontWeight: "bold",

    color: "#63272e",

    textAlign: "center",

    marginBottom: 10,
  },


  sheetPostUsername: {
    fontSize: 16,

    fontWeight: "bold",

    color: "#63272e",

    marginBottom: 15,
  },


  noComments: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },


  noCommentsText: {
    color: "#777",

    fontSize: 16,
  },


  commentInputContainer: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    paddingBottom: 10,
  },


  commentInput: {
    flex: 1,

    backgroundColor: "#D8C3A5",

    borderRadius: 15,

    paddingHorizontal: 15,
    paddingVertical: 10,

    fontSize: 15,

    color: "#333",
  },


  sendButton: {
    backgroundColor: "#63272e",

    borderRadius: 15,

    paddingHorizontal: 16,
    paddingVertical: 11,
  },


  sendButtonText: {
    color: "#FDF5E6",

    fontWeight: "bold",
  },

});