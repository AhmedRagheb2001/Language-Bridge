import { Ionicons } from "@expo/vector-icons";

type Props = {
  size?: number;
  liked?: boolean;
};

export default function LikeIcon({
  size = 22,
  liked = false,
}: Props) {
  return (
    <Ionicons
      name={liked ? "heart" : "heart-outline"}
      size={size}
      color={liked ? "#FDF5E6" : "#63272e"}
    />
  );
}