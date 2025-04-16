"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserContextType {
  isWalletConnected: boolean;
  setIsWalletConnected: (connected: boolean) => void;
  donating: { [fundId: string]: boolean };
  setDonating: (fundId: string, isDonating: boolean) => void;
  launchCooldowns: { [fundId: string]: number }; // Cooldown in seconds per fund
  setLaunchCooldown: (fundId: string, seconds: number) => void; // Set cooldown
}

const UserContext = createContext<UserContextType>({
  isWalletConnected: false,
  setIsWalletConnected: () => {},
  donating: {},
  setDonating: () => {},
  launchCooldowns: {},
  setLaunchCooldown: () => {},
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

  const [launchCooldowns, setLaunchCooldownsState] = useState<{ [fundId: string]: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("launchCooldowns");
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

  const setLaunchCooldown = (fundId: string, seconds: number) => {
    setLaunchCooldownsState((prev) => {
      const newState = { ...prev, [fundId]: seconds };
      sessionStorage.setItem("launchCooldowns", JSON.stringify(newState));
      if (seconds > 0) {
        sessionStorage.setItem(`launchCooldown_${fundId}_timestamp`, Date.now().toString());
      } else {
        sessionStorage.removeItem(`launchCooldown_${fundId}_timestamp`);
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

    const updateCooldowns = () => {
      const now = Date.now();
      const cooldownDurationMs = 5 * 60 * 1000; // 5 minutes in milliseconds

      setLaunchCooldownsState((prev) => {
        const updatedCooldowns = { ...prev };
        let hasChanges = false;

        Object.keys(updatedCooldowns).forEach((fundId) => {
          const timestamp = sessionStorage.getItem(`launchCooldown_${fundId}_timestamp`);
          if (timestamp) {
            const elapsedMs = now - parseInt(timestamp);
            const remainingMs = cooldownDurationMs - elapsedMs;
            const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

            if (remainingSeconds !== updatedCooldowns[fundId]) {
              updatedCooldowns[fundId] = remainingSeconds;
              hasChanges = true;
            }

            if (remainingSeconds === 0) {
              delete updatedCooldowns[fundId];
              sessionStorage.removeItem(`launchCooldown_${fundId}_timestamp`);
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          sessionStorage.setItem("launchCooldowns", JSON.stringify(updatedCooldowns));
        }
        return hasChanges ? updatedCooldowns : prev;
      });
    };

    clearStuckDonations();
    updateCooldowns();

    const interval = setInterval(updateCooldowns, 1000); // Update every second
    return () => clearInterval(interval); // Cleanup on unmount
  }, [donating]);

  return (
    <UserContext.Provider
      value={{
        isWalletConnected,
        setIsWalletConnected: handleSetIsWalletConnected,
        donating,
        setDonating,
        launchCooldowns,
        setLaunchCooldown,
      }}
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