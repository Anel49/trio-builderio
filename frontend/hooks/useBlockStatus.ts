import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export function useBlockStatus(otherUserId: number | null | undefined) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkBlockStatus = useCallback(async () => {
    if (!otherUserId) {
      setIsBlocked(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch(
        `blocks/check?otherUserId=${otherUserId}`,
      );
      const data = await response.json();

      if (data.ok) {
        setIsBlocked(data.isBlocked ?? false);
      }
    } catch (error) {
      console.error("[useBlockStatus] Error checking block status:", error);
      setIsBlocked(false);
    } finally {
      setIsLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => {
    if (!otherUserId) {
      setIsBlocked(false);
      return;
    }

    checkBlockStatus();
  }, [otherUserId, checkBlockStatus]);

  return { isBlocked, isLoading, refetch: checkBlockStatus };
}
