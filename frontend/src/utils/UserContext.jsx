import { createContext, useContext, useState, useEffect } from "react";
import { 
  isAuthenticated, 
  getUserProfile, 
  fetchProfile,
  removeToken,
  setUserProfile 
} from "./authService";

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if user is authenticated
        if (isAuthenticated()) {
          // Try to get user from localStorage first
          let userProfile = getUserProfile();
          
          // If not in localStorage, fetch from API
          if (!userProfile) {
            userProfile = await fetchProfile();
            setUserProfile(userProfile);
          }
          
          setUser(userProfile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        // If there's an error (e.g., token expired), clear auth
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const refreshUser = async () => {
    try {
      if (isAuthenticated()) {
        const userProfile = await fetchProfile();
        setUserProfile(userProfile);
        setUser(userProfile);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      removeToken();
      setUser(null);
    }
  };

  const clearUser = () => {
    removeToken();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};
