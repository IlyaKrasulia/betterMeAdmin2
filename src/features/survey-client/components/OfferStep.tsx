import styled from 'styled-components'
import { motion } from 'framer-motion'
import { DollarSign, Zap, Clock, Package, Monitor } from 'lucide-react'
import type { OfferNodeData } from '@shared/types/dag.types'
import type { SessionNodeOffer } from '@shared/types/api.types'
import { Button } from '@shared/ui/Button'

// ─── Component ────────────────────────────────────────────────────────────────

interface OfferStepProps {
  data: OfferNodeData & { offers?: SessionNodeOffer[] }
  onAccept: () => void
}

export function OfferStep({ data, onAccept }: OfferStepProps) {
  const primary = data.offers?.find((o) => o.isPrimary) ?? data.offers?.[0]

  return (
    <Wrapper>
      <BadgeRow
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
      >
        <SpecialBadge>
          <Zap size={10} />
          Your personalised plan
        </SpecialBadge>
      </BadgeRow>

      {primary?.imageUrl && (
        <OfferImageWrapper
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
        >
          <OfferImage src={primary.imageUrl} alt={primary.name} />
        </OfferImageWrapper>
      )}

      <Headline
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        {data.headline}
      </Headline>

      <Description
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        {data.description}
      </Description>

      {(primary?.duration || primary?.digitalContent || data.kitName || data.kitContents) && (
        <DetailsCard
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          {primary?.duration && (
            <DetailRow>
              <Clock size={16} />
              <DetailLabel>Duration</DetailLabel>
              <DetailValue>{primary.duration}</DetailValue>
            </DetailRow>
          )}
          {primary?.digitalContent && (
            <DetailRow>
              <Monitor size={16} />
              <DetailLabel>Digital Content</DetailLabel>
              <DetailValue>{primary.digitalContent}</DetailValue>
            </DetailRow>
          )}
          {data.kitName && (
            <DetailRow>
              <Package size={16} />
              <DetailLabel>Wellness Kit</DetailLabel>
              <DetailValue>{data.kitName}</DetailValue>
            </DetailRow>
          )}
          {data.kitContents && (
            <DetailRow>
              <KitItemsList>{data.kitContents}</KitItemsList>
            </DetailRow>
          )}
        </DetailsCard>
      )}

      {data.price != null && (
        <PriceTag
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.26, type: 'spring', stiffness: 200 }}
        >
          <PriceCurrency>$</PriceCurrency>
          {data.price.toFixed(2)}
        </PriceTag>
      )}

      <CtaWrapper
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <Button
          fullWidth
          size="lg"
          icon={data.price != null ? <DollarSign size={18} /> : undefined}
          onClick={onAccept}
        >
          {data.ctaText}
        </Button>
      </CtaWrapper>
    </Wrapper>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 18px;
  }
`

const BadgeRow = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 8px;
`

const SpecialBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const OfferImageWrapper = styled(motion.div)`
  width: 100%;
  display: flex;
  justify-content: center;
`

const OfferImage = styled.img`
  max-width: 100%;
  max-height: 240px;
  border-radius: ${({ theme }) => theme.radii.md};
  object-fit: contain;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-height: 160px;
  }
`

const Headline = styled(motion.h2)`
  font-size: ${({ theme }) => theme.typography.sizes.xxl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.xl};
  }
`

const Description = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
  max-width: 480px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.sm};
  }
`

const DetailsCard = styled(motion.div)`
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSurface};
  text-align: left;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 12px 14px;
    gap: 10px;
  }
`

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    flex-shrink: 0;
  }
`

const DetailLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DetailValue = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-left: auto;
`

const KitItemsList = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
  padding-left: 26px;
`

const PriceTag = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: ${({ theme }) => theme.typography.sizes.xxxl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.xxl};
  }
`

const PriceCurrency = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 6px;
`

const CtaWrapper = styled(motion.div)`
  width: 100%;
`
