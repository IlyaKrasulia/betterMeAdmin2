import React from "react";
import styled from "styled-components";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, LogOut, User } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Button } from "@shared/ui/Button";
import { useAuthStore } from "@features/auth/store/auth.store";
import { useLogout } from "@features/auth/hooks/useAuth";
import logoLight from "@assets/images/logo-white.svg";
import logoDark from "@assets/images/logo-black.svg";
import { useAppTheme } from "@/shared/theme/ThemeProvider";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { mode } = useAppTheme();

  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();

  return (
    <Layout>
      <Navbar>
        <Logo to="/dashboard">
          <img src={mode === "dark" ? logoLight : logoDark} alt="Logo" />
        </Logo>

        <Spacer />

        <RightSection>
          <ThemeSwitcher />
          {user && (
            <UserChip>
              <User size={13} />
              {user.userName}
            </UserChip>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<LogOut size={14} />}
            loading={isPending}
            onClick={() => logout()}
          >
            Sign out
          </Button>
        </RightSection>
      </Navbar>

      <Main>{children}</Main>
    </Layout>
  );
}

const Layout = styled.div`
  overflow: scroll;
  background: ${({ theme }) => theme.colors.bg};
`;

const Navbar = styled.header`
  height: 60px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
`;

const Spacer = styled.div`
  flex: 1;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserChip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;
