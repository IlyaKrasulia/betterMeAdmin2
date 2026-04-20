import styled from 'styled-components'
import { CalendarDays, ExternalLink } from 'lucide-react'
import type { OfferNodeData } from '@shared/types/dag.types'
import type { SessionNodeOffer } from '@shared/types/api.types'
import { Button } from '@shared/ui/Button'

interface OfferStepProps {
  data: OfferNodeData & { offers?: SessionNodeOffer[] }
  onAccept: () => void
}

export function OfferStep({ data, onAccept }: OfferStepProps) {
  const primary = data.offers?.find((o) => o.isPrimary) ?? data.offers?.[0]
  const imageUrl = primary?.imageUrl ?? data.imageUrl
  const body = primary?.body ?? data.body
  const hasCalendar = !!(primary?.calendarUrl ?? data.calendarUrl)

  return (
    <Wrapper $hasImage={!!imageUrl}>
      {imageUrl && (
        <ImageWrap>
          <OfferImage src={imageUrl} alt={data.headline} />
        </ImageWrap>
      )}

      <TextBlock>
        <Headline>{data.headline}</Headline>
        {body && <Description>{body}</Description>}
      </TextBlock>

      {hasCalendar && (
        <CalendarRow>
          <CalendarDays size={15} />
          Choose a time that works for you
        </CalendarRow>
      )}

      <Button
        fullWidth
        size="lg"
        icon={hasCalendar ? <CalendarDays size={16} /> : <ExternalLink size={16} />}
        onClick={onAccept}
      >
        {data.ctaText || (hasCalendar ? 'Book a call' : 'Get started')}
      </Button>
    </Wrapper>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div<{ $hasImage: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: ${({ $hasImage }) => $hasImage ? '0' : '16px 0'};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 24px;
    padding: 0;
  }
`

const ImageWrap = styled.div`
  width: 100%;
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bgElevated};
`

const OfferImage = styled.img`
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  display: block;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-height: 180px;
  }
`

const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: center;
  padding: 8px 0;
`

const Headline = styled.h2`
  font-size: 2rem;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.2;
  letter-spacing: -0.02em;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.5rem;
  }
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
  max-width: 400px;
  margin: 0 auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.sm};
  }
`

const CalendarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.accent};
  }
`
