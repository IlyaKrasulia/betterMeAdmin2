import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { ReactFlowProvider } from "reactflow";
import { ArrowLeft, Save, Eye, Circle } from "lucide-react";
import { Button } from "@shared/ui/Button";
import { Badge } from "@shared/ui/Badge";
import { Spinner } from "@shared/ui/Spinner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { DagCanvas } from "@features/dag-editor/components/DagCanvas";
import { useDagStore } from "@features/dag-editor/store/dag.store";
import { useFlow } from "@features/flows/hooks/useFlows";
import {
  useCreateNode,
  useUpdateNode,
  useUpdateNodePosition,
  useDeleteNode,
} from "@features/nodes/hooks/useNodes";
import {
  useCreateEdge,
  useUpdateEdge,
  useDeleteEdge,
} from "@features/edges/hooks/useEdges";
import {
  flowNodeToNode,
  flowEdgeToEdge,
  nodeToCreateRequest,
  nodeToUpdateRequest,
} from "@features/flows/utils/flow-adapter";
import { optionsApi } from "@api/options.api";
import { useQueryClient } from "@tanstack/react-query";
import type { FlowNodeDto, FlowEdgeDto } from "@shared/types/api.types";
import { NodeType } from "@shared/types/dag.types";
import type { QuestionNodeData, EdgeConditions } from "@shared/types/dag.types";
import type { Edge } from "reactflow";
import toast from "react-hot-toast";

/* ── Height chain explanation ───────────────────────────────────────────
   html/body → #root (flex column, min-h: 100vh)
     → motion.div PageWrapper (flex: 1, height: 100vh, overflow: hidden)
       → PageLayout (flex column, height: 100%)
         → Header (56px fixed)
         → CanvasArea (flex: 1, min-h: 0, display: flex)
           → DagCanvas's EditorLayout (flex: 1, h: 100%, display: flex)
             → NodePalette (w: 210px)
             → CanvasWrapper (flex: 1, h: 100%)
               → <ReactFlow> (fills wrapper via CSS)
             → PropertiesPanel (w: 280px, conditional)
   
   Every flex ancestor has min-height: 0 so React Flow gets real pixels.
   ─────────────────────────────────────────────────────────────────────── */

