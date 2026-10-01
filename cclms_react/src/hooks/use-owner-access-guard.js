import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

export const OWNER_DEACTIVATED_MESSAGE =
  "Your account has been deactivated. Please contact the administrator.";

export function useOwnerAccessGuard() {
  const navigate = useNavigate();
  const logoutStarted = useRef(false);

  useEffect(() => {
    let mounted = true;
    let channel;
    let statusCheckInterval;

    async function revokeOwnerAccess() {
      if (logoutStarted.current) return;

      logoutStarted.current = true;
      await supabase.auth.signOut();

      if (!mounted) return;

      toast.error(OWNER_DEACTIVATED_MESSAGE);
      navigate("/login", { replace: true });
    }

    async function checkOwnerProfile(userId) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", userId)
        .maybeSingle();

      if (!mounted || error) return;

      if (!profile || profile.role !== "owner" || profile.status !== "active") {
        await revokeOwnerAccess();
      }
    }

    async function startGuard() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted || sessionError) return;

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const userId = session.user.id;
      await checkOwnerProfile(userId);

      if (!mounted || logoutStarted.current) return;

      channel = supabase
        .channel(`owner-profile-access-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            const profile = payload.new;

            if (
              payload.eventType === "DELETE" ||
              !profile ||
              profile.role !== "owner" ||
              profile.status !== "active"
            ) {
              revokeOwnerAccess();
            }
          },
        )
        .subscribe();

      statusCheckInterval = window.setInterval(
        () => checkOwnerProfile(userId),
        15000,
      );
    }

    startGuard();

    return () => {
      mounted = false;
      if (statusCheckInterval) window.clearInterval(statusCheckInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [navigate]);
}
