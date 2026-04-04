import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authApi } from "@api/auth.api";
import { useAuthStore } from "../store/auth.store";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import type { LoginRequest, MeResponse } from "@shared/types/auth.types";

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const apiUser = await authApi.me();
        setUser(apiUser);
        return apiUser;
      } catch {
        // If we already have a stored user (e.g. from mock/demo login), keep it
        if (user) return user;
        throw new Error("Unauthenticated");
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      try {
        await authApi.login(data);
        const user = await authApi.me();
        return user;
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { status?: number };
          code?: string;
        };
        throw err;
      }
    },
    onSuccess: (user) => {
      setUser(user);
      toast.success(`Welcome back, ${user.userName}!`);
      navigate({ to: "/dashboard" });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const status = error.response?.status;
      if (status === 401) {
        toast.error("Invalid email or password.");
      } else if (status === 423) {
        toast.error("Account is temporarily locked. Try again in 5 minutes.");
      } else {
        toast.error("Login failed. Please try again.");
      }
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // Ignore errors — always clear locally
      }
    },
    onSettled: () => {
      clearAuth();
      navigate({ to: "/login" });
    },
  });
}
