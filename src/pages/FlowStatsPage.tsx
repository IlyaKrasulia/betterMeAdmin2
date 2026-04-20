import { useMemo, useState } from "react";
import styled, { useTheme, keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
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
  Timer,
  ClipboardList,
  CornerRightUp,
} from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@shared/ui/Button";
import { Spinner } from "@shared/ui/Spinner";
import { useFlow } from "@features/flows/hooks/useFlows";
import { formatDate, formatNumber } from "@shared/utils/format";
import { DONUT_COLORS, D_CX, D_CY, D_R, D_r, D_GAP, dSectorRaw, dSector } from "@shared/utils/donut";
import type { FlowNodeDto } from "@shared/types/api.types";
import { FlowPathSankey } from "@features/analytics/components/FlowPathSankey";
import { LeadsTable } from "@features/leads/components/LeadsTable";

// ─── Constants ───────────────────────────────────────────────────────────────

const OFFERS_INITIAL_SHOW = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Backend returns rates as already-multiplied percentages (e.g. 72.73 = 72.73%) */
function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Parse "hh:mm:ss.fffffff" into a human-readable string like "1m 23s" or "45.3s" */
function formatDuration(raw: string | null | undefined): string {
  if (!raw) return "—";
  const parts = raw.split(":");
  if (parts.length < 3) return "—";
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parseFloat(parts[2]);
  const totalSeconds = h * 3600 + m * 60 + s;
  if (totalSeconds === 0) return "0s";
  if (h > 0) return `${h}h ${m}m ${Math.round(s)}s`;
  if (m > 0) return `${m}m ${Math.round(s)}s`;
  return `${s < 10 ? s.toFixed(1) : Math.round(s)}s`;
}


