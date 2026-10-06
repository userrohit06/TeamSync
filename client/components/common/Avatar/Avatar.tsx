import styles from "./Avatar.module.css";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "small" | "medium" | "large" | "xlarge";
  className?: string;
}

const Avatar = ({ src, name, size = "medium", className }: AvatarProps) => {
  const getInitials = () => {
    if (!name?.trim()) return "U";

    return name
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className={`${styles.avatar} ${styles[size]} ${className}`}>
      {src ? (
        <img src={src} alt={name || "User"} />
      ) : (
        <span>{getInitials()}</span>
      )}
    </div>
  );
};

export default Avatar;