export function DagEditorPage() {
  const { surveyId } = useParams({ from: "/editor/$surveyId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── API hooks ──────────────────────────────────────────────────────────
  const { data: flow, isLoading, isError } = useFlow(surveyId);
  const { mutateAsync: createNode } = useCreateNode();
  const { mutateAsync: updateNode } = useUpdateNode();
  const { mutateAsync: updateNodePosition } = useUpdateNodePosition();
  const { mutateAsync: deleteNode } = useDeleteNode();
  const { mutateAsync: createEdge } = useCreateEdge();
  const { mutateAsync: updateEdge } = useUpdateEdge();
  const { mutateAsync: deleteEdge } = useDeleteEdge();

  // ── DAG store ──────────────────────────────────────────────────────────
  const loadSurvey = useDagStore((s) => s.loadSurvey);
  const nodes = useDagStore((s) => s.nodes);
  const edges = useDagStore((s) => s.edges);
  const isDirty = useDagStore((s) => s.isDirty);
  const markSaved = useDagStore((s) => s.markSaved);

  // Track the original API data for diffing on save
  const originalNodesRef = useRef<FlowNodeDto[]>([]);
  const originalEdgesRef = useRef<FlowEdgeDto[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load flow into DAG store on initial fetch ──────────────────────────
  useEffect(() => {
    if (flow) {
      const safeNodes = flow.nodes || [];
      const safeEdges = flow.edges || [];

      originalNodesRef.current = safeNodes;
      originalEdgesRef.current = safeEdges;

      const dagNodes = safeNodes.map(flowNodeToNode);
      const dagEdges = safeEdges.map(flowEdgeToEdge);

      loadSurvey(flow.id, dagNodes, dagEdges, flow.entryNodeId ?? null);
    }
  }, [flow?.id]);

  // ── Loading / error states ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageLayout>
        <LoadingBlock>
          <Spinner size={32} />
        </LoadingBlock>
      </PageLayout>
    );
  }

  if (isError || !flow) {
    return (
      <PageLayout>
        <NotFound>
          <p>{isError ? "Failed to load survey." : "Survey not found."}</p>
          <Button onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </NotFound>
      </PageLayout>
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  // Extract EdgeConditions from a canvas edge
  const getEdgeConditions = (edge: Edge): EdgeConditions =>
    (edge.data?.conditions as EdgeConditions | undefined) ?? {
      always: true,
      rules: [],
      priority: 0,
    };

  // Serialize edge conditions to the JSON string the backend expects.
  // Canonical format: null (always) | [{ AttributeKey, Operator, Value, ValueTo? }, ...]
  const toConditionsJson = (edge: Edge): string | null => {
    const cond = getEdgeConditions(edge);
    if (cond.always || cond.rules.length === 0) return null;
    return JSON.stringify(
      cond.rules.map((r) => {
        const base = {
          AttributeKey: r.attributeKey,
          Operator: r.operator ?? "eq",
          Value: r.value,
        };
        // Include ValueTo only for the 'between' operator
        if (r.operator === "between" && r.valueTo !== undefined) {
          return { ...base, ValueTo: r.valueTo };
        }
        return base;
      }),
    );
  };

  // Detect whether an existing edge's conditions OR priority have changed
  const edgeConditionChanged = (edge: Edge, orig: FlowEdgeDto): boolean => {
    const cond = getEdgeConditions(edge);

    // Priority change always triggers update
    if ((cond.priority ?? 0) !== (orig.priority ?? 0)) return true;

    const newIsAlways = cond.always || cond.rules.length === 0;
    const origIsAlways = !orig.conditions;

    if (newIsAlways && origIsAlways) return false;
    if (newIsAlways !== origIsAlways) return true;

    // Both have rules — compare them
    try {
      const parsed = JSON.parse(orig.conditions!) as unknown;
      type NormRule = { attributeKey: string; operator: string; value: string; valueTo?: string };
      let origRules: NormRule[];

      if (Array.isArray(parsed)) {
        type BR = { AttributeKey?: string; Operator?: string; Value?: string; ValueTo?: string };
        origRules = (parsed as BR[]).map((r) => ({
          attributeKey: r.AttributeKey ?? "",
          operator: r.Operator ?? "eq",
          value: r.Value ?? "",
          ...(r.ValueTo !== undefined ? { valueTo: r.ValueTo } : {}),
        }));
      } else if (
        parsed &&
        typeof parsed === "object" &&
        (parsed as { rules?: unknown }).rules
      ) {
        const legacy = parsed as { rules: Array<{ attribute?: string; op?: string; value?: string }> };
        origRules = legacy.rules.map((r) => ({
          attributeKey: r.attribute ?? "",
          operator: r.op ?? "eq",
          value: r.value ?? "",
        }));
      } else {
        return true;
      }

      const newRules = cond.rules;
      if (origRules.length !== newRules.length) return true;
      return origRules.some(
        (r, i) =>
          r.attributeKey !== newRules[i].attributeKey ||
          r.operator !== (newRules[i].operator ?? "eq") ||
          r.value !== newRules[i].value ||
          (r.valueTo ?? "") !== (newRules[i].valueTo ?? ""),
      );
    } catch {
      return true;
    }
  };

  // ── Save handler — diffs current canvas state against the loaded API data ──
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const originalNodeMap = new Map(
        originalNodesRef.current.map((n) => [n.id, n]),
      );
      const originalEdgeMap = new Map(
        originalEdgesRef.current.map((e) => [e.id, e]),
      );
      const currentNodeIds = new Set(nodes.map((n) => n.id));
      const currentEdgeIds = new Set(edges.map((e) => e.id));

      // Map client-generated IDs to server-assigned IDs for newly created nodes
      const clientToServerId = new Map<string, string>();

      // ── 1. Create new nodes ────────────────────────────────────────────
      for (const node of nodes) {
        if (!originalNodeMap.has(node.id)) {
          const result = await createNode({
            flowId: surveyId,
            data: nodeToCreateRequest(node),
          });
          clientToServerId.set(node.id, result.id);

          // Create options for new question nodes
          if (node.data.type === NodeType.Question) {
            const qData = node.data as QuestionNodeData;
            for (let i = 0; i < qData.options.length; i++) {
              await optionsApi.createOption(result.id, {
                label: qData.options[i].label,
                value: qData.options[i].value,
                displayOrder: i,
              });
            }
          }
        }
      }

      // ── 2. Update existing nodes (content only) ────────────────────────
      await Promise.all(
        nodes
          .filter((n) => originalNodeMap.has(n.id))
          .map((node) =>
            updateNode({
              flowId: surveyId,
              nodeId: node.id,
              data: nodeToUpdateRequest(node),
            }),
          ),
      );

      // ── 3. Update positions of existing nodes ─────────────────────────
      await Promise.all(
        nodes
          .filter((n) => originalNodeMap.has(n.id))
          .map((node) =>
            updateNodePosition({
              flowId: surveyId,
              nodeId: node.id,
              data: {
                positionX: Math.round(node.position.x),
                positionY: Math.round(node.position.y),
              },
            }),
          ),
      );

      // ── 4. Sync options for existing question nodes ────────────────────
      for (const node of nodes.filter(
        (n) => originalNodeMap.has(n.id) && n.data.type === NodeType.Question,
      )) {
        const qData = node.data as QuestionNodeData;
        const origOptions = originalNodeMap.get(node.id)!.options ?? [];
        const origOptionMap = new Map(origOptions.map((o) => [o.id, o]));
        const currentOptionIds = new Set(qData.options.map((o) => o.id));

        // Delete removed options FIRST so their displayOrder slots are freed
        await Promise.all(
          origOptions
            .filter((o) => !currentOptionIds.has(o.id))
            .map((o) => optionsApi.deleteOption(node.id, o.id)),
        );

        // Update existing options — use full-array index so displayOrder reflects
        // the actual current position (catches reordering after deletions too)
        await Promise.all(
          qData.options.flatMap((opt, fullIndex) => {
            if (!origOptionMap.has(opt.id)) return []; // skip newly-added options
            const orig = origOptionMap.get(opt.id)!;
            if (
              opt.label !== orig.label ||
              opt.value !== orig.value ||
              fullIndex !== orig.displayOrder
            ) {
              return [
                optionsApi.updateOption(node.id, opt.id, {
                  label: opt.label,
                  value: opt.value,
                  displayOrder: fullIndex,
                }),
              ];
            }
            return [];
          }),
        );

        // Create new options (client-UUID ids are not in origOptionMap)
        for (let i = 0; i < qData.options.length; i++) {
          const opt = qData.options[i];
          if (!origOptionMap.has(opt.id)) {
            await optionsApi.createOption(node.id, {
              label: opt.label,
              value: opt.value,
              displayOrder: i,
            });
          }
        }
      }

      // ── 5. Delete removed nodes ────────────────────────────────────────
      await Promise.all(
        originalNodesRef.current
          .filter((n) => !currentNodeIds.has(n.id))
          .map((n) => deleteNode({ flowId: surveyId, nodeId: n.id })),
      );

      // Helper: resolve server ID for a node (handles newly created nodes)
      const resolveNodeId = (id: string) => clientToServerId.get(id) ?? id;

      // ── 6. Create new edges ────────────────────────────────────────────
      await Promise.all(
        edges
          .filter((e) => !originalEdgeMap.has(e.id))
          .map((edge) =>
            createEdge({
              flowId: surveyId,
              data: {
                sourceNodeId: resolveNodeId(edge.source),
                targetNodeId: resolveNodeId(edge.target),
                priority: getEdgeConditions(edge).priority,
                conditionsJson: toConditionsJson(edge),
              },
            }),
          ),
      );

      // ── 7. Update existing edges whose conditions changed ─────────────
      await Promise.all(
        edges
          .filter((e) => originalEdgeMap.has(e.id))
          .flatMap((edge) => {
            const orig = originalEdgeMap.get(edge.id)!;
            if (edgeConditionChanged(edge, orig)) {
              return [
                updateEdge({
                  flowId: surveyId,
                  edgeId: edge.id,
                  data: {
                    priority: getEdgeConditions(edge).priority,
                    conditionsJson: toConditionsJson(edge),
                  },
                }),
              ];
            }
            return [];
          }),
      );

      // ── 8. Delete removed edges ────────────────────────────────────────
      await Promise.all(
        originalEdgesRef.current
          .filter((e) => !currentEdgeIds.has(e.id))
          .map((e) => deleteEdge({ flowId: surveyId, edgeId: e.id })),
      );

      // ── Reload from API so the store has server-assigned IDs ───────────
      const updated = await queryClient.fetchQuery({
        queryKey: ["flows", surveyId],
        staleTime: 0,
      });
      if (updated) {
        const typedFlow = updated as typeof flow;
        originalNodesRef.current = typedFlow.nodes;
        originalEdgesRef.current = typedFlow.edges;
        const dagNodes = typedFlow.nodes.map(flowNodeToNode);
        const dagEdges = typedFlow.edges.map(flowEdgeToEdge);
        loadSurvey(typedFlow.id, dagNodes, dagEdges, typedFlow.entryNodeId ?? null);
      }

      markSaved();
      toast.success("Survey saved!");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = () => {
    navigate({ to: "/survey/$surveyId", params: { surveyId } });
  };

  return (
    <PageLayout>
      <EditorHeader>
        <BackLink to="/dashboard">
          <ArrowLeft size={15} />
          Surveys
        </BackLink>
        <Divider />
        <SurveyTitle>{flow.name}</SurveyTitle>
        <Badge $variant="neutral">
          {nodes.length} nodes · {edges.length} edges
        </Badge>

        <SaveIndicator>
          {isDirty ? (
            <>
              <Circle size={10} fill="#F59E0B" color="#F59E0B" />
              Unsaved changes
            </>
          ) : (
            <Badge $variant="success">Saved</Badge>
          )}
        </SaveIndicator>

        <ThemeSwitcher />

        <Button
          variant="secondary"
          size="sm"
          icon={<Eye size={14} />}
          onClick={handleTest}
        >
          Preview
        </Button>
        <Button
          size="sm"
          icon={isSaving ? <Spinner size={14} /> : <Save size={14} />}
          onClick={handleSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </EditorHeader>

      <CanvasArea>
        <ReactFlowProvider>
          <DagCanvas />
        </ReactFlowProvider>
      </CanvasArea>
    </PageLayout>
  );
}

const PageLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bg};
`;

const EditorHeader = styled.header`
  height: 56px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  flex-shrink: 0;
  z-index: 10;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  text-decoration: none;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: ${({ theme }) => theme.colors.border};
`;

const SurveyTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  flex: 1;
`;

const SaveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

const CanvasArea = styled.div`
  flex: 1 1 0%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  display: flex;
`;

const NotFound = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const LoadingBlock = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;
