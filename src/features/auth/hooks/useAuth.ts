import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authApi } from "@api/auth.api";
import { useAuthStore } from "../store/auth.store";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import type { LoginRequest, MeResponse, SignupRequest } from "@shared/types/auth.types";

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMe() {
  const setUser   = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const apiUser = await authApi.me();
        setUser(apiUser);
        return apiUser;
      } catch {
        // Cookie expired or never existed — wipe any stale persisted state
        clearAuth();
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

export function useSignup() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: SignupRequest) => {
      await authApi.signup(data);
      const user = await authApi.me();
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      toast.success(`Welcome to Routly, ${user.userName}!`);
      navigate({ to: "/dashboard" });
    },
    onError: (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
      const status = error.response?.status;
      const data = error.response?.data;
      if (status === 400) {
        const msgs = data?.errors ? Object.values(data.errors).flat() : null;
        const first = msgs?.[0] ?? data?.message;
        if (first) {
          toast.error(first);
        } else {
          toast.error("This email is already in use or the password is too weak.");
        }
      } else {
        toast.error("Sign up failed. Please try again.");
      }
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      queryClient.clear(); // wipe every cached query so stale data never leaks between sessions
      navigate({ to: "/" });
    },
  });
}
