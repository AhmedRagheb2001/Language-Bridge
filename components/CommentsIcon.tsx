import { Ionicons } from "@expo/vector-icons";

type Props = {
  size?: number;
  color?: string;
};

export default function CommentsIcon({
  size = 22,
  color = "#63272e",
}: Props) {
  return (
    <Ionicons
      name="chatbubble-outline"
      size={size}
      color={color}
    />
  );
}