import styled from 'styled-components'
import type { Node } from 'reactflow'

import { Input } from '@shared/ui/Input'
import { useDagStore } from '../../store/dag.store'
import type { DagNodeData, InfoNodeData } from '@shared/types/dag.types'
import { EntryNodeSection } from './EntryNodeSection'

export function InfoProperties({ node }: { node: Node<DagNodeData> }) {
  const updateNodeData = useDagStore((s) => s.updateNodeData)
  const data = node.data as InfoNodeData

  return (
    <>
      <FieldGroup>
        <GroupLabel>Content</GroupLabel>
        <Input
          label="Title"
          value={data.title}
          onChange={(e) =>
            updateNodeData(node.id, { title: e.target.value } as Partial<DagNodeData>)
          }
          placeholder="Screen title"
        />
        <Textarea
          placeholder="Body text shown below the title..."
          value={data.body}
          rows={4}
          onChange={(e) =>
            updateNodeData(node.id, { body: e.target.value } as Partial<DagNodeData>)
          }
        />
        <Input
          label="Image URL (optional)"
          value={data.mediaUrl ?? ''}
          onChange={(e) =>
            updateNodeData(node.id, { mediaUrl: e.target.value || undefined } as Partial<DagNodeData>)
          }
          placeholder="https://..."
        />
      </FieldGroup>

      <EntryNodeSection nodeId={node.id} />
    </>
  )
}

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const GroupLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.7px;
`

const Textarea = styled.textarea`
  width: 100%;
  padding: 9px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgSurface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-family: inherit;
  resize: vertical;
  outline: none;
  line-height: 1.5;
  box-sizing: border-box;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accent}22;
  }

  &::placeholder { color: ${({ theme }) => theme.colors.textTertiary}; }
`
