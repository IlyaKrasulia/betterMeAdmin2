import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@shared/ui/Button";
import {
  useDagStore,
  selectSelectedNode,
  selectSelectedEdge,
} from "../store/dag.store";
import { AttributeKeyOption } from "@shared/types/dag.types";
import { NodeType } from "@shared/types/dag.types";
import {
  EdgeProperties,
  EntryNodeSection,
  InfoProperties,
  OfferProperties,
  QuestionProperties,
} from "./PanelStates";

export function PropertiesPanel({
  attributeKeys,
}: {
  attributeKeys: AttributeKeyOption[];
}) {
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
            {selectedNode && <EntryNodeSection nodeId={selectedNode.id} />}
            {selectedNode && selectedNode.type === NodeType.Question && (
              <QuestionProperties node={selectedNode} />
            )}
            {selectedNode && selectedNode.type === NodeType.Info && (
              <InfoProperties node={selectedNode} />
            )}
            {selectedNode && selectedNode.type === NodeType.Offer && (
              <OfferProperties node={selectedNode} />
            )}
            {selectedEdge && (
              <EdgeProperties
                edge={selectedEdge}
                attributeKeys={attributeKeys}
              />
            )}
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
