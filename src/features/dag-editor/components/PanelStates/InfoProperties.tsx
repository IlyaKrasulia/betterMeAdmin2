import styled from "styled-components";
import type { Node } from "reactflow";

import { Input } from "@shared/ui/Input";
import { useDagStore } from "../../store/dag.store";
import { DagNodeData } from "@shared/types/dag.types";

export function InfoProperties({ node }: { node: Node<DagNodeData> }) {
  const updateNodeData = useDagStore((s) => s.updateNodeData);
  const data = node.data as import("@shared/types/dag.types").InfoNodeData;

  return (
    <FieldGroup>
      <GroupLabel>Content</GroupLabel>
      <Input
        label="Title"
        value={data.title}
        onChange={(e) =>
          updateNodeData(node.id, {
            title: e.target.value,
          } as Partial<DagNodeData>)
        }
        placeholder="Screen title"
      />
      <Input
        label="Body text"
        value={data.body}
        onChange={(e) =>
          updateNodeData(node.id, {
            body: e.target.value,
          } as Partial<DagNodeData>)
        }
        placeholder="Motivational message"
      />
      <Input
        label="Image URL (optional)"
        value={data.imageUrl ?? ""}
        onChange={(e) =>
          updateNodeData(node.id, {
            imageUrl: e.target.value,
          } as Partial<DagNodeData>)
        }
        placeholder="https://..."
      />
    </FieldGroup>
  );
}


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