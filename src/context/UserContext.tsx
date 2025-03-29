"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserContextType {
  isWalletConnected: boolean;
  setIsWalletConnected: (connected: boolean) => void;
}

const UserContext = createContext<UserContextType>({
  isWalletConnected: false,
  setIsWalletConnected: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isWalletConnected");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const handleSetIsWalletConnected = (connected: boolean) => {
    setIsWalletConnected(connected);
    sessionStorage.setItem("isWalletConnected", JSON.stringify(connected));
  };

  return (
    <UserContext.Provider value={{ isWalletConnected, setIsWalletConnected }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};