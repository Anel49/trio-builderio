import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export function useBlockStatus(otherUserId: number | null | undefined) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!otherUserId) {
      setIsBlocked(false);
      return;
    }

    let cancelled = false;

    const checkBlockStatus = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch(
          `blocks/check?otherUserId=${otherUserId}`,
        );
        const data = await response.json();

        if (!cancelled && data.ok) {
          setIsBlocked(data.isBlocked ?? false);
        }
      } catch (error) {
        console.error("[useBlockStatus] Error checking block status:", error);
        if (!cancelled) {
          setIsBlocked(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkBlockStatus();

    return () => {
      cancelled = true;
    };
  }, [otherUserId]);

  return { isBlocked, isLoading };
}
