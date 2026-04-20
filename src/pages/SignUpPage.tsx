import { useState, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Check, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { RoutlyLogo } from '@shared/ui/RoutlyLogo'
import { useSignup } from '@features/auth/hooks/useAuth'
import { C, FONT } from '@features/landing/constants'

// ─── Password strength ────────────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3 | 4

function getStrength(password: string): StrengthLevel {
  if (!password) return 0
  const hasDigit = /\d/.test(password)
  const len = password.length
  if (len < 8) return 1
  if (!hasDigit) return 2
  if (len < 12) return 3
  return 4
}

const STRENGTH_META: Record<
  StrengthLevel,
  { label: string; color: string; segments: number }
> = {
  0: { label: '',       color: 'transparent',  segments: 0 },
  1: { label: 'Weak',   color: '#EF4444',       segments: 1 },
  2: { label: 'Fair',   color: '#F59E0B',       segments: 2 },
  3: { label: 'Good',   color: '#6366F1',       segments: 3 },
  4: { label: 'Strong', color: '#22C55E',       segments: 4 },
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEmail(email: string): string | null {
  if (!email) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email'
  return null
}

function validatePassword(pw: string): string | null {
  if (!pw) return 'Password is required'
  if (pw.length < 8) return 'Password must be at least 8 characters'
  if (!/\d/.test(pw)) return 'Password must contain at least one digit'
  return null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SignUpPage() {
  const { mutate: signup, isPending } = useSignup()

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [touched, setTouched]       = useState({ email: false, password: false, confirm: false })

  const emailErr    = touched.email    ? validateEmail(email)       : null
  const passwordErr = touched.password ? validatePassword(password) : null
  const confirmErr  = touched.confirm
    ? (!confirm ? 'Please confirm your password' : confirm !== password ? 'Passwords do not match' : null)
    : null

  const strength = getStrength(password)
  const meta     = STRENGTH_META[strength]

  const canSubmit =
    !validateEmail(email) &&
    !validatePassword(password) &&
    confirm === password &&
    confirm !== ''

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setTouched({ email: true, password: true, confirm: true })
      if (!canSubmit) return
      signup({ email, password })
    },
    [canSubmit, email, password, signup],
  )

  return (
    <Page>
      {/* ── Ambient orbs ───────────────────────────────────────────── */}
      <Orb1 />
      <Orb2 />
      <Orb3 />

      {/* ── Card ───────────────────────────────────────────────────── */}
      <Card
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 28 }}
        >
          <RoutlyLogo size="lg" textColor={C.textPrimary} glow />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Heading>Create your account</Heading>
          <Subheading>Start building smarter qualification flows today</Subheading>
        </motion.div>

        {/* Form */}
        <Form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FieldLabel>Email</FieldLabel>
            <InputWrap $error={!!emailErr} $focused={false}>
              <InputIcon><Mail size={15} /></InputIcon>
              <FieldInput
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
              />
            </InputWrap>
            <AnimatePresence>
              {emailErr && (
                <FieldError
                  key="email-err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={11} /> {emailErr}
                </FieldError>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <FieldLabel>Password</FieldLabel>
            <InputWrap $error={!!passwordErr} $focused={false}>
              <InputIcon><Lock size={15} /></InputIcon>
              <FieldInput
                type={showPw ? 'text' : 'password'}
                placeholder="Min 8 chars, includes a digit"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
              />
              <EyeBtn type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </EyeBtn>
            </InputWrap>

            {/* Strength meter */}
            <AnimatePresence>
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <StrengthRow>
                    <StrengthBar>
                      {[1, 2, 3, 4].map(i => (
                        <StrengthSeg
                          key={i}
                          $active={i <= meta.segments}
                          $color={meta.color}
                        />
                      ))}
                    </StrengthBar>
                    <StrengthLabel $color={meta.color}>{meta.label}</StrengthLabel>
                  </StrengthRow>

                  {/* Rules checklist */}
                  <RulesList>
                    <RuleItem $ok={password.length >= 8}>
                      {password.length >= 8 ? <Check size={11} /> : <X size={11} />}
                      At least 8 characters
                    </RuleItem>
                    <RuleItem $ok={/\d/.test(password)}>
                      {/\d/.test(password) ? <Check size={11} /> : <X size={11} />}
                      Contains a number
                    </RuleItem>
                  </RulesList>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {passwordErr && !password.length && (
                <FieldError
                  key="pw-err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={11} /> {passwordErr}
                </FieldError>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Confirm password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FieldLabel>Confirm password</FieldLabel>
            <InputWrap $error={!!confirmErr} $focused={false}>
              <InputIcon><Lock size={15} /></InputIcon>
              <FieldInput
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
              />
              <EyeBtn type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </EyeBtn>
              {/* Inline match indicator */}
              <AnimatePresence>
                {confirm.length > 0 && (
                  <MatchBadge
                    key="match"
                    $ok={confirm === password}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {confirm === password ? <Check size={12} /> : <X size={12} />}
                  </MatchBadge>
                )}
              </AnimatePresence>
            </InputWrap>
            <AnimatePresence>
              {confirmErr && (
                <FieldError
                  key="confirm-err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={11} /> {confirmErr}
                </FieldError>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <SubmitBtn
              type="submit"
              disabled={isPending}
              $ready={canSubmit}
              whileHover={canSubmit && !isPending ? { scale: 1.01 } : {}}
              whileTap={canSubmit && !isPending ? { scale: 0.98 } : {}}
            >
              {isPending ? (
                <SpinnerRing />
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </SubmitBtn>
          </motion.div>
        </Form>

        {/* Footer link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <FooterLine>
            Already have an account?{' '}
            <FooterLink to="/login">Sign in</FooterLink>
          </FooterLine>
        </motion.div>
      </Card>
    </Page>
  )
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

const spin = keyframes`
  to { transform: rotate(360deg); }
`

// ─── Page shell ───────────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  background: ${C.bg};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  font-family: ${FONT};
  position: relative;
  overflow: hidden;

  /* Dot grid */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px);
    background-size: 30px 30px;
    pointer-events: none;
  }
`

// ─── Orbs ─────────────────────────────────────────────────────────────────────

const Orb1 = styled.div`
  position: absolute;
  width: 520px; height: 520px;
  top: -180px; left: -160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.38), transparent 68%);
  filter: blur(90px);
  opacity: 0.6;
  pointer-events: none;
  animation: lp-float1 14s ease-in-out infinite;
`

const Orb2 = styled.div`
  position: absolute;
  width: 400px; height: 400px;
  top: 10%; right: -120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.28), transparent 68%);
  filter: blur(90px);
  opacity: 0.5;
  pointer-events: none;
  animation: lp-float2 18s ease-in-out infinite;
`

const Orb3 = styled.div`
  position: absolute;
  width: 300px; height: 300px;
  bottom: -80px; left: 40%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.22), transparent 68%);
  filter: blur(80px);
  opacity: 0.45;
  pointer-events: none;
  animation: lp-float3 10s ease-in-out infinite;
`

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card = styled(motion.div)`
  position: relative;
  z-index: 1;
  background: rgba(17, 17, 21, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 40px 36px 32px;
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 0 0 1px rgba(99, 102, 241, 0.06),
    0 24px 64px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
`

// ─── Typography ───────────────────────────────────────────────────────────────

const Heading = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${C.textPrimary};
  margin: 0 0 6px;
  letter-spacing: -0.4px;
`

const Subheading = styled.p`
  font-size: 13.5px;
  color: ${C.textSecondary};
  margin: 0 0 28px;
  line-height: 1.5;
`

// ─── Form ─────────────────────────────────────────────────────────────────────

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
`

const FieldLabel = styled.label`
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: ${C.textSecondary};
  margin-bottom: 7px;
  letter-spacing: 0.1px;
`

const InputWrap = styled.div<{ $error: boolean; $focused: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${({ $error }) => ($error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.09)')};
  border-radius: 10px;
  transition: border-color 0.18s, box-shadow 0.18s;

  &:focus-within {
    border-color: ${({ $error }) => ($error ? 'rgba(239,68,68,0.7)' : 'rgba(99,102,241,0.55)')};
    box-shadow: 0 0 0 3px ${({ $error }) =>
      $error ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.13)'};
  }
`

const InputIcon = styled.div`
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: ${C.textMuted};
  flex-shrink: 0;
  pointer-events: none;
`

const FieldInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: ${FONT};
  font-size: 14px;
  color: ${C.textPrimary};
  padding: 12px 0 12px;
  min-width: 0;

  &::placeholder {
    color: ${C.textMuted};
  }

  /* Hide browser password toggle — we roll our own */
  &::-ms-reveal,
  &::-ms-clear { display: none; }
  &::-webkit-credentials-auto-fill-button { visibility: hidden; }
`

const EyeBtn = styled.button`
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  color: ${C.textMuted};
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  transition: color 0.15s;
  flex-shrink: 0;

  &:hover { color: ${C.textSecondary}; }
`

const MatchBadge = styled(motion.div)<{ $ok: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ $ok }) => ($ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)')};
  color: ${({ $ok }) => ($ok ? '#22C55E' : '#EF4444')};
  margin-right: 10px;
  flex-shrink: 0;
`

const FieldError = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 12px;
  color: #EF4444;
`

// ─── Strength meter ───────────────────────────────────────────────────────────

const StrengthRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 9px;
`

const StrengthBar = styled.div`
  flex: 1;
  display: flex;
  gap: 4px;
`

const StrengthSeg = styled.div<{ $active: boolean; $color: string }>`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: ${({ $active, $color }) => ($active ? $color : 'rgba(255,255,255,0.08)')};
  transition: background 0.25s ease;
`

const StrengthLabel = styled.span<{ $color: string }>`
  font-size: 11.5px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  min-width: 40px;
  text-align: right;
  transition: color 0.25s;
`

const RulesList = styled.div`
  display: flex;
  gap: 14px;
  margin-top: 8px;
`

const RuleItem = styled.div<{ $ok: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: ${({ $ok }) => ($ok ? '#22C55E' : C.textMuted)};
  transition: color 0.2s;
`

// ─── Submit button ────────────────────────────────────────────────────────────

const SubmitBtn = styled(motion.button)<{ $ready: boolean }>`
  width: 100%;
  margin-top: 4px;
  padding: 13px;
  border-radius: 11px;
  border: 1px solid ${({ $ready }) => ($ready ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)')};
  background: ${({ $ready }) => ($ready ? C.accent : 'rgba(99,102,241,0.25)')};
  color: #fff;
  font-family: ${FONT};
  font-size: 14.5px;
  font-weight: 700;
  cursor: ${({ $ready }) => ($ready ? 'pointer' : 'default')};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: 0.1px;
  box-shadow: ${({ $ready }) => ($ready ? '0 0 28px rgba(99,102,241,0.35)' : 'none')};
  transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;

  &:hover {
    background: ${({ $ready }) => ($ready ? C.accentHover : 'rgba(99,102,241,0.25)')};
  }
  &:disabled { cursor: default; }
`

const SpinnerRing = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`

// ─── Footer ───────────────────────────────────────────────────────────────────

const FooterLine = styled.p`
  text-align: center;
  font-size: 13px;
  color: ${C.textMuted};
  margin: 0;
`

const FooterLink = styled(Link)`
  color: ${C.accentText};
  text-decoration: none;
  font-weight: 600;
  transition: color 0.15s;
  &:hover { color: ${C.textPrimary}; }
`
