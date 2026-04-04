import { Plus, Trash2 } from "lucide-react";
import type { Node } from "reactflow";

import { Input } from "@shared/ui/Input";
import { Select } from "@shared/ui/Select";
import { Button } from "@shared/ui/Button";
import { useDagStore } from "../../store/dag.store";
import { DagNodeData, AnswerOption, ValueKind } from "@shared/types/dag.types";
import { AttributeKey, AnswerType } from "@shared/types/dag.types";
import styled from "styled-components";

export function QuestionProperties({ node }: { node: Node<DagNodeData> }) {
  const updateNodeData = useDagStore((s) => s.updateNodeData);
  const data = node.data as import("@shared/types/dag.types").QuestionNodeData;

  const addOption = () => {
    const currentOptions = data.options ?? [];
    const uid = crypto.randomUUID().slice(0, 8);
    const newOption: AnswerOption = {
      id: crypto.randomUUID(),
      label: "New option",
      value: `option_${uid}`,
    };
    updateNodeData(node.id, {
      options: [...currentOptions, newOption],
    } as Partial<DagNodeData>);
  };

  const removeOption = (id: string) => {
    updateNodeData(node.id, {
      options: data.options.filter((o) => o.id !== id),
    } as Partial<DagNodeData>);
  };

  const updateOption = (
    id: string,
    field: keyof AnswerOption,
    value: string,
  ) => {
    updateNodeData(node.id, {
      options: data.options.map((o) =>
        o.id === id ? { ...o, [field]: value } : o,
      ),
    } as Partial<DagNodeData>);
  };

  const valueKindOptions = Object.values(ValueKind).map((v) => ({
    value: v,
    label: v.replace(/_/g, " "),
  }));

  const answerTypeOptions = Object.values(AnswerType).map((v) => ({
    value: v,
    label: v.replace(/_/g, " "),
  }));

  const answerTypeOptionsFiltered = (valueKind: ValueKind) => {
    if (valueKind === ValueKind.Text) {
      return answerTypeOptions.filter((opt) => opt.value !== AnswerType.Slider);
    }
  };

  return (
    <>
      <FieldGroup>
        <GroupLabel>Content</GroupLabel>
        <Input
          label="Question text"
          value={data.questionText}
          onChange={(e) =>
            updateNodeData(node.id, {
              questionText: e.target.value,
            } as Partial<DagNodeData>)
          }
          placeholder="Enter your question"
        />
        <Input
          label="Attribute to save"
          value={data.attribute}
          onChange={(e) =>
            updateNodeData(node.id, {
              attribute: e.target.value as AttributeKey,
            } as Partial<DagNodeData>)
          }
          placeholder="Enter Attribute Key"
          disabled={!node?.isLocal}
        />
        <Select
          label="Value type"
          value={data.valueKind}
          options={valueKindOptions}
          onChange={(e) =>
            updateNodeData(node.id, {
              valueKind: e.target.value as ValueKind,
            } as Partial<DagNodeData>)
          }
          disabled={!node?.isLocal}
        />
        <Select
          label="Answer type"
          value={data.answerType}
          options={
            answerTypeOptionsFiltered(data.valueKind || ValueKind.Text) ||
            answerTypeOptions
          }
          onChange={(e) =>
            updateNodeData(node.id, {
              answerType: e.target.value as AnswerType,
              options: e.target.value === AnswerType.Slider ? [] : data.options,
            } as Partial<DagNodeData>)
          }
        />

        {data.answerType === AnswerType.Slider && (
          <OptionRow>
            <Input
              label="Min"
              type="number"
              value={data.min ?? 0}
              onChange={(e) =>
                updateNodeData(node.id, {
                  min: Number(e.target.value),
                } as Partial<DagNodeData>)
              }
            />
            <Input
              label="Max"
              type="number"
              value={data.max ?? 10}
              onChange={(e) =>
                updateNodeData(node.id, {
                  max: Number(e.target.value),
                } as Partial<DagNodeData>)
              }
            />
          </OptionRow>
        )}
      </FieldGroup>

      {data.answerType !== AnswerType.Slider && (
        <FieldGroup>
          <GroupLabel>Answer Options</GroupLabel>
          {data.options &&
            data.options.map((opt) => (
              <OptionRow key={opt.id}>
                <Input
                  value={opt.label}
                  onChange={(e) =>
                    updateOption(opt.id, "label", e.target.value)
                  }
                  placeholder="Option label"
                  error={
                    opt.label.trim() === ""
                      ? "Label cannot be empty"
                      : opt.label.length > 100
                        ? "Label is too long"
                        : undefined
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(opt.id)}
                  style={{ flexShrink: 0 }}
                >
                  <Trash2 size={14} />
                </Button>
              </OptionRow>
            ))}
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={addOption}
          >
            Add option
          </Button>
        </FieldGroup>
      )}
    </>
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

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
