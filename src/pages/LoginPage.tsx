import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { LoginForm } from '@features/auth/components/LoginForm'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { RoutlyLogo } from '@shared/ui/RoutlyLogo'

export function LoginPage() {
  return (
    <Page>
      <TopRight>
        <ThemeSwitcher />
      </TopRight>
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <LogoWrap>
          <RoutlyLogo size="lg" />
        </LogoWrap>
        <Heading>Welcome back</Heading>
        <Subheading>Sign in to your Routly dashboard</Subheading>
        <LoginForm />
        <SignUpLine>
          Don't have an account?{' '}
          <SignUpLink to="/signup">Sign up free</SignUpLink>
        </SignUpLine>
      </Card>
    </Page>
  )
}

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.bg};
  padding: 24px;
  position: relative;
`

const TopRight = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
`

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`

const LogoWrap = styled.div`
  margin-bottom: 28px;
`

const Heading = styled.h1`
  font-size: ${({ theme }) => theme.typography.sizes.xxl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 8px;
`

const Subheading = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 32px;
`

const SignUpLine = styled.p`
  text-align: center;
  margin-top: 20px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`

const SignUpLink = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.15s;
  &:hover { opacity: 0.8; }
`