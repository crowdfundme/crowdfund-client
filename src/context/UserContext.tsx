"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserContextType {
  isWalletConnected: boolean;
  setIsWalletConnected: (connected: boolean) => void;
  donating: { [fundId: string]: boolean };
  setDonating: (fundId: string, isDonating: boolean) => void;
}

const UserContext = createContext<UserContextType>({
  isWalletConnected: false,
  setIsWalletConnected: () => {},
  donating: {},
  setDonating: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("isWalletConnected");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [donating, setDonatingState] = useState<{ [fundId: string]: boolean }>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("donating");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const handleSetIsWalletConnected = (connected: boolean) => {
    setIsWalletConnected(connected);
    sessionStorage.setItem("isWalletConnected", JSON.stringify(connected));
  };

  const setDonating = (fundId: string, isDonating: boolean) => {
    setDonatingState((prev) => {
      const newState = { ...prev, [fundId]: isDonating };
      sessionStorage.setItem("donating", JSON.stringify(newState));
      if (isDonating) {
        sessionStorage.setItem(`donating_${fundId}_timestamp`, Date.now().toString());
      } else {
        sessionStorage.removeItem(`donating_${fundId}_timestamp`);
      }
      return newState;
    });
  };

  useEffect(() => {
    const clearStuckDonations = () => {
      const now = Date.now();
      const timeoutMs = 5 * 60 * 1000; // 5 minutes

      const stuckFunds = Object.keys(donating).filter((fundId) => donating[fundId]);
      if (stuckFunds.length === 0) return;

      console.log("Checking for stuck donations:", stuckFunds);

      stuckFunds.forEach((fundId) => {
        const timestamp = sessionStorage.getItem(`donating_${fundId}_timestamp`);
        if (timestamp && now - parseInt(timestamp) > timeoutMs) {
          console.log(`Clearing stuck donation for fund ${fundId} after ${(now - parseInt(timestamp)) / 1000}s`);
          setDonating(fundId, false);
        }
      });
    };

    clearStuckDonations();
  }, []);

  return (
    <UserContext.Provider
      value={{ isWalletConnected, setIsWalletConnected: handleSetIsWalletConnected, donating, setDonating }}
    >
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