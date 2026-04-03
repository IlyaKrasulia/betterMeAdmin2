import { useMemo, useState } from "react";
import styled, { useTheme } from "styled-components";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Eye,
  TrendingUp,
  GitBranch,
  HelpCircle,
  FileText,
  Tag,
  Activity,
  Award,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@shared/ui/Button";
import { Spinner } from "@shared/ui/Spinner";
import { useFlow } from "@features/flows/hooks/useFlows";
import { formatDate, formatNumber } from "@shared/utils/format";
import type { FlowNodeDto, FlowEdgeDto } from "@shared/types/api.types";

// ─── Constants ───────────────────────────────────────────────────────────────

const OFFERS_INITIAL_SHOW = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Backend returns rates as already-multiplied percentages (e.g. 72.73 = 72.73%) */
function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Build the most popular path by following the highest-traffic edges from entry node */
function buildPopularPath(
  entryNodeId: string | null,
  nodes: FlowNodeDto[],
  edges: FlowEdgeDto[]
): FlowNodeDto[] {
  if (!entryNodeId) return [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const path: FlowNodeDto[] = [];
  const visited = new Set<string>();
  let currentId: string | null = entryNodeId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = nodeMap.get(currentId);
    if (!node) break;
    path.push(node);

    const outgoing = edges.filter((e) => e.sourceNodeId === currentId);
    if (outgoing.length === 0) break;

    let bestTarget: string | null = null;
    let bestCount = -1;
    for (const edge of outgoing) {
      const target = nodeMap.get(edge.targetNodeId);
      const count = target?.stats?.answerCount ?? 0;
      if (count > bestCount) {
        bestCount = count;
        bestTarget = edge.targetNodeId;
      }
    }
    currentId = bestTarget;
  }
  return path;
}

/** Gather offer stats from offer nodes */
function gatherOfferStats(nodes: FlowNodeDto[]) {
  const offers: {
    name: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
  }[] = [];

  for (const node of nodes) {
    if (node.type !== "Offer") continue;
    for (const no of node.nodeOffers) {
      offers.push({
        name: no.offer?.name || node.title || "Unnamed Offer",
        impressions: node.stats?.offerImpressions ?? 0,
        conversions: node.stats?.offerConversions ?? 0,
        conversionRate: node.stats?.offerConversionRate ?? 0,
      });
    }
    if (node.nodeOffers.length === 0 && (node.stats?.offerImpressions ?? 0) > 0) {
      offers.push({
        name: node.title || "Unnamed Offer",
        impressions: node.stats?.offerImpressions ?? 0,
        conversions: node.stats?.offerConversions ?? 0,
        conversionRate: node.stats?.offerConversionRate ?? 0,
      });
    }
  }

  offers.sort((a, b) => b.impressions - a.impressions);
  const totalImpressions = offers.reduce((sum, o) => sum + o.impressions, 0);
  return { offers, totalImpressions };
}