/** Gather offer stats from offer nodes */
function gatherOfferStats(nodes: FlowNodeDto[]) {
  const offers: {
    name: string;
    offerId: string | null;
    impressions: number;
    conversions: number;
    conversionRate: number;
  }[] = [];

  for (const node of nodes) {
    if (node.type !== "Offer") continue;
    for (const no of node.nodeOffers) {
      offers.push({
        name: no.offer?.name || node.title || "Unnamed Offer",
        offerId: no.offer?.id ?? null,
        impressions: node.stats?.offerImpressions ?? 0,
        conversions: node.stats?.offerConversions ?? 0,
        conversionRate: node.stats?.offerConversionRate ?? 0,
      });
    }
    if (node.nodeOffers.length === 0 && (node.stats?.offerImpressions ?? 0) > 0) {
      offers.push({
        name: node.title || "Unnamed Offer",
        offerId: null,
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
    .filter((n) => (n.stats?.droppedOffCount ?? 0) > 0 && (n.type === "Question" || n.type === "LeadCapture" || n.type === "InfoPage"))
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
    case "Question":    return <HelpCircle size={14} />;
    case "InfoPage":    return <FileText size={14} />;
    case "Offer":       return <Tag size={14} />;
    case "LeadCapture": return <ClipboardList size={14} />;
    case "Redirect":    return <CornerRightUp size={14} />;
    default:            return <Activity size={14} />;
  }
}

function nodeTypeColor(type: string, theme: any): string {
  switch (type) {
    case "Question":    return theme.colors.accent;
    case "InfoPage":    return theme.colors.success;
    case "Offer":       return theme.colors.warning;
    case "LeadCapture": return '#3B82F6';
    case "Redirect":    return '#EF4444';
    default:            return theme.colors.textSecondary;
  }
}

// ─── Animation variants ───────────────────────────────────────────────────────

const page = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const } },
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FlowStatsPage() {
  const { flowId } = useParams({ from: "/stats/$flowId" });
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: flow, isLoading, isError } = useFlow(flowId);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [hoveredSector, setHoveredSector] = useState<number | null>(null);

  const stats = flow?.stats;

  const nodesWithStats = useMemo(
    () => (flow?.nodes ?? []).filter((n) => (n.stats?.answerCount ?? 0) > 0),
    [flow?.nodes]
  );

  const popularPathData = useMemo(() => {
    const paths = flow?.pathDistribution ?? [];
    if (paths.length === 0) return null;
    return paths.reduce((best, p) => (p.count > best.count ? p : best), paths[0]);
  }, [flow?.pathDistribution]);

  const { offers, totalImpressions } = useMemo(
    () => gatherOfferStats(flow?.nodes ?? []),
    [flow?.nodes]
  );

  const nodeStatsMap = useMemo(() => {
    const map: Record<string, { answerCount: number; droppedOffCount: number; offerImpressions?: number; offerConversions?: number; offerConversionRate?: number; avgAnswerDuration?: string | null }> = {};
    for (const n of flow?.nodes ?? []) {
      if (n.stats) map[n.id] = { answerCount: n.stats.answerCount ?? 0, droppedOffCount: n.stats.droppedOffCount ?? 0, offerImpressions: n.stats.offerImpressions, offerConversions: n.stats.offerConversions, offerConversionRate: n.stats.offerConversionRate, avgAnswerDuration: n.stats.avgAnswerDuration };
    }
    return map;
  }, [flow?.nodes]);

  const dropOffRanking = useMemo(
    () => buildDropOffRanking(flow?.nodes ?? []),
    [flow?.nodes]
  );

  const visibleOffers = showAllOffers ? offers : offers.slice(0, OFFERS_INITIAL_SHOW);
  const hasMoreOffers = offers.length > OFFERS_INITIAL_SHOW;

  const sectors = useMemo(() => {
    if (totalImpressions === 0) return [];
    let angle = -Math.PI / 2;
    return offers.map((offer, i) => {
      const span = (offer.impressions / totalImpressions) * Math.PI * 2;
      const start = angle;
      angle += span;
      return { start, end: angle, span, offer, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    });
  }, [offers, totalImpressions]);

  return (
    <AdminLayout>
      <AnimatePresence mode="wait">

      {/* ── Skeleton — shown immediately while loading ─────────────── */}
      {isLoading && <StatsPageSkeleton key="skeleton" />}

      {/* ── Error state ────────────────────────────────────────────── */}
      {!isLoading && (isError || !flow) && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <CenterBlock>
            <ErrorText>Failed to load flow statistics.</ErrorText>
            <Button variant="secondary" onClick={() => navigate({ to: "/dashboard" })}>
              Back to Dashboard
            </Button>
          </CenterBlock>
        </motion.div>
      )}

      {/* ── Real content ───────────────────────────────────────────── */}
      {!isLoading && flow && (
      <PageContent key="content" variants={page} initial="hidden" animate="show">
        <Section variants={item}>
        <BackRow>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => window.history.back()}>
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

        </Section>

        {/* ── Overview ──────────────────────────────────────────────────── */}
        <Section variants={item}>
        <SectionTitle>Overview</SectionTitle>
        <KpiGrid>
          {[
            { label: "Total Sessions",   value: formatNumber(stats?.totalSessions ?? 0),     color: theme.colors.accent,  icon: <Users size={15} /> },
            { label: "Completed",        value: formatNumber(stats?.completedSessions ?? 0),  color: theme.colors.success, icon: <CheckCircle2 size={15} /> },
            { label: "Abandoned",        value: formatNumber(stats?.abandonedSessions ?? 0),  color: theme.colors.error,   icon: <XCircle size={15} /> },
            { label: "In Progress",      value: formatNumber(stats?.inProgressSessions ?? 0), color: theme.colors.warning, icon: <Clock size={15} /> },
            { label: "Completion Rate",  value: pct(stats?.completionRate ?? 0),              color: theme.colors.success, icon: <TrendingUp size={15} /> },
            { label: "Abandon Rate",     value: pct(stats?.abandonRate ?? 0),                 color: theme.colors.error,   icon: <TrendingUp size={15} /> },
          ].map((kpi, i) => (
            <KpiCard key={kpi.label} $index={i} $color={kpi.color}>
              <KpiIconWrap $color={kpi.color}>{kpi.icon}</KpiIconWrap>
              <KpiContent>
                <KpiValue>{kpi.value}</KpiValue>
                <KpiLabel>{kpi.label}</KpiLabel>
              </KpiContent>
            </KpiCard>
          ))}
        </KpiGrid>

        </Section>

        {/* ── Flow Structure (inline) ──────────────────────────────────── */}
        <Section variants={item}>
        <StructureRow>
          <StructureChip><HelpCircle size={13} color={theme.colors.accent} />{stats?.questionCount ?? 0} Questions</StructureChip>
          <StructureChip><FileText size={13} color={theme.colors.success} />{stats?.infoPageCount ?? 0} Info Pages</StructureChip>
          <StructureChip><Tag size={13} color={theme.colors.warning} />{stats?.offerNodeCount ?? 0} Offers</StructureChip>
          <StructureChip><GitBranch size={13} color={theme.colors.textTertiary} />{stats?.edgeCount ?? 0} Edges</StructureChip>
        </StructureRow>

        </Section>

        {/* ── All User Paths (moved up) ─────────────────────────────────── */}
        {(flow.pathDistribution ?? []).length > 0 && (
          <Section variants={item}>
          <>
            <SectionTitle><GitBranch size={18} /> All User Paths</SectionTitle>
            <FlowPathSankey paths={flow.pathDistribution!} nodeStatsMap={nodeStatsMap} />
          </>
          </Section>
        )}

        {/* ── Session Timing ────────────────────────────────────────────── */}
        <Section variants={item}>
        <SectionTitle><Timer size={18} /> Session Timing</SectionTitle>
        <TimingGrid>
          {[
            {
              label: "Session Duration", $color: theme.colors.accent,
              items: [
                { label: "Avg",    value: formatDuration(stats?.avgSessionDuration),    $c: theme.colors.accent  },
                { label: "Median", value: formatDuration(stats?.medianSessionDuration), $c: theme.colors.info    },
                { label: "Min",    value: formatDuration(stats?.minSessionDuration),    $c: theme.colors.success },
                { label: "Max",    value: formatDuration(stats?.maxSessionDuration),    $c: theme.colors.warning },
              ],
            },
            {
              label: "Answer Duration", $color: theme.colors.info,
              items: [
                { label: "Avg",    value: formatDuration(stats?.avgAnswerDuration),    $c: theme.colors.accent  },
                { label: "Median", value: formatDuration(stats?.medianAnswerDuration), $c: theme.colors.info    },
                { label: "Min",    value: formatDuration(stats?.minAnswerDuration),    $c: theme.colors.success },
                { label: "Max",    value: formatDuration(stats?.maxAnswerDuration),    $c: theme.colors.warning },
              ],
            },
          ].map((group) => (
            <TimingGroup key={group.label} $color={group.$color}>
              <TimingGroupLabel $color={group.$color}>{group.label}</TimingGroupLabel>
              <TimingRow>
                {group.items.map((item) => (
                  <TimingCell key={item.label}>
                    <TimingValue $color={item.$c}>{item.value}</TimingValue>
                    <TimingLabel>{item.label}</TimingLabel>
                  </TimingCell>
                ))}
              </TimingRow>
            </TimingGroup>
          ))}
        </TimingGrid>

        </Section>

        {/* ── Offer Performance ─────────────────────────────────────────── */}
        <Section variants={item}>
        <SectionTitle><Eye size={18} /> Offer Performance</SectionTitle>
        <OfferKpiRow>
          {(() => {
            const cvr = stats?.offerConversionRate ?? 0;
            const cvrColor = cvr >= 50 ? theme.colors.success : cvr >= 20 ? theme.colors.warning : theme.colors.error;
            return [
              { label: "Impressions",     value: formatNumber(stats?.totalOfferImpressions ?? 0), color: theme.colors.accent,  icon: <Eye size={16} /> },
              { label: "Conversions",     value: formatNumber(stats?.totalOfferConversions ?? 0),  color: theme.colors.success, icon: <CheckCircle2 size={16} /> },
              { label: "Conversion Rate", value: pct(cvr),                                         color: cvrColor,             icon: <TrendingUp size={16} /> },
            ].map((k) => (
              <OfferKpiCard key={k.label} $color={k.color}>
                <OfferKpiIcon $color={k.color}>{k.icon}</OfferKpiIcon>
                <div>
                  <OfferKpiValue $color={k.color}>{k.value}</OfferKpiValue>
                  <OfferKpiLabel>{k.label}</OfferKpiLabel>
                </div>
              </OfferKpiCard>
            ));
          })()}
        </OfferKpiRow>

        {sectors.length > 0 && (
          <OfferVizSection>
            <OfferVizRow>
              <OfferDonutBox>
                <svg width={240} height={240} viewBox="0 0 240 240" style={{ overflow: 'visible' }}>
                  {sectors.map((s, i) => {
                    const isHov = hoveredSector === i;
                    const anyHov = hoveredSector !== null;
                    const span = s.end - s.start;
                    const hg = Math.min(D_GAP / 2, span * 0.08);
                    const a1 = s.start + hg, a2 = s.end - hg;
                    const convFrac = s.offer.conversionRate / 100;
                    const mid = a1 + (a2 - a1) * convFrac;

                    return (
                      <motion.g
                        key={i}
                        animate={{
                          opacity: anyHov && !isHov ? 0.22 : 1,
                          scale: isHov ? 1.06 : 1,
                        }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        style={{ transformOrigin: `${D_CX}px ${D_CY}px`, cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSector(i)}
                        onMouseLeave={() => setHoveredSector(null)}
                      >
                        {/* Base sector — fades out on hover */}
                        <motion.path
                          d={dSector(s.start, s.end)}
                          fill={s.color}
                          animate={{ opacity: isHov ? 0 : 1 }}
                          transition={{ duration: 0.18 }}
                        />
                        {/* Converted arc — fades in on hover */}
                        <AnimatePresence>
                          {isHov && convFrac > 0.005 && (
                            <motion.path
                              key="conv"
                              d={dSectorRaw(a1, mid, D_R + 6, D_r - 4)}
                              fill="#10b981"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </AnimatePresence>
                        {/* Not-converted arc — fades in on hover */}
                        <AnimatePresence>
                          {isHov && convFrac < 0.995 && (
                            <motion.path
                              key="noconv"
                              d={dSectorRaw(mid, a2, D_R + 6, D_r - 4)}
                              fill={s.color}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.38 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </AnimatePresence>
                      </motion.g>
                    );
                  })}

                  {/* Center label — crossfades between default and hover state */}
                  <AnimatePresence mode="wait">
                    {hoveredSector !== null ? (() => {
                      const o = sectors[hoveredSector].offer;
                      const short = o.name.length > 18 ? o.name.slice(0, 16) + '…' : o.name;
                      return (
                        <motion.g key="hov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                          <text x={D_CX} y={D_CY - 14} textAnchor="middle" fill={theme.colors.textPrimary} fontSize="11" fontWeight="600" fontFamily="inherit">{short}</text>
                          <text x={D_CX} y={D_CY + 4}  textAnchor="middle" fill="#10b981" fontSize="18" fontWeight="700" fontFamily="inherit">{o.conversionRate % 1 === 0 ? o.conversionRate : o.conversionRate.toFixed(1)}%</text>
                          <text x={D_CX} y={D_CY + 20} textAnchor="middle" fill={theme.colors.textTertiary} fontSize="10" fontFamily="inherit">CVR</text>
                          <text x={D_CX} y={D_CY + 36} textAnchor="middle" fill={theme.colors.textTertiary} fontSize="10" fontFamily="inherit">{o.impressions} impr.</text>
                        </motion.g>
                      );
                    })() : (
                      <motion.g key="def" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <text x={D_CX} y={D_CY - 4}  textAnchor="middle" fill={theme.colors.textPrimary} fontSize="24" fontWeight="700" fontFamily="inherit">{totalImpressions}</text>
                        <text x={D_CX} y={D_CY + 16} textAnchor="middle" fill={theme.colors.textTertiary} fontSize="11" fontFamily="inherit">impressions</text>
                      </motion.g>
                    )}
                  </AnimatePresence>
                </svg>

                {/* Split legend — fixed-height slot so it never shifts layout */}
                <DonutLegendSlot>
                  <motion.div
                    animate={{ opacity: hoveredSector !== null ? 1 : 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ pointerEvents: 'none' }}
                  >
                    {hoveredSector !== null && (
                      <DonutHoverLegend>
                        <DonutLegendRow>
                          <DonutLegendDot $color="#10b981" />
                          Converted ({sectors[hoveredSector].offer.conversionRate % 1 === 0 ? sectors[hoveredSector].offer.conversionRate : sectors[hoveredSector].offer.conversionRate.toFixed(1)}%)
                        </DonutLegendRow>
                        <DonutLegendRow>
                          <DonutLegendDot $color={sectors[hoveredSector].color} style={{ opacity: 0.5 }} />
                          Not converted ({(100 - sectors[hoveredSector].offer.conversionRate) % 1 === 0 ? (100 - sectors[hoveredSector].offer.conversionRate) : (100 - sectors[hoveredSector].offer.conversionRate).toFixed(1)}%)
                        </DonutLegendRow>
                      </DonutHoverLegend>
                    )}
                  </motion.div>
                </DonutLegendSlot>
              </OfferDonutBox>

              <OfferLegendList>
                {offers.map((offer, i) => {
                  const share = totalImpressions > 0 ? (offer.impressions / totalImpressions) * 100 : 0;
                  const color = DONUT_COLORS[i % DONUT_COLORS.length];
                  const cvr = offer.conversionRate;
                  const cvrColor = cvr >= 50 ? '#10b981' : cvr >= 20 ? '#f59e0b' : '#ef4444';
                  return (
                    <OfferLegendItem key={i}
                      $active={hoveredSector === i}
                      onMouseEnter={() => setHoveredSector(i)}
                      onMouseLeave={() => setHoveredSector(null)}
                    >
                      <OfferLegendDot $color={color} />
                      <OfferLegendName>{offer.name}</OfferLegendName>
                      <OfferLegendRight>
                        <OfferLegendPct>{share.toFixed(1)}%</OfferLegendPct>
                        <OfferCvrBadge $color={cvrColor}>{cvr % 1 === 0 ? cvr : cvr.toFixed(1)}% CVR</OfferCvrBadge>
                      </OfferLegendRight>
                    </OfferLegendItem>
                  );
                })}
              </OfferLegendList>
            </OfferVizRow>
          </OfferVizSection>
        )}

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
                <OfferRow
                  key={i}
                  $isTop={i === 0}
                  $clickable={!!offer.offerId}
                  onClick={() => offer.offerId && window.open(`/offer-preview?offerId=${offer.offerId}`, '_blank', 'noopener,noreferrer')}
                >
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

        </Section>

        {/* ── Leads ─────────────────────────────────────────────────────── */}
        <Section variants={item}>
          <SectionTitle><Users size={18} /> Leads</SectionTitle>
          <LeadsTable flowId={flowId} />
        </Section>

        {/* ── Drop-off Ranking ──────────────────────────────────────────── */}
        {dropOffRanking.length > 0 && (
          <Section variants={item}>
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
          </Section>
        )}

        {/* ── Most Popular Path ──────────────────────────────────────── */}
        {popularPathData && popularPathData.nodes.length > 1 && (
          <Section variants={item}>
          <>
            <SectionTitle><GitBranch size={18} /> Most Popular Path</SectionTitle>
            <PopularPathBadge>{formatNumber(popularPathData.count)} users took this path</PopularPathBadge>
            <PathContainer>
              {popularPathData.nodes.map((node, i) => (
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
                    <PathNodeCount>{formatNumber(popularPathData.count)}</PathNodeCount>
                  </PathNode>
                  {i < popularPathData.nodes.length - 1 && <PathConnector />}
                </PathItem>
              ))}
            </PathContainer>
          </>
          </Section>
        )}

        {/* ── Per-Node Stats ─────────────────────────────────────────── */}
        {nodesWithStats.length > 0 && (
          <Section variants={item}>
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
          </Section>
        )}
      </PageContent>
      )}

      </AnimatePresence>
    </AdminLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const PageContent = styled(motion.div)`
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
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 11px 14px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

const KpiIconWrap = styled.div<{ $color: string }>`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $color }) => `${$color}18`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
`;

const KpiContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const KpiValue = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.2;
`;

const KpiLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
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

const OfferKpiCard = styled.div<{ $color: string }>`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const OfferKpiIcon = styled.div<{ $color: string }>`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $color }) => `${$color}18`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
`;

const OfferKpiValue = styled.div<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ $color }) => $color};
  line-height: 1.2;
`;

const OfferKpiLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 1px;
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

const OfferRow = styled.div<{ $isTop: boolean; $clickable: boolean }>`
  display: grid;
  grid-template-columns: 36px 1fr 100px 100px 80px 130px;
  gap: 6px;
  padding: 10px 16px;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $isTop, theme }) => ($isTop ? `${theme.colors.warning}08` : "transparent")};
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ $clickable, $isTop, theme }) =>
      $clickable
        ? theme.colors.bgElevated
        : $isTop
          ? `${theme.colors.warning}08`
          : "transparent"};
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

const PopularPathBadge = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-bottom: 8px;
`;

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

// ── Session Timing ───────────────────────────────────────────────────────────

const TimingGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 4px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const TimingGroup = styled.div<{ $color: string }>`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-top: 3px solid ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 14px 18px;
`;

const TimingGroupLabel = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ $color }) => $color};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
`;

const TimingRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
`;

const TimingCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgElevated};
`;

const TimingValue = styled.div<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ $color }) => $color};
`;

const TimingLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

// ── Offer Donut Chart ────────────────────────────────────────────────────────

const OfferVizSection = styled.div`
  margin-bottom: 12px;
`;

const OfferVizRow = styled.div`
  display: flex;
  gap: 0;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

const OfferDonutBox = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px 16px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
`;

/** Always occupies its height — legend fades in/out via opacity, no layout shift */
const DonutLegendSlot = styled.div`
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 4px;
`;

const DonutHoverLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DonutLegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const DonutLegendDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const OfferLegendList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 320px;
  display: flex;
  flex-direction: column;
  padding: 8px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colors.border}; border-radius: 2px; }
`;

const OfferLegendItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  background: ${({ $active, theme }) => $active ? theme.colors.bgElevated : 'transparent'};
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.border : 'transparent'};
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
  }
`;

const OfferLegendDot = styled.div<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const OfferLegendName = styled.div`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

const OfferLegendRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const OfferLegendPct = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 36px;
  text-align: right;
`;

const OfferCvrBadge = styled.div<{ $color: string }>`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}18`};
  border-radius: 999px;
  padding: 2px 7px;
  white-space: nowrap;
`;

// ─── Section wrapper (stagger item + spacing) ─────────────────────────────────

const Section = styled(motion.div)`
  & + & { margin-top: 28px; }
