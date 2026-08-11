
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useMemo, useRef } from "react";
import * as ImagePicker from "expo-image-picker";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import api from "@/services/api";

export default function Pro() {
  const [userId, setUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(
    () => ["30%", "44%", "85%"],
    []
  );

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [username, setUsername] = useState("Username");

  const [nativeLanguage, setNativeLanguage] = useState(
    "Native Language"
  );

  const [learnedLanguage, setLearnedLanguage] = useState(
    "Learned Language"
  );

  const [bio, setBio] = useState("Add bio...");

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  const [posts, setPosts] = useState<any[]>([]);

  const [sheetOpen, setSheetOpen] = useState(false);

  // GET PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await api.get("/me");
        const user = response.data;

        // IMPORTANT:
        // Save the user's ID so we can get their posts
        setUserId(user.id);

        setUsername(user.username ?? "Username");
        setProfileImage(user.profilePicture ?? null);

        setBio(user.bio ?? "Add bio...");
        setNativeLanguage(
          user.nativeLanguage ?? "Native Language"
        );
        setLearnedLanguage(
          user.learnedLanguage ?? "Learned Language"
        );

        setFollowers(user.followers ?? 0);
        setFollowing(user.following ?? 0);
      } catch (error) {
        console.log("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // GET USER POSTS
  useEffect(() => {
    const getUserPosts = async () => {
      if (!userId) return;

      try {
        const response = await api.get(
          `/users/${userId}/posts`
        );

        setPosts(response.data);
      } catch (error) {
        console.log("Error fetching posts:", error);
      }
    };

    getUserPosts();
  }, [userId]);

  // GO TO SETTINGS
  const handleSettings = () => {
    router.push("/settings");
  };

  // GO TO COMMUNITY
  const handleCommunity = () => {
    router.push("/community");
  };

  // PICK PROFILE IMAGE
  const handlePickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission required");
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,

        allowsEditing: true,

        aspect: [1, 1],

        quality: 1,
      });

    if (!result.canceled) {
      setProfileImage(
        result.assets[0].uri
      );
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>

          {/* HEADER */}

          <View style={styles.header}>

            {/* BACK TO COMMUNITY */}

            <Pressable
              onPress={handleCommunity}
              style={styles.backButton}
            >
              <Text style={styles.backText}>
                {"<"}
              </Text>
            </Pressable>


            {/* CENTER TITLE */}

            <Text style={styles.headerText}>
              Profile
            </Text>


            {/* EDIT BUTTON */}

            <Pressable
              onPress={handleSettings}
              style={styles.headerButton}
            >
              <Text style={styles.setting}>
                edit
              </Text>
            </Pressable>

          </View>


          {/* PROFILE IMAGE */}

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


          {/* USERNAME */}

          <Text style={styles.username}>
            {username}
          </Text>


          {/* LANGUAGES */}

          <View style={styles.langContainer}>

            <Text style={styles.lang}>
              {nativeLanguage}
            </Text>

            <Text style={styles.arrow}>
              ⇆
            </Text>

            <Text style={styles.lang}>
              {learnedLanguage}
            </Text>

          </View>


          {/* BIO */}

          <Text style={styles.bio}>
            {bio}
          </Text>


          {/* FOLLOWERS / FOLLOWING */}

          <View style={styles.followersContainer}>

            <Pressable
              style={styles.stat}
              onPress={() =>
                router.push("/followers")
              }
            >
              <Text style={styles.followersText}>
                Followers
              </Text>

              <Text style={styles.followersNumber}>
                {followers}
              </Text>
            </Pressable>


            <Pressable
              style={styles.stat}
              onPress={() =>
                router.push("/following")
              }
            >
              <Text style={styles.followersText}>
                Following
              </Text>

              <Text style={styles.followersNumber}>
                {following}
              </Text>
            </Pressable>

          </View>

        </View>


        {/* BOTTOM SHEET */}

        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}

          onChange={(index) => {
            setSheetOpen(index > 0);
          }}

          backgroundStyle={{
            backgroundColor: "#63272e",
            borderTopLeftRadius: 50,
            borderTopRightRadius: 50,
          }}

          handleIndicatorStyle={{
            backgroundColor: "gray",
            width: 60,
          }}
        >

          <BottomSheetView style={styles.card}>

            {/* POSTS + COUNT */}

            <Text style={styles.postText}>
              Posts ({posts.length})
            </Text>


            {sheetOpen && (
              <View style={styles.postsContainer}>

                {posts.length === 0 ? (

                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No Posts Yet
                    </Text>
                  </View>

                ) : (

                  <FlatList
                    data={posts}
                    numColumns={3}

                    keyExtractor={(item) =>
                      item.id.toString()
                    }

                    renderItem={({ item }) => (
                      <Pressable
                        style={styles.post}
                        onPress={() =>
                          router.push(
                            `/post?id=${item.id}`
                          )
                        }
                      />
                    )}
                  />

                )}

              </View>
            )}

          </BottomSheetView>

        </BottomSheet>

      </SafeAreaView>
    </GestureHandlerRootView>
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


  /* HEADER */

  header: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    position: "relative",
  },


  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#63272e",

    // Makes Profile stay exactly in the center
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },


  /* < BUTTON */

  backButton: {
    width: 42,
    height: 42,
    borderWidth: 2,
    borderColor: "#63272e",
    backgroundColor: "#63272ed6",
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


  /* EDIT BUTTON */

  headerButton: {
    borderWidth: 2,
    borderColor: "#63272e",
    backgroundColor: "#63272ed6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,

    zIndex: 2,
  },


  setting: {
    color: "#FDF5E6",
  },


  /* PROFILE IMAGE */

  picContainer: {
    width: 150,
    height: 150,

    borderWidth: 2,
    borderColor: "#63272e",

    borderRadius: 75,

    alignSelf: "center",

    marginTop: 20,

    alignItems: "center",

    overflow: "hidden",
  },


  oneDraw: {
    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor: "#63272e",

    marginTop: 20,
  },


  twoDraw: {
    width: 100,
    height: 80,

    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,

    backgroundColor: "#63272e",

    marginTop: 10,
  },


  profileImage: {
    width: "100%",
    height: "100%",
  },


  /* USERNAME */

  username: {
    fontSize: 24,

    fontWeight: "bold",

    color: "#63272e",

    alignSelf: "center",

    marginTop: 20,
  },


  /* LANGUAGES */

  langContainer: {
    flexDirection: "row",

    justifyContent: "space-around",

    alignItems: "center",

    marginTop: 20,
  },


  lang: {
    fontSize: 15,

    fontWeight: "bold",

    borderWidth: 2,

    borderColor: "#63272e",

    backgroundColor: "#63272ed6",

    paddingHorizontal: 20,

    paddingVertical: 10,

    borderRadius: 20,

    color: "white",
  },


  arrow: {
    fontSize: 30,

    fontWeight: "bold",

    color: "#63272e",
  },


  /* BIO */

  bio: {
    fontSize: 15,

    fontWeight: "bold",

    borderWidth: 2,

    backgroundColor: "#63272ed6",

    padding: 20,

    margin: 20,

    borderColor: "#63272e",

    borderRadius: 20,

    height: 100,

    color: "white",
  },


  /* FOLLOWERS */

  followersContainer: {
    flexDirection: "row",

    justifyContent: "space-around",

    alignItems: "center",

    marginTop: 15,
  },


  stat: {
    alignItems: "center",
  },


  followersText: {
    fontSize: 25,

    color: "#63272e",

    fontWeight: "bold",
  },


  followersNumber: {
    fontSize: 25,

    color: "#63272e",

    fontWeight: "bold",

    marginTop: 5,
  },


  /* BOTTOM SHEET */

  card: {
    backgroundColor: "#63272e",

    paddingTop: 10,

    borderTopLeftRadius: 50,

    borderTopRightRadius: 50,
  },


  /* POSTS TITLE */

  postText: {
    fontSize: 20,

    fontWeight: "bold",

    color: "#FDF5E6",

    marginTop: 5,

    marginLeft: 20,
  },


  postsContainer: {
    width: "100%",
  },


  post: {
    width: "33.33%",

    aspectRatio: 1,

    backgroundColor: "#FDF5E6",

    borderWidth: 1,

    borderColor: "#63272e",
  },


  emptyContainer: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",
  },


  emptyText: {
    fontSize: 20,

    fontWeight: "bold",

    color: "#63272e",
  },

});
