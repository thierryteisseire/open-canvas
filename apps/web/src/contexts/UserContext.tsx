import { getCurrentUser } from "@/lib/api/token";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
}

type UserContentType = {
  getUser: () => Promise<User | undefined>;
  user: User | undefined;
  loading: boolean;
};

const UserContext = createContext<UserContentType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user || typeof window === "undefined") return;

    getUser();
  }, []);

  async function getUser() {
    if (user) {
      setLoading(false);
      return user;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser || undefined);
      setLoading(false);
      return currentUser || undefined;
    } catch (error) {
      console.error('Failed to get user:', error);
      setUser(undefined);
      setLoading(false);
      return undefined;
    }
  }

  const contextValue: UserContentType = {
    getUser,
    user,
    loading,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
