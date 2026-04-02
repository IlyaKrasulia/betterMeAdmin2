import type { Node } from "reactflow";

import { Input } from "@shared/ui/Input";
import { useDagStore } from "../../store/dag.store";
import { DagNodeData } from "@shared/types/dag.types";
import styled from "styled-components";

export function OfferProperties({ node }: { node: Node<DagNodeData> }) {
  const updateNodeData = useDagStore((s) => s.updateNodeData);
  const data = node.data as import("@shared/types/dag.types").OfferNodeData;

  return (
    <FieldGroup>
      <GroupLabel>Offer Details</GroupLabel>
      <Input
        label="Headline"
        value={data.headline}
        onChange={(e) =>
          updateNodeData(node.id, {
            headline: e.target.value,
          } as Partial<DagNodeData>)
        }
        placeholder="Your plan is ready!"
      />
      <Input
        label="Description"
        value={data.description}
        onChange={(e) =>
          updateNodeData(node.id, {
            description: e.target.value,
          } as Partial<DagNodeData>)
        }
        placeholder="Plan description"
      />
      <Input
        label="CTA text"
        value={data.ctaText}
        onChange={(e) =>
          updateNodeData(node.id, {
            ctaText: e.target.value,
          } as Partial<DagNodeData>)
        }
        placeholder="Get my plan"
      />
      <Input
        label="Price (optional)"
        type="number"
        value={data.price ?? ""}
        onChange={(e) =>
          updateNodeData(node.id, {
            price: e.target.value ? parseFloat(e.target.value) : undefined,
          } as Partial<DagNodeData>)
        }
        placeholder="29.99"
      />
      <Input
        label="Kit name (optional)"
        value={data.kitName ?? ""}
        onChange={(e) =>
          updateNodeData(node.id, {
            kitName: e.target.value || undefined,
          } as Partial<DagNodeData>)
        }
        placeholder="Wellness kit name"
      />
      <Input
        label="Kit contents (optional)"
        value={data.kitContents ?? ""}
        onChange={(e) =>
          updateNodeData(node.id, {
            kitContents: e.target.value || undefined,
          } as Partial<DagNodeData>)
        }
        placeholder="Items in the kit"
      />
      <Input
        label="Image URL (optional)"
        value={data.imageUrl ?? ""}
        onChange={(e) =>
          updateNodeData(node.id, {
            imageUrl: e.target.value || undefined,
          } as Partial<DagNodeData>)
        }
        placeholder="https://..."
      />
      <Input
        label="CTA URL (optional)"
        value={data.ctaUrl ?? ""}
        onChange={(e) =>
          updateNodeData(node.id, {
            ctaUrl: e.target.value || undefined,
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