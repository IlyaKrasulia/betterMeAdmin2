import { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2,
  Trash2,
  Copy,
  Clock,
  CheckCircle,
  Circle,
  Globe,
  GlobeLock,
  BarChart3,
  AlertTriangle,
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
  onStats: (id: string) => void;
  index: number;
}

export function SurveyCard({
  flow,
  onEdit,
  onDelete,
  onCopyLink,
  onPublish,
  onUnpublish,
  onStats,
  index,
}: SurveyCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        <IconBtn title="Edit" onClick={() => onEdit(flow.id)}>
          <Edit2 size={15} />
        </IconBtn>
        <IconBtn title="Stats" onClick={() => onStats(flow.id)}>
          <BarChart3 size={15} />
        </IconBtn>
        <IconBtn title="Copy Link" onClick={() => onCopyLink(flow.id)}>
          <Copy size={15} />
        </IconBtn>
        {flow.isPublished ? (
          <IconBtn title="Unpublish" onClick={() => onUnpublish?.(flow.id)}>
            <GlobeLock size={15} />
          </IconBtn>
        ) : (
          <IconBtn title="Publish" onClick={() => onPublish?.(flow.id)}>
            <Globe size={15} />
          </IconBtn>
        )}
        <Spacer />
        <DeleteButton title="Delete" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={15} />
        </DeleteButton>
      </Actions>

      <AnimatePresence>
        {confirmDelete && (
          <ConfirmOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ConfirmContent
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <ConfirmTitle>
                <AlertTriangle size={16} color="currentColor" />
                Delete "{flow.name}"?
              </ConfirmTitle>
              <ConfirmActions>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <DeleteConfirmBtn
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete(flow.id);
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </DeleteConfirmBtn>
              </ConfirmActions>
            </ConfirmContent>
          </ConfirmOverlay>
        )}
      </AnimatePresence>
    </Card>
  );
}

const Card = styled(motion.article)`
  position: relative;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
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
  justify-content: space-between;
  gap: 4px;
  padding-top: 10px;
  margin-top: auto;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Spacer = styled.div`
  flex: 1;
`;

const IconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textTertiary};
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.errorLight};
    color: ${({ theme }) => theme.colors.error};
  }
`;

/* ─── Delete Confirmation Overlay ──────────────────────────────────── */

const ConfirmOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => theme.colors.bgSurface}ee;
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const ConfirmContent = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
`;

const ConfirmTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.error};
`;

const ConfirmActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DeleteConfirmBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: ${({ theme }) => theme.colors.error};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.error}dd;
    transform: scale(1.02);
  }
`;
