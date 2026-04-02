import styled from "styled-components";
import { useDagStore } from "../../store/dag.store";
import { useSetEntryNode } from "@/features/flows/hooks/useFlows";
import { CheckCircle2, LogIn } from "lucide-react";
import { Button } from "@/shared/ui";

export function EntryNodeSection({ nodeId }: { nodeId: string }) {
  const surveyId = useDagStore((s) => s.surveyId);
  const entryNodeId = useDagStore((s) => s.entryNodeId);
  const setEntryNodeId = useDagStore((s) => s.setEntryNodeId);
  const { mutate: setEntryNode, isPending } = useSetEntryNode();

  const isEntry = entryNodeId === nodeId;

  const handleSet = () => {
    if (!surveyId || isEntry) return;
    setEntryNode(
      { flowId: surveyId, data: { entryNodeId: nodeId } },
      { onSuccess: () => setEntryNodeId(nodeId) },
    );
  };

  return (
    <FieldGroup>
      <GroupLabel>Flow entry point</GroupLabel>
      {isEntry ? (
        <EntryActiveBadge>
          <CheckCircle2 size={14} />
          This is the entry node
        </EntryActiveBadge>
      ) : (
        <>
          <EntryHint>
            The entry node is where the flow begins. Only one node can be the
            entry point.
          </EntryHint>
          <Button
            variant="secondary"
            size="sm"
            icon={<LogIn size={14} />}
            onClick={handleSet}
            disabled={isPending}
          >
            {isPending ? "Setting…" : "Set as entry node"}
          </Button>
        </>
      )}
    </FieldGroup>
  );
}


// ───────────────────────────────────────────────────────────────────────────────── Styles ───────────────────────────────────────────────────────────────────

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const GroupLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.7px;
`;

// ── Entry node styles ────────────────────────────────────────────────────────

const EntryActiveBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.accentLight};
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.accent};
`;

const EntryHint = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  line-height: 1.5;
`;
