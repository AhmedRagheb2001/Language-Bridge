
// app/post.tsx

import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import api from "@/services/api";


type Comment = {
  id: number;
  text: string;
  username?: string;
  user?: {
    username?: string;
  };
};


type Post = {
  id: number;

  text?: string;
  content?: string;

  image?: string;
  imageUrl?: string;

  likes?: number;
  comments?: number;

  likeCount?: number;
  commentCount?: number;

  commentsList?: Comment[];
};


export default function Post() {

  const router = useRouter();

  const { id } = useLocalSearchParams();

  const [post, setPost] = useState<Post | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);

  const [loading, setLoading] = useState(true);

  const [deleting, setDeleting] = useState(false);


  /*
   * GET POST
   */

  useEffect(() => {

    const getPost = async () => {

      if (!id) return;

      try {

        setLoading(true);

        const response = await api.get(
          `/posts/${id}`
        );

        setPost(response.data);

      } catch (error) {

        console.log(
          "Error fetching post:",
          error
        );

        Alert.alert(
          "Error",
          "Could not load this post."
        );

      } finally {

        setLoading(false);

      }

    };


    getPost();

  }, [id]);


  /*
   * GET COMMENTS
   */

  useEffect(() => {

    const getComments = async () => {

      if (!id) return;

      try {

        const response = await api.get(
          `/posts/${id}/comments`
        );

        setComments(response.data);

      } catch (error) {

        console.log(
          "Error fetching comments:",
          error
        );

      }

    };


    getComments();

  }, [id]);


  /*
   * DELETE POST
   */

  const handleDelete = () => {

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

          onPress: deletePost,
        },
      ]
    );

  };


  const deletePost = async () => {

    if (!id) return;

    try {

      setDeleting(true);

      await api.delete(
        `/posts/${id}`
      );

      Alert.alert(
        "Post Deleted",
        "Your post has been deleted."
      );

      router.back();

    } catch (error) {

      console.log(
        "Error deleting post:",
        error
      );

      Alert.alert(
        "Error",
        "Could not delete the post."
      );

    } finally {

      setDeleting(false);

    }

  };


  /*
   * LOADING
   */

  if (loading) {

    return (

      <SafeAreaView
        style={styles.loadingContainer}
      >

        <ActivityIndicator
          size="large"
          color="#63272e"
        />

      </SafeAreaView>

    );

  }


  /*
   * POST NOT FOUND
   */

  if (!post) {

    return (

      <SafeAreaView style={styles.safeArea}>

        <View style={styles.notFound}>

          <Text style={styles.notFoundText}>
            Post not found
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >

            <Text style={styles.backButtonText}>
              Go Back
            </Text>

          </Pressable>

        </View>

      </SafeAreaView>

    );

  }


  /*
   * POST DATA
   */

  const postText =
    post.text ??
    post.content ??
    "";

  const postImage =
    post.image ??
    post.imageUrl ??
    null;

  const likes =
    post.likes ??
    post.likeCount ??
    0;

  const commentCount =
    post.comments ??
    post.commentCount ??
    comments.length;


  return (

    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >


        {/* HEADER */}

        <View style={styles.header}>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >

            <Text style={styles.backText}>
              {"<"}
            </Text>

          </Pressable>


          <Text style={styles.headerTitle}>
            Post
          </Text>


          <View style={styles.headerSpace} />

        </View>


        {/* POST */}

        <View style={styles.postCard}>


          {/* IMAGE */}

          {postImage && (

            <Image
              source={{
                uri: postImage,
              }}
              style={styles.postImage}
              resizeMode="cover"
            />

          )}


          {/* TEXT */}

          {postText !== "" && (

            <Text style={styles.postText}>
              {postText}
            </Text>

          )}


          {/* LIKES / COMMENTS */}

          <View style={styles.stats}>

            <View style={styles.stat}>

              <Text style={styles.statNumber}>
                {likes}
              </Text>

              <Text style={styles.statText}>
                Likes
              </Text>

            </View>


            <View style={styles.stat}>

              <Text style={styles.statNumber}>
                {commentCount}
              </Text>

              <Text style={styles.statText}>
                Comments
              </Text>

            </View>

          </View>


        </View>


        {/* COMMENTS */}

        <View style={styles.commentsSection}>

          <Text style={styles.commentsTitle}>
            Comments
          </Text>


          {comments.length === 0 ? (

            <View style={styles.noComments}>

              <Text style={styles.noCommentsText}>
                No comments yet
              </Text>

            </View>

          ) : (

            comments.map((comment) => (

              <View
                key={comment.id}
                style={styles.comment}
              >

                <Text style={styles.commentUsername}>

                  {comment.username ??
                    comment.user?.username ??
                    "User"}

                </Text>


                <Text style={styles.commentText}>
                  {comment.text}
                </Text>

              </View>

            ))

          )}

        </View>


        {/* DELETE */}

        <Pressable
          style={[
            styles.deleteButton,
            deleting && styles.disabledButton,
          ]}
          onPress={handleDelete}
          disabled={deleting}
        >

          {deleting ? (

            <ActivityIndicator
              color="#FDF5E6"
            />

          ) : (

            <Text style={styles.deleteText}>
              Delete Post
            </Text>

          )}

        </Pressable>


      </ScrollView>

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


  scroll: {
    flex: 1,
    backgroundColor: "#FDF5E6",
  },


  scrollContent: {
    paddingBottom: 40,
  },


  /* HEADER */

  header: {
    height: 60,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 20,

    position: "relative",
  },


  headerTitle: {
    position: "absolute",

    left: 0,

    right: 0,

    textAlign: "center",

    fontSize: 24,

    fontWeight: "bold",

    color: "#63272e",
  },


  headerSpace: {
    width: 42,
  },


  backButton: {
    width: 42,
    height: 42,

    borderWidth: 2,

    borderColor: "#63272e",

    backgroundColor: "#63272e",

    borderRadius: 15,

    justifyContent: "center",

    alignItems: "center",

    zIndex: 2,
  },


  backText: {
    color: "#FDF5E6",

    fontSize: 28,

    fontWeight: "bold",

    marginTop: -3,
  },


  backButtonText: {
    color: "#FDF5E6",

    fontWeight: "bold",

    fontSize: 16,
  },


  /* POST */

  postCard: {
    margin: 20,

    backgroundColor: "#63272e",

    borderRadius: 25,

    overflow: "hidden",

    paddingBottom: 15,
  },


  postImage: {
    width: "100%",

    height: 300,

    backgroundColor: "#FDF5E6",
  },


  postText: {
    color: "#FDF5E6",

    fontSize: 18,

    fontWeight: "500",

    padding: 20,

    lineHeight: 26,
  },


  /* STATS */

  stats: {
    flexDirection: "row",

    justifyContent: "space-around",

    borderTopWidth: 1,

    borderTopColor: "#FDF5E6",

    paddingTop: 15,

    marginTop: 5,
  },


  stat: {
    alignItems: "center",
  },


  statNumber: {
    color: "#FDF5E6",

    fontSize: 22,

    fontWeight: "bold",
  },


  statText: {
    color: "#FDF5E6",

    fontSize: 14,

    marginTop: 3,
  },


  /* COMMENTS */

  commentsSection: {
    marginHorizontal: 20,
  },


  commentsTitle: {
    color: "#63272e",

    fontSize: 22,

    fontWeight: "bold",

    marginBottom: 15,
  },


  comment: {
    backgroundColor: "#63272e",

    borderRadius: 18,

    padding: 15,

    marginBottom: 10,
  },


  commentUsername: {
    color: "#FDF5E6",

    fontWeight: "bold",

    fontSize: 15,

    marginBottom: 5,
  },


  commentText: {
    color: "#FDF5E6",

    fontSize: 15,
  },


  noComments: {
    alignItems: "center",

    paddingVertical: 20,
  },


  noCommentsText: {
    color: "#63272e",

    fontSize: 16,

    fontWeight: "500",
  },


  /* DELETE */

  deleteButton: {
    marginHorizontal: 20,

    marginTop: 25,

    height: 52,

    borderRadius: 18,

    backgroundColor: "#63272e",

    justifyContent: "center",

    alignItems: "center",
  },


  deleteText: {
    color: "#FDF5E6",

    fontSize: 17,

    fontWeight: "bold",
  },


  disabledButton: {
    opacity: 0.6,
  },


  /* NOT FOUND */

  notFound: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",
  },


  notFoundText: {
    color: "#63272e",

    fontSize: 20,

    fontWeight: "bold",

    marginBottom: 20,
  },

});