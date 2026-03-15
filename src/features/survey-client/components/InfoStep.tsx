import styled from "styled-components";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { InfoNodeData } from "@shared/types/dag.types";
import { Button } from "@shared/ui/Button";

// ─── Component ────────────────────────────────────────────────────────────────

interface InfoStepProps {
  data: InfoNodeData;
  onContinue: () => void;
}

export function InfoStep({ data, onContinue }: InfoStepProps) {
  return (
    <Wrapper>
      <IllustrationBox
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {data.imageUrl ? (
          <InfoImage src={data.imageUrl} alt={data.title} />
        ) : (
          "🌟"
        )}
      </IllustrationBox>

      <Title
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {data.title}
      </Title>

      <Body
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        {data.body}
      </Body>

      <motion.div
        style={{ width: "100%" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
      >
        <Button
          fullWidth
          size="lg"
          icon={<ChevronRight size={18} />}
          onClick={onContinue}
        >
          Continue
        </Button>
      </motion.div>
    </Wrapper>
  );
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
`;

const IllustrationBox = styled(motion.div)`
  width: 96px;
  height: 96px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.successLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 72px;
    height: 72px;
    font-size: 36px;
  }
`;

const InfoImage = styled.img`
  width: 96px;
  height: 96px;
  border-radius: ${({ theme }) => theme.radii.xl};
  object-fit: cover;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 72px;
    height: 72px;
  }
`;

const Title = styled(motion.h2)`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.lg};
  }
`;

const Body = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
  max-width: 480px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.typography.sizes.sm};
  }
`;
