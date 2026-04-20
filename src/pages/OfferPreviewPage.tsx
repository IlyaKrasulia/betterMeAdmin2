import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useSearch } from '@tanstack/react-router'
import { Eye, X } from 'lucide-react'
import { NodeType } from '@shared/types/dag.types'
import type { OfferNodeData } from '@shared/types/dag.types'
import type { SessionNodeOffer, OfferDto } from '@shared/types/api.types'
import { offersApi } from '@api/offers.api'
import { OfferStep } from '@features/survey-client/components/OfferStep'
import { Spinner } from '@shared/ui/Spinner'
import { RoutlyLogo } from '@shared/ui/RoutlyLogo'
import {
  SurveyPageGlobal,
  PageShell,
  TopBar,
  BrandCenter,
  ProgressTrack,
  ProgressFill,
  ContentArea,
  SurveyCard,
} from '@features/survey-client/SurveyLayout'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function decodeData(encoded: string): OfferNodeData | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded)))) as OfferNodeData
  } catch {
    return null
  }
}

function offerDtoToStepData(offer: OfferDto): OfferNodeData & { offers: SessionNodeOffer[] } {
  const sessionOffer: SessionNodeOffer = {
    id: offer.id,
    name: offer.name,
    slug: offer.slug,
    headline: offer.headline,
    body: offer.body,
    imageUrl: offer.imageUrl,
    ctaText: offer.ctaText,
    ctaUrl: offer.ctaUrl,
    calendarUrl: offer.calendarUrl,
    isPrimary: true,
  }
  return {
    type: NodeType.Offer,
    name: offer.name,
    slug: offer.slug,
    headline: offer.headline ?? '',
    body: offer.body ?? '',
    ctaText: offer.ctaText ?? 'Get Started',
    ctaUrl: offer.ctaUrl ?? undefined,
    calendarUrl: offer.calendarUrl ?? undefined,
    imageUrl: offer.imageUrl ?? undefined,
    offers: [sessionOffer],
  }
}

function nodeDataToStepData(data: OfferNodeData): OfferNodeData & { offers: SessionNodeOffer[] } {
  const sessionOffer: SessionNodeOffer = {
    id: '',
    name: data.name,
    slug: data.slug ?? '',
    headline: data.headline,
    body: data.body,
    imageUrl: data.imageUrl ?? null,
    ctaText: data.ctaText ?? null,
    ctaUrl: data.ctaUrl ?? null,
    calendarUrl: data.calendarUrl ?? null,
    isPrimary: true,
  }
  return { ...data, offers: [sessionOffer] }
}

// ─── Component ────────────────────────────────────────────────────────────────

type LoadState = 'loading' | 'ready' | 'error'

export function OfferPreviewPage() {
  const { offerId, data: encodedData } =
    useSearch({ from: '/offer-preview' }) as { offerId?: string; data?: string }

  const [loadState, setLoadState] = useState<LoadState>(encodedData ? 'ready' : 'loading')
  const [stepData, setStepData] = useState<(OfferNodeData & { offers: SessionNodeOffer[] }) | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!encodedData) return
    const decoded = decodeData(encodedData)
    if (!decoded) {
      setErrorMsg('Could not decode offer data from URL.')
      setLoadState('error')
      return
    }
    setStepData(nodeDataToStepData(decoded))
    setLoadState('ready')
  }, [encodedData])

  useEffect(() => {
    if (!offerId) return
    setLoadState('loading')
    offersApi
      .getOffer(offerId)
      .then((offer) => {
        setStepData(offerDtoToStepData(offer))
        setLoadState('ready')
      })
      .catch(() => {
        setErrorMsg('Offer not found or failed to load.')
        setLoadState('error')
      })
  }, [offerId])

  return (
    <PageShell>
      <SurveyPageGlobal />

      <PreviewBanner>
        <Eye size={13} />
        Preview Mode — this is how the offer appears to users
        <CloseBtn onClick={() => window.close()} title="Close preview">
          <X size={14} />
        </CloseBtn>
      </PreviewBanner>

      <TopBar>
        {/* empty spacer mirrors the back button width for centering */}
        <div style={{ width: 32, flexShrink: 0 }} />
        <BrandCenter>
          <RoutlyLogo size="sm" glow />
        </BrandCenter>
        <div style={{ width: 32, flexShrink: 0 }} />
      </TopBar>

      <ProgressTrack>
        <ProgressFill
          animate={{ width: '100%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ width: '0%' }}
        />
      </ProgressTrack>

      <ContentArea>
        {loadState === 'loading' && (
          <CenterBlock>
            <Spinner size={32} />
          </CenterBlock>
        )}

        {loadState === 'error' && (
          <CenterBlock>
            <BigEmoji>⚠️</BigEmoji>
            <StateTitle>Preview unavailable</StateTitle>
            <StateBody>{errorMsg}</StateBody>
          </CenterBlock>
        )}

        {loadState === 'ready' && stepData && (
          <SurveyCard
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <OfferStep
              data={stepData}
              onAccept={() => {
                const url = stepData.calendarUrl ?? stepData.ctaUrl
                if (url) window.open(url, '_blank', 'noopener,noreferrer')
              }}
            />
          </SurveyCard>
        )}
      </ContentArea>
    </PageShell>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PreviewBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  padding: 7px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.warning}40;
  position: relative;
`

const CloseBtn = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.warning};
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s;
  &:hover { opacity: 1; }
`

const CenterBlock = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 24px;
  text-align: center;
`

const BigEmoji = styled.div`
  font-size: 56px;
`

const StateTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const StateBody = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 360px;
`
