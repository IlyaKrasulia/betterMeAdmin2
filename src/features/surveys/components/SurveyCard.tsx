import styled from "styled-components";
import { motion } from "framer-motion";
import {
  Edit2,
  Trash2,
  Copy,
  Clock,
  CheckCircle,
  Circle,
  Globe,
  GlobeLock,
} from "lucide-react";
import { Badge } from "@shared/ui/Badge";
import { Button } from "@shared/ui/Button";
import type { FlowSummary } from "@shared/types/api.types";
import { formatDate } from "@shared/utils/format";

interface SurveyCardProps {
  flow: FlowSummary;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyLink: (id: string) => void;
  onPublish?: (id: string) => void;
  onUnpublish?: (id: string) => void;
  index: number;
}

export function SurveyCard({
  flow,
  onEdit,
  onDelete,
  onCopyLink,
  onPublish,
  onUnpublish,
  index,
}: SurveyCardProps) {
  return (
    <Card
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
    >
      <Header>
        <TitleBlock>
          <Title title={flow.name}>{flow.name}</Title>
          {flow.description && (
            <Description>{flow.description}</Description>
          )}
        </TitleBlock>
        <Badge $variant={flow.isPublished ? "success" : "neutral"}>
          {flow.isPublished ? <CheckCircle size={11} /> : <Circle size={11} />}
          {flow.isPublished ? "Published" : "Draft"}
        </Badge>
      </Header>

      <Meta>
        <MetaItem>
          <Clock size={13} />
          {formatDate(flow.updatedAt)}
        </MetaItem>
      </Meta>

      <Actions>
        <Button
          variant="ghost"
          size="sm"
          icon={<Edit2 size={14} />}
          onClick={() => onEdit(flow.id)}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Copy size={14} />}
          onClick={() => onCopyLink(flow.id)}
        >
          Copy Link
        </Button>
        {flow.isPublished ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<GlobeLock size={14} />}
            onClick={() => onUnpublish?.(flow.id)}
          >
            Unpublish
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon={<Globe size={14} />}
            onClick={() => onPublish?.(flow.id)}
          >
            Publish
          </Button>
        )}
        <Spacer />
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => onDelete(flow.id)}
          style={{ color: "#EF4444" }}
        >
          Delete
        </Button>
      </Actions>
    </Card>
  );
}

const Card = styled(motion.article)`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};
  cursor: default;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderHover};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Spacer = styled.div`
  flex: 1;
`;
