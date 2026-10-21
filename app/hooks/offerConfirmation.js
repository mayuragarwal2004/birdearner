import { useCallback, useEffect, useMemo, useState } from "react";
import apiService from "../lib/apiService";

// Works out the latest offer and each party's confirmation of it from the negotiation history.
// Same rule as the server: a confirmation counts only if it was made after the latest offer.
export const deriveOfferConfirmation = (history) => {
  let latestIndex = -1;
  history.forEach((entry, index) => {
    if (entry.offerType === "OFFER") latestIndex = index;
  });
  if (latestIndex < 0) {
    return { latest: null, clientConfirmed: false, freelancerConfirmed: false, ready: false };
  }

  const latest = history[latestIndex];
  const confirmations = history
    .slice(latestIndex + 1)
    .filter((entry) => entry.offerType === "CONFIRM");
  const clientConfirmed = confirmations.some((entry) => entry.senderType === "CLIENT");
  const freelancerConfirmed = confirmations.some((entry) => entry.senderType === "FREELANCER");

  // The party that made the latest offer does not confirm it; the other party's acceptance agrees the offer
  const recipientConfirmed = latest.senderType === "CLIENT" ? freelancerConfirmed : clientConfirmed;

  return {
    latest,
    clientConfirmed,
    freelancerConfirmed,
    ready: recipientConfirmed,
  };
};

// Loads the negotiation history of a chat and keeps it fresh
// Refreshes every 2 seconds, so a change made by the other party shows up within about 2 seconds
export const useOfferConfirmation = (threadId, intervalMs = 2000) => {
  const [history, setHistory] = useState([]);

  const refresh = useCallback(async () => {
    if (!threadId) return;
    try {
      setHistory(await apiService.getNegotiationHistory(threadId));
    } catch (error) {
      console.warn("Could not load negotiation history:", error?.message);
    }
  }, [threadId]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [refresh, intervalMs]);

  const state = useMemo(() => deriveOfferConfirmation(history), [history]);
  return { ...state, refresh };
};
