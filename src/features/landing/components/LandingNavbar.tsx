import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { C, FONT } from '../constants'
import { RoutlyLogo } from '@shared/ui/RoutlyLogo'

const Nav = styled.nav<{ scrolled: boolean }>`
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  height: 64px;
  display: flex;
  align-items: center;
  transition: background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease;
  background: ${({ scrolled }) => scrolled ? 'rgba(9,9,11,0.92)' : 'transparent'};
  backdrop-filter: ${({ scrolled }) => scrolled ? 'blur(20px)' : 'none'};
  border-bottom: 1px solid ${({ scrolled }) => scrolled ? C.border : 'transparent'};
  animation: lp-slideDown 0.6s ease forwards;
`

const LogoLink = styled.a`
  display: flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  z-index: 101;
`


const NavInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`


const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  @media (max-width: 768px) { display: none; }
`

const NavLink = styled.a`
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 500;
  color: ${C.textSecondary};
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
  &:hover { color: ${C.textPrimary}; }
`

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const LoginBtn = styled.a`
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 500;
  color: ${C.textSecondary};
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
  &:hover { color: ${C.textPrimary}; }
  @media (max-width: 768px) { display: none; }
`

const CTABtn = styled(motion.a)`
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  cursor: pointer;
  padding: 9px 20px;
  border-radius: 8px;
  background: ${C.accent};
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 0 20px ${C.accentGlow};
  transition: background 0.2s ease;
  white-space: nowrap;
  &:hover { background: ${C.accentHover}; }
  @media (max-width: 480px) {
    padding: 8px 14px;
    font-size: 13px;
  }
`

const MobileMenuBtn = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: ${C.textSecondary};
  cursor: pointer;
  padding: 4px;
  z-index: 101;
  @media (max-width: 768px) { display: flex; align-items: center; }
`

const MobileMenu = styled(motion.div)`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 64px; left: 0; right: 0;
    background: rgba(9,9,11,0.97);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid ${C.border};
    padding: 20px 24px 28px;
    gap: 4px;
    z-index: 99;
  }
`

const MobileLink = styled.a`
  font-family: ${FONT};
  font-size: 16px;
  font-weight: 500;
  color: ${C.textSecondary};
  text-decoration: none;
  cursor: pointer;
  padding: 12px 0;
  border-bottom: 1px solid ${C.border};
  transition: color 0.2s;
  &:last-child { border-bottom: none; }
  &:hover { color: ${C.textPrimary}; }
`

const MobileCTA = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  padding: 13px;
  border-radius: 10px;
  background: ${C.accent};
  color: #fff;
  font-family: ${FONT};
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 0 24px ${C.accentGlow};
`

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150)
  }

  return (
    <>
      <Nav scrolled={scrolled || mobileOpen}>
        <NavInner>
          <LogoLink href="/landing">
            <RoutlyLogo size="md" textColor={C.textPrimary} glow />
          </LogoLink>

          <NavLinks>
            <NavLink onClick={() => scrollTo('how-it-works')}>How it works</NavLink>
            <NavLink onClick={() => scrollTo('features')}>Features</NavLink>
            <NavLink onClick={() => scrollTo('pricing')}>Pricing</NavLink>
          </NavLinks>

          <NavActions>
            <LoginBtn href="/login">Log in</LoginBtn>
            <CTABtn href="/signup" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Get started free →
            </CTABtn>
            <MobileMenuBtn onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </MobileMenuBtn>
          </NavActions>
        </NavInner>
      </Nav>

      {mobileOpen && (
        <MobileMenu
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <MobileLink onClick={() => scrollTo('how-it-works')}>How it works</MobileLink>
          <MobileLink onClick={() => scrollTo('features')}>Features</MobileLink>
          <MobileLink onClick={() => scrollTo('pricing')}>Pricing</MobileLink>
          <MobileLink href="/login">Log in</MobileLink>
          <MobileCTA href="/signup">Get started free →</MobileCTA>
        </MobileMenu>
      )}
    </>
  )
}
