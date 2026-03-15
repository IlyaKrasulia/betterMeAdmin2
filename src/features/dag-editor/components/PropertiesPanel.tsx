import { useMemo, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, GitBranch, Infinity, LogIn, CheckCircle2 } from "lucide-react";
import type { Node, Edge } from "reactflow";
import { Input } from "@shared/ui/Input";
import { Select } from "@shared/ui/Select";
import { Button } from "@shared/ui/Button";
import { useSetEntryNode } from "@features/flows/hooks/useFlows";
import {
  useDagStore,
  selectSelectedNode,
  selectSelectedEdge,
} from "../store/dag.store";
import type {
  DagNodeData,
  AnswerOption,
  EdgeConditions,
  EdgeConditionRule,
  EdgeOperator,
} from "@shared/types/dag.types";
import {
  NodeType,
  AttributeKey,
  AnswerType,
} from "@shared/types/dag.types";

// ── Attribute type detection ─────────────────────────────────────────────────

// These attributes are inherently numeric regardless of the node's answerType.
// This ensures gt/lt/between operators are always available for them.
const NUMERIC_ATTRIBUTES = new Set<string>([
  AttributeKey.Age,
  AttributeKey.StressLevel,
  AttributeKey.SleepLevel,
  AttributeKey.EnergyLevel,
  AttributeKey.AvailableTime,
]);

type AttrKind = "numeric" | "enum" | "text";

interface AttrMeta {
  kind: AttrKind;
  options?: AnswerOption[];
}

// Operators grouped by attribute kind
const OPERATORS: Record<AttrKind, { value: EdgeOperator; label: string }[]> = {
  numeric: [
    { value: "eq",      label: "= equals" },
    { value: "neq",     label: "≠ not equals" },
    { value: "gt",      label: "> greater than" },
    { value: "gte",     label: "≥ greater than or equal" },
    { value: "lt",      label: "< less than" },
    { value: "lte",     label: "≤ less than or equal" },
    { value: "between", label: "↔ between" },
  ],
  enum: [
    { value: "eq",      label: "= equals" },
    { value: "neq",     label: "≠ not equals" },
    { value: "in",      label: "∈ is one of" },
    { value: "not_in",  label: "∉ is not one of" },
  ],
  text: [
    { value: "eq",       label: "= equals" },
    { value: "neq",      label: "≠ not equals" },
    { value: "contains", label: "⊃ contains" },
  ],
};

// Default operator when switching attribute kinds
const DEFAULT_OP: Record<AttrKind, EdgeOperator> = {
  numeric: "eq",
  enum:    "eq",
  text:    "eq",
};

const attributeOptions = Object.values(AttributeKey).map((v) => ({
  value: v,
  label: v.replace(/_/g, " "),
}));

const answerTypeOptions = Object.values(AnswerType).map((v) => ({
  value: v,
  label: v.replace(/_/g, " "),
}));

