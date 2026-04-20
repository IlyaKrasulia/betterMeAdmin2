import React, { useRef } from "react";
import styled from "styled-components";
import { Link } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Button } from "@shared/ui/Button";
import { useAuthStore } from "@features/auth/store/auth.store";
import { useLogout } from "@features/auth/hooks/useAuth";
import { RoutlyLogo } from "@shared/ui/RoutlyLogo";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();

  // Scroll container ref — Layout is the scrollable element
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });

  // Each orb drifts in a different direction at a different speed
  const orb1X = useTransform(scrollY, [0, 1200], [0,   60]);
  const orb1Y = useTransform(scrollY, [0, 1200], [0, -100]);
  const orb2X = useTransform(scrollY, [0, 1200], [0,  -80]);
  const orb2Y = useTransform(scrollY, [0, 1200], [0,   70]);
  const orb3X = useTransform(scrollY, [0, 1200], [0,   40]);
  const orb3Y = useTransform(scrollY, [0, 1200], [0,  -50]);

  return (
    <Layout ref={scrollRef}>

      {/* ── Ambient glow orbs — change false → true to restore ──────── */}
      {false && <GlowLayer>
        {/* Orb 1 — centered on the Dashboard heading (~top:92px, left:40px) */}
        <GlowOrb
          style={{ x: orb1X, y: orb1Y }}
          $top="-130px" $left="-160px" $size="500px"
          $color="rgba(99,102,241,0.26)"
        />
        <GlowOrb
          style={{ x: orb2X, y: orb2Y }}
          $top="38%" $left="55%" $size="460px"
          $color="rgba(139,92,246,0.16)"
        />
        <GlowOrb
          style={{ x: orb3X, y: orb3Y }}
          $top="70%" $left="-80px" $size="360px"
          $color="rgba(59,130,246,0.13)"
        />
      </GlowLayer>}

      <Navbar>
        <Logo to="/dashboard">
          <RoutlyLogo size="md" glow />
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const Layout = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.bg};
  background-image: radial-gradient(
    ${({ theme }) =>
      theme.mode === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.07)'}
    1px,
    transparent 1px
  );
  background-size: 28px 28px;
  background-attachment: local;
  position: relative;
`;

/* ── Glow orbs ────────────────────────────────────────────────────────────── */

const GlowLayer = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;


const GlowOrb = styled(motion.div)<{
  $top: string
  $left: string
  $size: string
  $color: string
}>`
  position: absolute;
  top:    ${({ $top })  => $top};
  left:   ${({ $left }) => $left};
  width:  ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border-radius: 50%;
  background: radial-gradient(circle, ${({ $color }) => $color}, transparent 68%);
  filter: blur(80px);
  opacity: ${({ theme }) => theme.mode === 'dark' ? 0.85 : 0.12};
  will-change: transform;
`;

/* ── Chrome ───────────────────────────────────────────────────────────────── */

const Navbar = styled.header`
  height: 60px;
  background: ${({ theme }) => theme.colors.bgSurface}e8;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
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
  position: relative;
  z-index: 1;
`;
