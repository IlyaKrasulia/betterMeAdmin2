import styled, { createGlobalStyle } from 'styled-components'
import { motion } from 'framer-motion'

export const SurveyPageGlobal = createGlobalStyle`
  body { overflow-y: auto; }
`

export const PageShell = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.bg};
  background-image: radial-gradient(
    ${({ theme }) =>
      (theme as any).mode === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.07)'}
    1px,
    transparent 1px
  );
  background-size: 28px 28px;
  display: flex;
  flex-direction: column;
`

export const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${({ theme }) => theme.colors.bg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 12px;
    height: 48px;
  }
`

export const BrandCenter = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const BrandName = styled.span`
  font-size: 17px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1;
`

export const BackBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`

export const ProgressTrack = styled.div`
  height: 3px;
  background: ${({ theme }) => theme.colors.bgElevated};
  width: 100%;
`

export const ProgressFill = styled(motion.div)`
  height: 100%;
  background: ${({ theme }) => theme.colors.accent};
  border-radius: 0 2px 2px 0;
`

export const ContentArea = styled.main`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px 80px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 20px 12px 40px;
    align-items: flex-start;
  }
`

export const SurveyCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 40px;
  width: 100%;
  max-width: 600px;
  box-shadow: ${({ theme }) => theme.shadows.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 24px 16px;
    border-radius: ${({ theme }) => theme.radii.lg};
  }
`