function QuestionProperties({ node }: { node: Node<DagNodeData> }) {
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
        <Select
          label="Attribute to save"
          value={data.attribute}
          options={attributeOptions}
          onChange={(e) =>
            updateNodeData(node.id, {
              attribute: e.target.value as AttributeKey,
            } as Partial<DagNodeData>)
          }
        />
        <Select
          label="Answer type"
          value={data.answerType}
          options={answerTypeOptions}
          onChange={(e) =>
            updateNodeData(node.id, {
              answerType: e.target.value as AnswerType,
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
          {data.options && data.options.map((opt) => (
            <OptionRow key={opt.id}>
              <Input
                value={opt.label}
                onChange={(e) => updateOption(opt.id, "label", e.target.value)}
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

function InfoProperties({ node }: { node: Node<DagNodeData> }) {
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

function OfferProperties({ node }: { node: Node<DagNodeData> }) {
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
    </FieldGroup>
  );
}

const DEFAULT_CONDITIONS: EdgeConditions = {
  always: true,
  rules: [],
  priority: 0,
};

function EdgeProperties({ edge }: { edge: Edge }) {
  const updateEdgeCondition = useDagStore((s) => s.updateEdgeCondition);
  const nodes = useDagStore((s) => s.nodes);

  // Build attribute metadata map from all Question nodes in the graph:
  // attributeKey → { kind: 'numeric'|'enum'|'text', options? }
  const attrMeta = useMemo(() => {
    const map: Record<string, AttrMeta> = {};
    for (const n of nodes) {
      if (n.type === NodeType.Question) {
        const qData = n.data as import("@shared/types/dag.types").QuestionNodeData;
        const isNumeric =
          qData.answerType === AnswerType.Slider ||
          NUMERIC_ATTRIBUTES.has(qData.attribute);
        const hasOptions = !isNumeric && (qData.options?.length ?? 0) > 0;
        map[qData.attribute] = {
          kind: isNumeric ? "numeric" : hasOptions ? "enum" : "text",
          options: hasOptions ? qData.options : undefined,
        };
      }
    }
    return map;
  }, [nodes]);

  const getKind = (attrKey: string): AttrKind => {
    if (attrMeta[attrKey]) return attrMeta[attrKey].kind;
    // Attribute not present in graph — use known-numeric set as fallback
    if (NUMERIC_ATTRIBUTES.has(attrKey)) return "numeric";
    return "text";
  };

  const conditions: EdgeConditions = edge.data?.conditions ?? DEFAULT_CONDITIONS;

  const update = (patch: Partial<EdgeConditions>) => {
    updateEdgeCondition(edge.id, { ...conditions, ...patch });
  };

  const addRule = () => {
    const attrKey = AttributeKey.Goal;
    const kind = getKind(attrKey);
    const opts = attrMeta[attrKey]?.options;
    update({
      rules: [
        ...conditions.rules,
        {
          attributeKey: attrKey,
          operator: DEFAULT_OP[kind],
          value: opts?.[0]?.value ?? "",
        },
      ],
    });
  };

  const removeRule = (idx: number) =>
    update({ rules: conditions.rules.filter((_, i) => i !== idx) });

  const patchRule = (idx: number, patch: Partial<EdgeConditionRule>) =>
    update({
      rules: conditions.rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    });

  // When attribute changes: reset operator to kind-appropriate default and reset value
  const changeAttribute = (idx: number, newAttr: string) => {
    const kind = getKind(newAttr);
    const opts = attrMeta[newAttr]?.options;
    patchRule(idx, {
      attributeKey: newAttr,
      operator: DEFAULT_OP[kind],
      value: opts?.[0]?.value ?? "",
      valueTo: undefined,
    });
  };

  // When operator changes: clear valueTo if switching away from between,
  // and reset value if switching to/from set operators
  const changeOperator = (idx: number, newOp: EdgeOperator) => {
    const rule = conditions.rules[idx];
    const wasMulti = rule.operator === "in" || rule.operator === "not_in";
    const isMulti = newOp === "in" || newOp === "not_in";
    patchRule(idx, {
      operator: newOp,
      valueTo: newOp === "between" ? rule.valueTo ?? "" : undefined,
      // reset value when switching between single↔multi-value modes
      value: wasMulti !== isMulti ? "" : rule.value,
    });
  };

  // Toggle a value in a comma-separated "in"/"not_in" list
  const toggleSetValue = (idx: number, optValue: string) => {
    const rule = conditions.rules[idx];
    const current = rule.value ? rule.value.split(",") : [];
    const next = current.includes(optValue)
      ? current.filter((v) => v !== optValue)
      : [...current, optValue];
    patchRule(idx, { value: next.join(",") });
  };

  return (
    <>
      {/* ── Routing ── */}
      <FieldGroup>
        <GroupLabel>Routing</GroupLabel>

        <Input
          label="Priority (higher = evaluated first)"
          type="number"
          value={conditions.priority}
          onChange={(e) =>
            update({ priority: Math.max(0, parseInt(e.target.value) || 0) })
          }
        />

        <AlwaysToggle
          $active={conditions.always}
          onClick={() => update({ always: !conditions.always })}
          title="Toggle unconditional routing"
        >
          <ToggleIcon>
            {conditions.always ? <Infinity size={14} /> : <GitBranch size={14} />}
          </ToggleIcon>
          <ToggleLabel>
            {conditions.always
              ? "Unconditional — always match"
              : "Conditional — evaluate rules"}
          </ToggleLabel>
          <TogglePill $active={conditions.always} />
        </AlwaysToggle>

        {conditions.always && (
          <HintText>
            Fallback edge — fires when no conditional edge matches. Set priority
            lower than conditional siblings.
          </HintText>
        )}
      </FieldGroup>

      {/* ── Condition rules ── */}
      {!conditions.always && (
        <FieldGroup>
          <GroupLabel>Conditions (AND)</GroupLabel>

          {conditions.rules.length === 0 && (
            <HintText>
              No rules yet — add at least one, or switch to unconditional.
            </HintText>
          )}

          {conditions.rules.map((rule, idx) => {
            const kind = getKind(rule.attributeKey);
            const meta = attrMeta[rule.attributeKey];
            const operatorList = OPERATORS[kind];
            const selectedValues = rule.value
              ? rule.value.split(",").filter(Boolean)
              : [];

            return (
              <RuleCard key={idx}>
                {/* Row: Attribute + delete */}
                <RuleRow>
                  <Select
                    label="Attribute"
                    value={rule.attributeKey}
                    options={attributeOptions}
                    onChange={(e) => changeAttribute(idx, e.target.value)}
                  />
                  <DeleteRuleBtn
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(idx)}
                    title="Remove this condition"
                  >
                    <Trash2 size={13} />
                  </DeleteRuleBtn>
                </RuleRow>

                {/* Operator */}
                <Select
                  label="Operator"
                  value={rule.operator}
                  options={operatorList}
                  onChange={(e) => changeOperator(idx, e.target.value as EdgeOperator)}
                />

                {/* Value input — varies by operator + kind */}

                {/* between → two numeric inputs */}
                {rule.operator === "between" && (
                  <BetweenRow>
                    <Input
                      label="From"
                      type="number"
                      value={rule.value}
                      onChange={(e) => patchRule(idx, { value: e.target.value })}
                      placeholder="min"
                    />
                    <BetweenSep>–</BetweenSep>
                    <Input
                      label="To"
                      type="number"
                      value={rule.valueTo ?? ""}
                      onChange={(e) => patchRule(idx, { valueTo: e.target.value })}
                      placeholder="max"
                    />
                  </BetweenRow>
                )}

                {/* in / not_in + enum → checkboxes */}
                {(rule.operator === "in" || rule.operator === "not_in") &&
                  meta?.options?.length && (
                    <CheckboxGroup>
                      <CheckboxGroupLabel>Select values</CheckboxGroupLabel>
                      {meta.options.map((opt) => (
                        <CheckboxRow key={opt.id}>
                          <NativeCheckbox
                            type="checkbox"
                            id={`rule-${idx}-${opt.id}`}
                            checked={selectedValues.includes(opt.value)}
                            onChange={() => toggleSetValue(idx, opt.value)}
                          />
                          <CheckboxLabel htmlFor={`rule-${idx}-${opt.id}`}>
                            {opt.label}
                          </CheckboxLabel>
                        </CheckboxRow>
                      ))}
                    </CheckboxGroup>
                  )}

                {/* in / not_in without enum options → free text comma list */}
                {(rule.operator === "in" || rule.operator === "not_in") &&
                  !meta?.options?.length && (
                    <Input
                      label="Values (comma-separated)"
                      value={rule.value}
                      onChange={(e) => patchRule(idx, { value: e.target.value })}
                      placeholder="val1,val2,val3"
                    />
                  )}

                {/* eq / neq / contains on enum → dropdown */}
                {rule.operator !== "between" &&
                  rule.operator !== "in" &&
                  rule.operator !== "not_in" &&
                  kind === "enum" &&
                  meta?.options?.length && (
                    <Select
                      label="Value"
                      value={rule.value}
                      options={meta.options.map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                      onChange={(e) => patchRule(idx, { value: e.target.value })}
                    />
                  )}

                {/* numeric single-value operators → number input */}
                {rule.operator !== "between" &&
                  rule.operator !== "in" &&
                  rule.operator !== "not_in" &&
                  kind === "numeric" && (
                    <Input
                      label="Value"
                      type="number"
                      value={rule.value}
                      onChange={(e) => patchRule(idx, { value: e.target.value })}
                      placeholder="0"
                    />
                  )}

                {/* text operators → text input */}
                {rule.operator !== "between" &&
                  rule.operator !== "in" &&
                  rule.operator !== "not_in" &&
                  kind === "text" && (
                    <Input
                      label="Value"
                      value={rule.value}
                      onChange={(e) => patchRule(idx, { value: e.target.value })}
                      placeholder="exact match value"
                    />
                  )}

                {idx < conditions.rules.length - 1 && (
                  <AndDivider>AND</AndDivider>
                )}
              </RuleCard>
            );
          })}

          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={addRule}
          >
            Add condition
          </Button>
        </FieldGroup>
      )}
    </>
  );
}

function EntryNodeSection({ nodeId }: { nodeId: string }) {
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

export function PropertiesPanel() {
  const selectedNode = useDagStore(selectSelectedNode);
  const selectedEdge = useDagStore(selectSelectedEdge);
  const setSelectedNode = useDagStore((s) => s.setSelectedNode);
  const setSelectedEdge = useDagStore((s) => s.setSelectedEdge);

  const isOpen = !!selectedNode || !!selectedEdge;

  return (
    <AnimatePresence>
      {isOpen && (
        <Panel
          initial={{ x: 280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 280, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          <PanelHeader>
            <PanelTitle>
              {selectedNode
                ? `${selectedNode.type?.charAt(0).toUpperCase()}${selectedNode.type?.slice(1)} Node`
                : "Edge Condition"}
            </PanelTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedNode(null);
                setSelectedEdge(null);
              }}
            >
              <X size={16} />
            </Button>
          </PanelHeader>

          <PanelBody>
            {selectedNode && (
              <EntryNodeSection nodeId={selectedNode.id} />
            )}
            {selectedNode && selectedNode.type === NodeType.Question && (
              <QuestionProperties node={selectedNode} />
            )}
            {selectedNode && selectedNode.type === NodeType.Info && (
              <InfoProperties node={selectedNode} />
            )}
            {selectedNode && selectedNode.type === NodeType.Offer && (
              <OfferProperties node={selectedNode} />
            )}
            {selectedEdge && <EdgeProperties edge={selectedEdge} />}
          </PanelBody>
        </Panel>
      )}
    </AnimatePresence>
  );
}

// ───────────────────────────────────────────────────────────────────────────────── Styles ───────────────────────────────────────────────────────────────────

const Panel = styled(motion.aside)`
  width: 280px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
`;

const PanelHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PanelTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

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

// ── Edge condition styles ────────────────────────────────────────────────────

const AlwaysToggle = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accentLight : theme.colors.bgElevated};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.accent : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const ToggleIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.accent};
  flex-shrink: 0;
`;

const ToggleLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const TogglePill = styled.span<{ $active: boolean }>`
  width: 28px;
  height: 16px;
  border-radius: 8px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accent : theme.colors.border};
  position: relative;
  flex-shrink: 0;
  transition: background 0.15s ease;

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: ${({ $active }) => ($active ? "14px" : "2px")};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    transition: left 0.15s ease;
  }
`;

const HintText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  line-height: 1.5;
`;

const RuleCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const RuleRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
`;

const DeleteRuleBtn = styled(Button)`
  flex-shrink: 0;
  margin-bottom: 2px;
  color: ${({ theme }) => theme.colors.textTertiary};

  &:hover {
    color: ${({ theme }) => theme.colors.error ?? "#ef4444"};
  }
`;

const AndDivider = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-align: center;
  letter-spacing: 0.5px;
`;

const BetweenRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
`;

const BetweenSep = styled.span`
  flex-shrink: 0;
  padding-bottom: 10px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CheckboxGroupLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  margin-bottom: 2px;
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NativeCheckbox = styled.input`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  accent-color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  user-select: none;
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