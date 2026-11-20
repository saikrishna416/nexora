import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import api from "../services/api";

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("access_token")
  );
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  useEffect(() => {
    if (!accessToken) return undefined;

    let active = true;
    api
      .get("/accounts/me/")
      .then((response) => {
        if (active) setUser(response.data);
      })
      .catch((error) => {
        console.error("Could not load authenticated user:", error.response?.data || error);
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setUserLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const login = (token, userData = null) => {
    localStorage.setItem("access_token", token);
    setAccessToken(token);
    setUser(userData);
    setUserLoading(!userData);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAccessToken(null);
    setUser(null);
    setUserLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated: Boolean(accessToken),
        user,
        userLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}