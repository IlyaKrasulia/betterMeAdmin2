import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { ReactFlowProvider } from "reactflow";
import { ArrowLeft, Save, Eye, Circle, Globe, BarChart3 } from "lucide-react";
import { Button } from "@shared/ui/Button";
import { Badge } from "@shared/ui/Badge";
import { Spinner } from "@shared/ui/Spinner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { DagCanvas } from "@features/dag-editor/components/DagCanvas";
import { useDagStore } from "@features/dag-editor/store/dag.store";
import { useFlow, usePublishFlow } from "@features/flows/hooks/useFlows";
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
import { redirectLinksApi } from "@api/redirect-links.api";
import { leadCaptureFieldsApi } from "@api/lead-capture-fields.api";
import { useQueryClient } from "@tanstack/react-query";
import type { FlowNodeDto, FlowEdgeDto } from "@shared/types/api.types";
import { NodeType } from "@shared/types/dag.types";
import type {
  QuestionNodeData,
  RedirectNodeData,
  LeadCaptureNodeData,
  EdgeConditions,
  DagNodeData,
} from "@shared/types/dag.types";
import type { Edge, Node } from "reactflow";
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
  const { mutateAsync: createNode, error: createNodeError } = useCreateNode();
  const { mutateAsync: updateNode, error: updateNodeError } = useUpdateNode();
  const { mutateAsync: updateNodePosition, error: updateNodePositionError } =
    useUpdateNodePosition();
  const { mutateAsync: deleteNode, error: deleteNodeError } = useDeleteNode();
  const { mutateAsync: createEdge, error: createEdgeError } = useCreateEdge();
  const { mutateAsync: updateEdge, error: updateEdgeError } = useUpdateEdge();
  const { mutateAsync: deleteEdge, error: deleteEdgeError } = useDeleteEdge();

  const allErrors = [
    createNodeError,
    updateNodeError,
    updateNodePositionError,
    deleteNodeError,
    createEdgeError,
    updateEdgeError,
    deleteEdgeError,
  ];

  // Show the first error that occurs
  const activeError = allErrors.find((e) => e !== null) as {
    response?: { data?: { message?: string } };
  };

  // ── DAG store ──────────────────────────────────────────────────────────
  const loadSurvey = useDagStore((s) => s.loadSurvey);
  const nodes = useDagStore((s) => s.nodes);
  const edges = useDagStore((s) => s.edges);
  const isDirty = useDagStore((s) => s.isDirty);
  const markSaved = useDagStore((s) => s.markSaved);
  const setAllIsLocal = useDagStore((s) => s.setAllIsLocal);

  // Track the original API data for diffing on save
  const originalNodesRef = useRef<FlowNodeDto[]>([]);
  const originalEdgesRef = useRef<FlowEdgeDto[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { mutateAsync: publishFlow, isPending: isPublishing } = usePublishFlow();

  // ── Load flow into DAG store on initial fetch ──────────────────────────
  useEffect(() => {
    if (flow) {
      const safeNodes = flow.nodes || [];
      const safeEdges = flow.edges || [];

      originalNodesRef.current = safeNodes;
      originalEdgesRef.current = safeEdges;

      console.log(safeEdges, ' => safe edges');
      

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

  const toConditionsJson = (
    edge: Edge,
    operator: "AND" | "OR",
  ): string | null => {
    const cond = getEdgeConditions(edge);

    if (cond.always || cond.rules.length === 0) return null;

    const formattedData = {
      operator: operator,
      rules: cond.rules.map((r) => {
        const base: any = {
          AttributeKey: r.attributeKey,
          Operator: r.operator ?? "eq",
          Value: r.value,
        };

        if (r.operator === "between" && r.valueTo !== undefined) {
          base.ValueTo = r.valueTo;
        }

        return base;
      }),
    };

    return JSON.stringify(formattedData, null, 2);
  };

  const syncOptionsForNode = async (
    node: Node<DagNodeData>,
    origNode: FlowNodeDto,
  ) => {
    const qData = node.data as QuestionNodeData;
    const origOptions = origNode.options ?? [];

    const origOptionMap = new Map(origOptions.map((o) => [o.id, o]));
    const currentOptionIds = new Set(qData.options.map((o) => o.id));

    // 1. Видаляємо ті, яких більше немає в канвасі
    const toDelete = origOptions.filter((o) => !currentOptionIds.has(o.id));
    await Promise.all(
      toDelete.map((o) => optionsApi.deleteOption(node.id, o.id)),
    );

    // 2. ОБНОВЛЯЄМО існуючі та Створюємо нові
    // Проходимо по поточному масиву опцій, щоб індекс i відповідав displayOrder
    for (let i = 0; i < qData.options.length; i++) {
      const opt = qData.options[i];
      const orig = origOptionMap.get(opt.id);

      if (orig) {
        // Якщо опція була — перевіряємо, чи змінилася вона
        const hasChanged =
          opt.label !== orig.label ||
          opt.value !== orig.value ||
          (opt.scoreDelta ?? 0) !== (orig.scoreDelta ?? 0) ||
          i !== orig.displayOrder;

        if (hasChanged) {
          await optionsApi.updateOption(node.id, opt.id, {
            label: opt.label,
            value: opt.value,
            displayOrder: i,
            scoreDelta: opt.scoreDelta ?? 0,
          });
        }
      } else {
        // Якщо опції не було в оригіналі — створюємо
        await optionsApi.createOption(node.id, {
          label: opt.label,
          value: opt.value,
          displayOrder: i,
          scoreDelta: opt.scoreDelta ?? 0,
        });
      }
    }
  };

  const syncRedirectLinksForNode = async (
    node: Node<DagNodeData>,
    origNode: FlowNodeDto,
  ) => {
    const rdData = node.data as RedirectNodeData
    const origLinks = origNode.redirect?.links ?? []

    const origLinkMap = new Map(origLinks.map((l) => [l.id, l]))
    const currentLinkIds = new Set(
      rdData.links.filter((l) => l.id).map((l) => l.id!),
    )

    // 1. Delete links removed from canvas
    const toDelete = origLinks.filter((l) => !currentLinkIds.has(l.id))
    await Promise.all(
      toDelete.map((l) => redirectLinksApi.delete(node.id, l.id)),
    )

    // 2. Update existing and create new links
    for (let i = 0; i < rdData.links.length; i++) {
      const link = rdData.links[i]
      const orig = link.id ? origLinkMap.get(link.id) : undefined

      if (orig) {
        const hasChanged =
          link.label !== orig.label ||
          link.url !== orig.url ||
          i !== orig.displayOrder

        if (hasChanged) {
          await redirectLinksApi.update(node.id, orig.id, {
            label: link.label,
            url: link.url,
            displayOrder: i,
          })
        }
      } else {
        await redirectLinksApi.create(node.id, {
          label: link.label,
          url: link.url,
          displayOrder: i,
        })
      }
    }
  }

  const syncLeadCaptureFieldsForNode = async (
    node: Node<DagNodeData>,
    origNode: FlowNodeDto,
  ) => {
    const lcData = node.data as LeadCaptureNodeData
    const origFields = origNode.leadCapture?.fields ?? []

    const origFieldMap = new Map(origFields.map((f) => [f.fieldType, f]))
    const currentFieldTypes = new Set(lcData.fields.map((f) => f.fieldType))

    // 1. Delete fields removed from canvas (never deletes Email — backend enforces)
    const toDelete = origFields.filter((f) => !currentFieldTypes.has(f.fieldType as never))
    await Promise.all(toDelete.map((f) => leadCaptureFieldsApi.remove(node.id, f.fieldType)))

    // 2. Add new fields and update changed ones
    for (let i = 0; i < lcData.fields.length; i++) {
      const field = lcData.fields[i]
      const orig = origFieldMap.get(field.fieldType)

      if (!orig) {
        await leadCaptureFieldsApi.add(node.id, {
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          displayOrder: i,
          placeholder: field.placeholder || undefined,
        })
      } else {
        const hasChanged =
          field.isRequired !== orig.isRequired ||
          (field.placeholder ?? null) !== orig.placeholder ||
          i !== orig.displayOrder

        if (hasChanged) {
          await leadCaptureFieldsApi.update(node.id, field.fieldType, {
            isRequired: field.isRequired,
            displayOrder: i,
            placeholder: field.placeholder || undefined,
          })
        }
      }
    }

    // 3. Reorder if any displayOrder changed
    const orderChanged = lcData.fields.some((f, i) => {
      const orig = origFieldMap.get(f.fieldType)
      return orig && orig.displayOrder !== i
    })
    if (orderChanged) {
      await leadCaptureFieldsApi.reorder(node.id, {
        items: lcData.fields.map((f, i) => ({ fieldType: f.fieldType, displayOrder: i })),
      })
    }
  }

  // ── Save handler — diffs current canvas state against the loaded API data ──
  const handleSave = async () => {
    setIsSaving(true);
    const { touched } = useDagStore.getState();

    try {
      const originalNodeMap = new Map(
        originalNodesRef.current.map((n) => [n.id, n]),
      );
      const originalEdgeMap = new Map(
        originalEdgesRef.current.map((e) => [e.id, e]),
      );

      // Карта для зіставлення тимчасових UUID нових nod з ID від сервера
      const clientToServerId = new Map<string, string>();

      // ── 1. Створення та Оновлення нoд ──────────────────────────────────────
      // Ітеруємося лише за тими нодами, які реально змінилися або створені
      const nodesToProcess = nodes.filter((n) => touched.nodes.has(n.id));

      for (const node of nodesToProcess) {
        if (!originalNodeMap.has(node.id)) {
          const result = await createNode({
            flowId: surveyId,
            data: nodeToCreateRequest(node),
          });
          clientToServerId.set(node.id, result.id);

          // Опції для нових питань
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
        } else {
          // ЦЕ СУЩЕСТВУЮЧА НОДА (оновлюємо контент та позицію)
          // Використовуємо Promise.all для паралельного виконання контенту та позиції
          await Promise.all([
            updateNode({
              flowId: surveyId,
              nodeId: node.id,
              data: nodeToUpdateRequest(node),
            }),
            updateNodePosition({
              flowId: surveyId,
              nodeId: node.id,
              data: {
                positionX: Math.round(node.position.x),
                positionY: Math.round(node.position.y),
              },
            }),
          ]);

          if (node.data.type === NodeType.Question) {
            await syncOptionsForNode(node, originalNodeMap.get(node.id)!);
          }

          if (node.data.type === NodeType.Redirect) {
            await syncRedirectLinksForNode(node, originalNodeMap.get(node.id)!);
          }

          if (node.data.type === NodeType.LeadCapture) {
            await syncLeadCaptureFieldsForNode(node, originalNodeMap.get(node.id)!);
          }
        }
      }

      // ── 2. Удаление нod ──────────────────────────────────────────────────
      if (touched.deletedNodes.size > 0) {
        await Promise.all(
          Array.from(touched.deletedNodes).map((id) =>
            // Видаляємо лише ті, що реально були на бекенді
            originalNodeMap.has(id)
              ? deleteNode({ flowId: surveyId, nodeId: id })
              : Promise.resolve(),
          ),
        );
      }

      // Допоміжна функція отримання серверного ID
      const resolveNodeId = (id: string) => clientToServerId.get(id) ?? id;

      // ── 3. Створення та Оновлення ребер ────────────────────────────────────
      const edgesToProcess = edges.filter((e) => touched.edges.has(e.id));

      await Promise.all(
        edgesToProcess.map((edge) => {
          const cond = getEdgeConditions(edge);
          const operator = (cond.operator ?? "AND") as "AND" | "OR";
          if (!originalEdgeMap.has(edge.id)) {
            // НОВЕ РЕБРО
            return createEdge({
              flowId: surveyId,
              data: {
                sourceNodeId: resolveNodeId(edge.source),
                targetNodeId: resolveNodeId(edge.target),
                priority: cond.priority,
                conditionsJson: toConditionsJson(edge, operator),
              },
            });
          } else {
            // ОНОвлення існуючого ребра
            return updateEdge({
              flowId: surveyId,
              edgeId: edge.id,
              data: {
                priority: cond.priority,
                conditionsJson: toConditionsJson(edge, operator),
              },
            });
          }
        }),
      );

      // ── 4. Видалення ребер ────────────────────────────────────────────────
      if (touched.deletedEdges.size > 0) {
        await Promise.all(
          Array.from(touched.deletedEdges).map((id) =>
            originalEdgeMap.has(id)
              ? deleteEdge({ flowId: surveyId, edgeId: id })
              : Promise.resolve(),
          ),
        );
      }

      // ── 5. Перезагрузка та сброс стану ────────────────────────────────
      const updated = await queryClient.fetchQuery({
        queryKey: ["flows", surveyId],
        staleTime: 0,
      });

      if (updated) {
        // ... оновлюємо локальний стан новими даними з сервера
        markSaved(); // СБРОС touched  і isDirty
        setAllIsLocal(false);
        toast.success("Survey saved!");
      }
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(activeError?.response?.data?.message || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = () => {
    navigate({ to: "/survey/$surveyId", params: { surveyId } });
  };

  const handlePublish = async () => {
    try {
      await publishFlow(surveyId);
      toast.success("Flow published!");
    } catch {
      toast.error("Failed to publish flow.");
    }
  };

  const handleStats = () => {
    navigate({ to: "/stats/$flowId", params: { flowId: surveyId } });
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
          variant="ghost"
          size="sm"
          icon={<BarChart3 size={14} />}
          onClick={handleStats}
        >
          Stats
        </Button>

        {flow.isPublished ? (
          <Button
            variant="secondary"
            size="sm"
            icon={<Eye size={14} />}
            onClick={handleTest}
          >
            Preview
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            icon={isPublishing ? <Spinner size={14} /> : <Globe size={14} />}
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? "Publishing…" : "Publish"}
          </Button>
        )}

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
