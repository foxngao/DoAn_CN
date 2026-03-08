import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SESSION_EXPIRED_EVENT } from "../api/axiosClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [maTK, setMaTK] = useState(localStorage.getItem("maTK"));
  const [loaiNS, setLoaiNS] = useState(localStorage.getItem("loaiNS"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("maTK", maTK);
      localStorage.setItem("loaiNS", loaiNS);
    }
  }, [token, role, maTK, loaiNS]);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
    setMaTK(null);
    setLoaiNS(null);
    localStorage.clear();
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, setToken, role, setRole, maTK, setMaTK, loaiNS, setLoaiNS, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
