
// app/following.tsx

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

export default function Following() {
  const router = useRouter();

  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const response = await api.get("/me/following");

        setFollowing(response.data ?? []);
      } catch (error) {
        console.log("Error fetching following:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, []);

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
            Following
          </Text>

          <View style={styles.headerSpace} />

        </View>


        {/* USERS */}

        {following.length === 0 ? (

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No Friends Yet
            </Text>
          </View>

        ) : (

          <FlatList
            data={following}
            keyExtractor={(item) =>
              item.id.toString()
            }
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (

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

                <View>
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

  userButton: {
    minHeight: 70,

    backgroundColor: "#63272e",

    borderRadius: 18,

    paddingHorizontal: 20,
    paddingVertical: 12,

    marginBottom: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