/** Build drop-off ranking from nodes */
function buildDropOffRanking(nodes: FlowNodeDto[]) {
  return nodes
    .filter((n) => (n.stats?.droppedOffCount ?? 0) > 0 && n.type === "Question")
    .map((n) => {
      const total = (n.stats!.answerCount ?? 0) + (n.stats!.droppedOffCount ?? 0);
      return {
        id: n.id,
        title: n.title || "Untitled",
        type: n.type,
        dropOffs: n.stats!.droppedOffCount,
        total,
        rate: total > 0 ? (n.stats!.droppedOffCount / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.rate - a.rate);
}

// ─── Node type helpers ───────────────────────────────────────────────────────

function nodeTypeIcon(type: string) {
  switch (type) {
    case "Question": return <HelpCircle size={14} />;
    case "InfoPage": return <FileText size={14} />;
    case "Offer": return <Tag size={14} />;
    default: return <Activity size={14} />;
  }
}

function nodeTypeColor(type: string, theme: any): string {
  switch (type) {
    case "Question": return theme.colors.accent;
    case "InfoPage": return theme.colors.success;
    case "Offer": return theme.colors.warning;
    default: return theme.colors.textSecondary;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FlowStatsPage() {
  const { flowId } = useParams({ from: "/stats/$flowId" });
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: flow, isLoading, isError } = useFlow(flowId);
  const [showAllOffers, setShowAllOffers] = useState(false);

  const stats = flow?.stats;

  const nodesWithStats = useMemo(
    () => (flow?.nodes ?? []).filter((n) => (n.stats?.answerCount ?? 0) > 0),
    [flow?.nodes]
  );

  const popularPath = useMemo(
    () => buildPopularPath(flow?.entryNodeId ?? null, flow?.nodes ?? [], flow?.edges ?? []),
    [flow?.entryNodeId, flow?.nodes, flow?.edges]
  );

  const { offers, totalImpressions } = useMemo(
    () => gatherOfferStats(flow?.nodes ?? []),
    [flow?.nodes]
  );

  const dropOffRanking = useMemo(
    () => buildDropOffRanking(flow?.nodes ?? []),
    [flow?.nodes]
  );

  const visibleOffers = showAllOffers ? offers : offers.slice(0, OFFERS_INITIAL_SHOW);
  const hasMoreOffers = offers.length > OFFERS_INITIAL_SHOW;

  if (isLoading) {
    return (
      <AdminLayout>
        <CenterBlock><Spinner size={32} /></CenterBlock>
      </AdminLayout>
    );
  }

  if (isError || !flow) {
    return (
      <AdminLayout>
        <CenterBlock>
          <ErrorText>Failed to load flow statistics.</ErrorText>
          <Button variant="secondary" onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </CenterBlock>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageContent>
        <BackRow>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate({ to: "/dashboard" })}>
            Back
          </Button>
        </BackRow>

        <PageHeader>
          <TitleBlock>
            <PageTitle>{flow.name}</PageTitle>
            <PageSubtitle>Analytics &amp; Statistics</PageSubtitle>
          </TitleBlock>
          {stats?.lastSessionAt && (
            <LastSession>
              <Clock size={13} />
              Last session: {formatDate(stats.lastSessionAt)}
            </LastSession>
          )}
        </PageHeader>

        {/* ── Overview ──────────────────────────────────────────────────── */}
        <SectionTitle>Overview</SectionTitle>
        <KpiGrid>
          {[
            { label: "Total Sessions", value: formatNumber(stats?.totalSessions ?? 0), color: theme.colors.accent, icon: <Users size={18} /> },
            { label: "Completed", value: formatNumber(stats?.completedSessions ?? 0), color: theme.colors.success, icon: <CheckCircle2 size={18} /> },
            { label: "Abandoned", value: formatNumber(stats?.abandonedSessions ?? 0), color: theme.colors.error, icon: <XCircle size={18} /> },
            { label: "In Progress", value: formatNumber(stats?.inProgressSessions ?? 0), color: theme.colors.warning, icon: <Clock size={18} /> },
            { label: "Completion Rate", value: pct(stats?.completionRate ?? 0), color: theme.colors.success, icon: <TrendingUp size={18} /> },
            { label: "Abandon Rate", value: pct(stats?.abandonRate ?? 0), color: theme.colors.error, icon: <TrendingUp size={18} /> },
          ].map((kpi, i) => (
            <KpiCard key={kpi.label} $index={i} $color={kpi.color}>
              <KpiIconWrap $color={kpi.color}>{kpi.icon}</KpiIconWrap>
              <KpiValue>{kpi.value}</KpiValue>
              <KpiLabel>{kpi.label}</KpiLabel>
            </KpiCard>
          ))}
        </KpiGrid>

        {/* ── Flow Structure (inline) ──────────────────────────────────── */}
        <StructureRow>
          <StructureChip><HelpCircle size={13} color={theme.colors.accent} />{stats?.questionCount ?? 0} Questions</StructureChip>
          <StructureChip><FileText size={13} color={theme.colors.success} />{stats?.infoPageCount ?? 0} Info Pages</StructureChip>
          <StructureChip><Tag size={13} color={theme.colors.warning} />{stats?.offerNodeCount ?? 0} Offers</StructureChip>
          <StructureChip><GitBranch size={13} color={theme.colors.textTertiary} />{stats?.edgeCount ?? 0} Edges</StructureChip>
        </StructureRow>

        {/* ── Offer Performance ─────────────────────────────────────────── */}
        <SectionTitle><Eye size={18} /> Offer Performance</SectionTitle>
        <OfferKpiRow>
          <OfferKpiCard><OfferKpiValue>{formatNumber(stats?.totalOfferImpressions ?? 0)}</OfferKpiValue><OfferKpiLabel>Impressions</OfferKpiLabel></OfferKpiCard>
          <OfferKpiCard><OfferKpiValue>{formatNumber(stats?.totalOfferConversions ?? 0)}</OfferKpiValue><OfferKpiLabel>Conversions</OfferKpiLabel></OfferKpiCard>
          <OfferKpiCard><OfferKpiValue>{pct(stats?.offerConversionRate ?? 0)}</OfferKpiValue><OfferKpiLabel>Conversion Rate</OfferKpiLabel></OfferKpiCard>
        </OfferKpiRow>

        {offers.length > 0 && (
          <OfferTable>
            <OfferTableHeader>
              <OfferRankCell>#</OfferRankCell>
              <OfferNameCell>Offer</OfferNameCell>
              <OfferStatCell>Impressions</OfferStatCell>
              <OfferStatCell>Conversions</OfferStatCell>
              <OfferStatCell>CVR</OfferStatCell>
              <OfferShareCell>Share</OfferShareCell>
            </OfferTableHeader>
            {visibleOffers.map((offer, i) => {
              const share = totalImpressions > 0 ? offer.impressions / totalImpressions : 0;
              return (
                <OfferRow key={i} $isTop={i === 0}>
                  <OfferRankCell>
                    {i === 0 ? <Award size={15} color={theme.colors.warning} /> : i + 1}
                  </OfferRankCell>
                  <OfferNameCell>
                    {offer.name}
                    {i === 0 && <TopBadge>Top</TopBadge>}
                  </OfferNameCell>
                  <OfferStatCell>{formatNumber(offer.impressions)}</OfferStatCell>
                  <OfferStatCell>{formatNumber(offer.conversions)}</OfferStatCell>
                  <OfferStatCell>{pct(offer.conversionRate)}</OfferStatCell>
                  <OfferShareCell>
                    <ShareBar><ShareFill style={{ width: `${share * 100}%` }} /></ShareBar>
                    <SharePct>{(share * 100).toFixed(1)}%</SharePct>
                  </OfferShareCell>
                </OfferRow>
              );
            })}
            {hasMoreOffers && (
              <ShowMoreRow>
                <Button variant="ghost" size="sm" icon={<ChevronDown size={14} />} onClick={() => setShowAllOffers((v) => !v)}>
                  {showAllOffers ? "Show Less" : `Show All (${offers.length})`}
                </Button>
              </ShowMoreRow>
            )}
          </OfferTable>
        )}

        {/* ── Drop-off Ranking ──────────────────────────────────────────── */}
        {dropOffRanking.length > 0 && (
          <>
            <SectionTitle><AlertTriangle size={18} /> Drop-off Hotspots</SectionTitle>
            <DropOffList>
              {dropOffRanking.map((node, i) => (
                <DropOffItem key={node.id} $rank={i}>
                  <DropOffRank>{i + 1}</DropOffRank>
                  <DropOffInfo>
                    <DropOffNodeHeader>
                      <NodeTypeBadge $color={nodeTypeColor(node.type, theme)}>
                        {nodeTypeIcon(node.type)}
                        {node.type}
                      </NodeTypeBadge>
                      <DropOffTitle>{node.title}</DropOffTitle>
                    </DropOffNodeHeader>
                    <DropOffBarWrap>
                      <DropOffBarTrack>
                        <DropOffBarFill style={{ width: `${node.rate}%` }} />
                      </DropOffBarTrack>
                      <DropOffStats>
                        <DropOffRate>{node.rate.toFixed(1)}%</DropOffRate>
                        <DropOffCount>{node.dropOffs} of {node.total} users</DropOffCount>
                      </DropOffStats>
                    </DropOffBarWrap>
                  </DropOffInfo>
                </DropOffItem>
              ))}
            </DropOffList>
          </>
        )}

        {/* ── Most Popular Path ──────────────────────────────────────── */}
        {popularPath.length > 1 && (
          <>
            <SectionTitle><GitBranch size={18} /> Most Popular Path</SectionTitle>
            <PathContainer>
              {popularPath.map((node, i) => (
                <PathItem key={node.id}>
                  <PathNode
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    $color={nodeTypeColor(node.type, theme)}
                  >
                    <PathNodeIcon $color={nodeTypeColor(node.type, theme)}>
                      {nodeTypeIcon(node.type)}
                    </PathNodeIcon>
                    <PathNodeInfo>
                      <PathNodeTitle>{node.title || "Untitled"}</PathNodeTitle>
                      <PathNodeMeta>{node.type}</PathNodeMeta>
                    </PathNodeInfo>
                    <PathNodeCount>{formatNumber(node.stats?.answerCount ?? 0)}</PathNodeCount>
                  </PathNode>
                  {i < popularPath.length - 1 && <PathConnector />}
                </PathItem>
              ))}
            </PathContainer>
          </>
        )}

        {/* ── Per-Node Stats ─────────────────────────────────────────── */}
        {nodesWithStats.length > 0 && (
          <>
            <SectionTitle><BarChart3 size={18} /> Per-Node Statistics</SectionTitle>
            <NodeTable>
              <NodeTableHeader>
                <NTCell $w="1fr">Node</NTCell>
                <NTCell $w="80px">Type</NTCell>
                <NTCell $w="90px">Responses</NTCell>
                <NTCell $w="90px">Drop-offs</NTCell>
                <NTCell $w="120px">Drop-off %</NTCell>
              </NodeTableHeader>
              {[...nodesWithStats]
                .sort((a, b) => (b.stats?.answerCount ?? 0) - (a.stats?.answerCount ?? 0))
                .map((node) => {
                  const total = (node.stats!.answerCount) + (node.stats!.droppedOffCount);
                  const dropPct = total > 0 ? (node.stats!.droppedOffCount / total) * 100 : 0;
                  return (
                    <NodeTableRow key={node.id}>
                      <NTCell $w="1fr">
                        <NodeRowTitle>{node.title || "Untitled"}</NodeRowTitle>
                      </NTCell>
                      <NTCell $w="80px">
                        <NodeTypeBadge $color={nodeTypeColor(node.type, theme)}>
                          {nodeTypeIcon(node.type)}
                          {node.type}
                        </NodeTypeBadge>
                      </NTCell>
                      <NTCell $w="90px"><NodeStatValue>{formatNumber(node.stats!.answerCount)}</NodeStatValue></NTCell>
                      <NTCell $w="90px"><NodeStatValue>{formatNumber(node.stats!.droppedOffCount)}</NodeStatValue></NTCell>
                      <NTCell $w="120px">
                        {dropPct > 0 ? (
                          <NodeDropPctWrap>
                            <NodeDropPctBar><NodeDropPctFill style={{ width: `${dropPct}%` }} /></NodeDropPctBar>
                            <NodeDropPctLabel $danger={dropPct > 40}>{dropPct.toFixed(1)}%</NodeDropPctLabel>
                          </NodeDropPctWrap>
                        ) : (
                          <NodeStatMuted>0%</NodeStatMuted>
                        )}
                      </NTCell>
                    </NodeTableRow>
                  );
                })}
            </NodeTable>
          </>
        )}
      </PageContent>
    </AdminLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const PageContent = styled.div`
  padding: 24px 32px 40px;
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  overflow: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 16px;
  }
`;

const CenterBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 24px;
  flex: 1;
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const BackRow = styled.div`
  margin-bottom: 4px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const TitleBlock = styled.div``;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.sizes.xxl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const LastSession = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 28px 0 12px;

  &:first-of-type {
    margin-top: 0;
  }
`;

// ── KPI Cards ────────────────────────────────────────────────────────────────

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const KpiCard = styled.div<{ $index: number; $color: string }>`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${({ $color }) => $color};
  }
`;

const KpiIconWrap = styled.div<{ $color: string }>`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $color }) => `${$color}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
`;

const KpiValue = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const KpiLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

// ── Structure (inline row) ───────────────────────────────────────────────────

const StructureRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
`;

const StructureChip = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

// ── Offer Performance ────────────────────────────────────────────────────────

const OfferKpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
`;

const OfferKpiCard = styled.div`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 14px 18px;
`;

const OfferKpiValue = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const OfferKpiLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const OfferTable = styled.div`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

const OfferTableHeader = styled.div`
  display: grid;
  grid-template-columns: 36px 1fr 100px 100px 80px 130px;
  gap: 12px;
  padding: 10px 16px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const OfferRow = styled.div<{ $isTop: boolean }>`
  display: grid;
  grid-template-columns: 36px 1fr 100px 100px 80px 130px;
  gap: 6px;
  padding: 10px 16px;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $isTop, theme }) => ($isTop ? `${theme.colors.warning}08` : "transparent")};

  &:last-child {
    border-bottom: none;
  }
`;

const OfferRankCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const OfferNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TopBadge = styled.span`
  padding: 1px 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.warning};
  color: #fff;
  font-size: 9px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
`;

const OfferStatCell = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const OfferShareCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ShareBar = styled.div`
  width: 50px;
  height: 5px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.bgElevated};
  overflow: hidden;
  flex-shrink: 0;
`;

const ShareFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.colors.accent};
  border-radius: 3px;
  transition: width 0.4s ease;
`;

const SharePct = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
`;

const ShowMoreRow = styled.div`
  display: flex;
  justify-content: center;
  padding: 8px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

// ── Drop-off Ranking ─────────────────────────────────────────────────────────

const DropOffList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DropOffItem = styled.div<{ $rank: number }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  border-left: 3px solid ${({ $rank, theme }) =>
    $rank === 0 ? theme.colors.error : $rank === 1 ? theme.colors.warning : theme.colors.border};
`;

const DropOffRank = styled.div`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.bgElevated};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;
  margin-top: 2px;
