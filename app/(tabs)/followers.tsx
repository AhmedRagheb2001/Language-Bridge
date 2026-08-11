
// app/followers.tsx

import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import api from "@/services/api";

type User = {
  id: number;
  username: string;
  displayName?: string;
};

export default function Followers() {
  const router = useRouter();

  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const response = await api.get("/me/followers");

        setFollowers(response.data ?? []);
      } catch (error) {
        console.log("Error fetching followers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, []);

  const handleAccept = async (userId: number) => {
    try {
      setAcceptingId(userId);

      await api.post(`/me/followers/${userId}/accept`);

      // Remove the accepted user from the pending followers list
      setFollowers((currentFollowers) =>
        currentFollowers.filter(
          (user) => user.id !== userId
        )
      );

    } catch (error) {
      console.log("Error accepting follower:", error);
    } finally {
      setAcceptingId(null);
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* HEADER */}

        <View style={styles.header}>

          <Pressable
            style={styles.backButton}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.backText}>
              ←
            </Text>
          </Pressable>

          <Text style={styles.headerText}>
            Followers
          </Text>

          <View style={styles.headerSpace} />

        </View>

        {/* USERS */}

        {followers.length === 0 ? (

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No Friends Yet
            </Text>
          </View>

        ) : (

          <FlatList
            data={followers}
            keyExtractor={(item) =>
              item.id.toString()
            }
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (

              <View style={styles.userRow}>

                {/* USER BUTTON */}

                <Pressable
                  style={({ pressed }) => [
                    styles.userButton,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() =>
                    router.push(
                      `/seeUser?id=${item.id}`
                    )
                  }
                >

                  <View style={styles.userInfo}>

                    <Text style={styles.username}>
                      {item.username}
                    </Text>

                    {item.displayName && (
                      <Text style={styles.displayName}>
                        {item.displayName}
                      </Text>
                    )}

                  </View>

                  <Text style={styles.arrow}>
                    →
                  </Text>

                </Pressable>

                {/* ACCEPT BUTTON */}

                <Pressable
                  style={({ pressed }) => [
                    styles.acceptButton,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() =>
                    handleAccept(item.id)
                  }
                  disabled={acceptingId === item.id}
                >

                  {acceptingId === item.id ? (

                    <ActivityIndicator
                      size="small"
                      color="#FDF5E6"
                    />

                  ) : (

                    <Text style={styles.acceptText}>
                      Accept
                    </Text>

                  )}

                </Pressable>

              </View>

            )}
          />

        )}

      </View>
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

  container: {
    flex: 1,
    backgroundColor: "#FDF5E6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },

  backButton: {
    width: 45,
    height: 45,

    borderWidth: 2,
    borderColor: "#63272e",

    borderRadius: 15,

    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#63272e",
  },

  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#63272e",
  },

  headerSpace: {
    width: 45,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 12,

    gap: 10,
  },

  userButton: {
    flex: 1,
    minHeight: 70,

    backgroundColor: "#63272e",

    borderRadius: 18,

    paddingHorizontal: 20,
    paddingVertical: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  userInfo: {
    flex: 1,
  },

  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FDF5E6",
  },

  displayName: {
    fontSize: 14,
    color: "#FDF5E6",
    marginTop: 3,
  },

  arrow: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#FDF5E6",
    marginLeft: 10,
  },

  acceptButton: {
    minHeight: 50,

    paddingHorizontal: 15,

    backgroundColor: "#63272e",

    borderRadius: 15,

    justifyContent: "center",
    alignItems: "center",
  },

  acceptText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FDF5E6",
  },

  emptyContainer: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#63272e",
  },

});
