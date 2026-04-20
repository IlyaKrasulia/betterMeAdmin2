import { useState, useRef, useCallback } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@shared/ui/Button";
import {
  useDagStore,
  selectSelectedNode,
  selectSelectedEdge,
} from "../store/dag.store";
import { NodeType } from "@shared/types/dag.types";
import {
  EdgeProperties,
  EntryNodeSection,
  InfoProperties,
  LeadCaptureProperties,
  OfferProperties,
  QuestionProperties,
  RedirectProperties,
} from "./PanelStates";

const NODE_TITLES: Partial<Record<NodeType, string>> = {
  [NodeType.Question]:    "Question",
  [NodeType.Info]:        "Info Screen",
  [NodeType.Offer]:       "Offer",
  [NodeType.LeadCapture]: "Lead Capture",
  [NodeType.Redirect]:    "Redirect",
};

const MIN_WIDTH = 220;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 280;

export function PropertiesPanel() {
  const selectedNode  = useDagStore(selectSelectedNode);
  const selectedEdge  = useDagStore(selectSelectedEdge);
  const setSelectedNode = useDagStore((s) => s.setSelectedNode);
  const setSelectedEdge = useDagStore((s) => s.setSelectedEdge);

  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);

  const isOpen = !!selectedNode || !!selectedEdge;

  const title = selectedNode
    ? `${NODE_TITLES[selectedNode.type as NodeType] ?? selectedNode.type} Node`
    : "Edge Condition";

  // ─── Resize handle ─────────────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;

      const startX     = e.clientX;
      const startWidth = panelWidth;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        // panel is on the right — dragging the left edge left = wider
        const delta    = startX - ev.clientX;
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
        setPanelWidth(newWidth);
      };

      const onMouseUp = () => {
        isResizing.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup",   onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup",   onMouseUp);
    },
    [panelWidth],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <Panel
          style={{ width: panelWidth }}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0,      opacity: 1 }}
          exit={{ x: "100%",    opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          {/* ── Drag handle (left edge) ── */}
          <ResizeHandle onMouseDown={handleResizeMouseDown} />

          <PanelHeader>
            <PanelTitle>{title}</PanelTitle>
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
            {selectedNode && selectedNode.type === NodeType.Question && (
              <QuestionProperties node={selectedNode} />
            )}
            {selectedNode && selectedNode.type === NodeType.Info && (
              <InfoProperties node={selectedNode} />
            )}
            {selectedNode && selectedNode.type === NodeType.Offer && (
              <OfferProperties node={selectedNode} />
            )}
            {selectedNode && selectedNode.type === NodeType.LeadCapture && (
              <LeadCaptureProperties node={selectedNode} />
            )}
            {selectedNode && selectedNode.type === NodeType.Redirect && (
              <RedirectProperties node={selectedNode} />
            )}
            {selectedEdge && <EdgeProperties edge={selectedEdge} />}

            {selectedNode &&
              selectedNode.type !== NodeType.Offer &&
              selectedNode.type !== NodeType.Redirect && (
                <EntryNodeSection nodeId={selectedNode.id} />
              )}
          </PanelBody>
        </Panel>
      )}
    </AnimatePresence>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Panel = styled(motion.aside)`
  /* width is set via inline style (resizable) */
  min-width: ${MIN_WIDTH}px;
  max-width: ${MAX_WIDTH}px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
`;

/**
 * Invisible 6-px strip on the left edge of the panel that becomes a
 * col-resize cursor and lights up the accent colour on hover.
 */
const ResizeHandle = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 20;
  border-left: 2px solid transparent;
  transition: border-color 0.15s;

  &:hover,
  &:active {
    border-color: ${({ theme }) => theme.colors.accent};
  }
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