`;

const DropOffInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DropOffNodeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DropOffTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DropOffBarWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DropOffBarTrack = styled.div`
  flex: 1;
  height: 6px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: 3px;
  overflow: hidden;
`;

const DropOffBarFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.colors.error};
  border-radius: 3px;
  transition: width 0.4s ease;
`;

const DropOffStats = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const DropOffRate = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.error};
`;

const DropOffCount = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

// ── Popular Path ─────────────────────────────────────────────────────────────

const PathContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const PathItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const PathNode = styled(motion.div)<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const PathNodeIcon = styled.div<{ $color: string }>`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $color }) => `${$color}15`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const PathNodeInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PathNodeTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PathNodeMeta = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textTertiary};
`;

const PathNodeCount = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  flex-shrink: 0;
`;

const PathConnector = styled.div`
  width: 2px;
  height: 14px;
  background: ${({ theme }) => theme.colors.border};
  margin-left: 24px;
`;

// ── Per-Node Stats (table) ───────────────────────────────────────────────────

const NodeTypeBadge = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  width: fit-content;
`;

const NodeTable = styled.div`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

const NodeTableHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const NodeTableRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const NTCell = styled.div<{ $w: string }>`
  width: ${({ $w }) => $w};
  flex: ${({ $w }) => ($w === "1fr" ? "1" : "none")};
  min-width: 0;
`;

const NodeRowTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NodeStatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const NodeStatMuted = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

const NodeDropPctWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const NodeDropPctBar = styled.div`
  flex: 1;
  height: 5px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: 3px;
  overflow: hidden;
`;

const NodeDropPctFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.colors.error};
  border-radius: 3px;
  transition: width 0.4s ease;
`;

const NodeDropPctLabel = styled.span<{ $danger: boolean }>`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ $danger, theme }) => ($danger ? theme.colors.error : theme.colors.textSecondary)};
  flex-shrink: 0;
  min-width: 36px;
`;
