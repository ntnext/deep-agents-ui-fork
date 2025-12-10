"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import styles from "./UserMenu.module.scss";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user?.email) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <div className={styles.userMenu}>
      <span className={styles.email}>{session.user.email}</span>
      <button
        onClick={handleLogout}
        className={styles.logoutButton}
        title="Logout"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