`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const shimmerAnim = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
`;

const Bone = styled.div<{ $w?: string; $h?: string; $r?: string }>`
  width:         ${({ $w }) => $w ?? '100%'};
  height:        ${({ $h }) => $h ?? '16px'};
  border-radius: ${({ $r }) => $r ?? '6px'};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.bgElevated} 25%,
    ${({ theme }) => theme.colors.bgSurface}  50%,
    ${({ theme }) => theme.colors.bgElevated} 75%
  );
  background-size: 600px 100%;
  animation: ${shimmerAnim} 1.4s ease-in-out infinite;
  flex-shrink: 0;
`;

const SkGrid = styled.div<{ $cols?: number; $gap?: string }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols ?? 3}, 1fr);
  gap: ${({ $gap }) => $gap ?? '12px'};
`;

const SkCard = styled.div`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SkRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const SkSectionTitle = styled.div`
  margin-bottom: 14px;
`;

function StatsPageSkeleton() {
  return (
    <PageContent
      key="skeleton"
      variants={page}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0 }}
    >
      {/* Back + header */}
      <Section variants={item}>
        <BackRow>
          <Bone $w="72px" $h="30px" $r="8px" />
        </BackRow>
        <PageHeader>
          <TitleBlock>
            <Bone $w="220px" $h="28px" $r="8px" />
            <Bone $w="140px" $h="16px" $r="6px" style={{ marginTop: 8 }} />
          </TitleBlock>
          <Bone $w="180px" $h="20px" $r="6px" />
        </PageHeader>
      </Section>

      {/* Overview KPIs */}
      <Section variants={item}>
        <SkSectionTitle><Bone $w="90px" $h="20px" $r="6px" /></SkSectionTitle>
        <SkGrid $cols={3} $gap="12px">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkCard key={i}>
              <SkRow>
                <Bone $w="32px" $h="32px" $r="8px" />
                <div style={{ flex: 1 }}>
                  <Bone $w="60px" $h="22px" $r="5px" />
                  <Bone $w="90px" $h="13px" $r="4px" style={{ marginTop: 6 }} />
                </div>
              </SkRow>
            </SkCard>
          ))}
        </SkGrid>
      </Section>

      {/* Structure chips */}
      <Section variants={item}>
        <SkRow>
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} $w="110px" $h="32px" $r="8px" />
          ))}
        </SkRow>
      </Section>

      {/* Session Timing */}
      <Section variants={item}>
        <SkSectionTitle><Bone $w="140px" $h="20px" $r="6px" /></SkSectionTitle>
        <SkGrid $cols={2} $gap="12px">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkCard key={i}>
              <Bone $w="120px" $h="14px" $r="4px" />
              <SkRow>
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} style={{ flex: 1 }}>
                    <Bone $h="20px" $r="5px" />
                    <Bone $w="36px" $h="11px" $r="4px" style={{ marginTop: 5 }} />
                  </div>
                ))}
              </SkRow>
            </SkCard>
          ))}
        </SkGrid>
      </Section>

      {/* Offer Performance */}
      <Section variants={item}>
        <SkSectionTitle><Bone $w="160px" $h="20px" $r="6px" /></SkSectionTitle>
        <SkGrid $cols={3} $gap="12px" style={{ marginBottom: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkCard key={i}>
              <SkRow>
                <Bone $w="36px" $h="36px" $r="8px" />
                <div style={{ flex: 1 }}>
                  <Bone $w="50px" $h="22px" $r="5px" />
                  <Bone $w="100px" $h="13px" $r="4px" style={{ marginTop: 6 }} />
                </div>
              </SkRow>
            </SkCard>
          ))}
        </SkGrid>
        <SkCard>
          <SkRow>
            <Bone $w="200px" $h="200px" $r="50%" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkRow key={i} style={{ marginBottom: 10 }}>
                  <Bone $w="10px" $h="10px" $r="50%" style={{ flexShrink: 0 }} />
                  <Bone $h="14px" $r="5px" />
                </SkRow>
              ))}
            </div>
          </SkRow>
        </SkCard>
      </Section>

      {/* Node Stats */}
      <Section variants={item}>
        <SkSectionTitle><Bone $w="130px" $h="20px" $r="6px" /></SkSectionTitle>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkCard key={i} style={{ marginBottom: 8 }}>
            <SkRow>
              <Bone $w="28px" $h="28px" $r="6px" />
              <Bone $w="200px" $h="16px" $r="5px" />
              <div style={{ marginLeft: 'auto' }}>
                <Bone $w="60px" $h="14px" $r="4px" />
              </div>
            </SkRow>
            <SkGrid $cols={3} $gap="8px">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j}>
                  <Bone $h="18px" $r="5px" />
                  <Bone $w="60%" $h="11px" $r="4px" style={{ marginTop: 4 }} />
                </div>
              ))}
            </SkGrid>
          </SkCard>
        ))}
      </Section>

      {/* Drop-off Hotspots */}
      <Section variants={item}>
        <SkSectionTitle><Bone $w="160px" $h="20px" $r="6px" /></SkSectionTitle>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkCard key={i} style={{ marginBottom: 8 }}>
            <SkRow>
              <Bone $w="28px" $h="28px" $r="6px" />
              <Bone $h="16px" $r="5px" />
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <Bone $w="44px" $h="22px" $r="999px" />
                <Bone $w="44px" $h="22px" $r="999px" />
              </div>
            </SkRow>
            <Bone $h="6px" $r="3px" />
          </SkCard>
        ))}
      </Section>
    </PageContent>
  );
}
