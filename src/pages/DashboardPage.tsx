import { useState, useMemo } from "react";
import styled, { useTheme } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  LayoutGrid,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DONUT_COLORS, D_CX, D_CY, D_R, D_r, D_GAP, dSectorRaw, dSector } from "@shared/utils/donut";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@shared/ui/Button";
import { Input } from "@shared/ui/Input";
import { AdminLayout } from "@/components/AdminLayout";
import { SurveyCard } from "@features/surveys/components/SurveyCard";
import { CreateSurveyModal } from "@features/surveys/components/CreateSurveyModal";
import {
  useFlows,
  useDeleteFlow,
  usePublishFlow,
  useUnpublishFlow,
} from "@features/flows/hooks/useFlows";
import {
  useGlobalSessionStats,
  useGlobalOfferStats,
  useGlobalDropOffs,
} from "@features/analytics/hooks/useAnalytics";
import { Spinner } from "@shared/ui/Spinner";
import toast from "react-hot-toast";
import type { AppTheme } from "@shared/theme/theme";

type ColorKey = "accent" | "success" | "error" | "warning" | "info";

const page = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const } },
}

export function DashboardPage() {
  const theme = useTheme() as AppTheme;
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [offersExpanded, setOffersExpanded] = useState(false);
  const [dropOffsExpanded, setDropOffsExpanded] = useState(false);
  const [hoveredFlow, setHoveredFlow] = useState<number | null>(null);
  const [flowFilter, setFlowFilter] = useState<string | null>(null);
  type OfferSortKey = "timesPresented" | "timesConverted" | "conversionRate" | "offerName";
  const [offerSort, setOfferSort] = useState<OfferSortKey>("timesPresented");

  const OFFERS_PREVIEW = 5;
  const DROPOFFS_PREVIEW = 5;

  const { data: flows = [], isLoading, isError } = useFlows();
  const { mutate: deleteFlow } = useDeleteFlow();
  const { mutate: publishFlow } = usePublishFlow();
  const { mutate: unpublishFlow } = useUnpublishFlow();

  const { data: sessionStats } = useGlobalSessionStats();
  const { data: offerStats } = useGlobalOfferStats();
  const { data: dropOffs } = useGlobalDropOffs();

  const sortedOffers = useMemo(() => {
    if (!offerStats) return [];
    const base = flowFilter
      ? offerStats.items.filter((o) => o.flowId === flowFilter)
      : offerStats.items;
    return [...base].sort((a, b) => {
      if (offerSort === "offerName") return a.offerName.localeCompare(b.offerName);
      return (b[offerSort] as number) - (a[offerSort] as number);
    });
  }, [offerStats, offerSort, flowFilter]);

  const visibleOffers = offersExpanded ? sortedOffers : sortedOffers.slice(0, OFFERS_PREVIEW);
  const maxPresented = sortedOffers.length > 0 ? Math.max(...sortedOffers.map(o => o.timesPresented)) : 1;

  const toggleFlowFilter = (flowId: string) => {
    setFlowFilter((prev) => (prev === flowId ? null : flowId));
    setOffersExpanded(false);
  };

  const flowGroups = useMemo(() => {
    if (!offerStats) return [];
    const map: Record<string, { flowId: string; flowName: string; offers: typeof offerStats.items; totalImpressions: number }> = {};
    for (const o of offerStats.items) {
      if (!map[o.flowId]) map[o.flowId] = { flowId: o.flowId, flowName: o.flowName, offers: [], totalImpressions: 0 };
      map[o.flowId].offers.push(o);
      map[o.flowId].totalImpressions += o.timesPresented;
    }
    return Object.values(map).sort((a, b) => b.totalImpressions - a.totalImpressions);
  }, [offerStats]);

  const totalFlowImpressions = useMemo(() =>
    flowGroups.reduce((sum, g) => sum + g.totalImpressions, 0),
  [flowGroups]);

  const flowSectors = useMemo(() => {
    if (totalFlowImpressions === 0) return [];
    let angle = -Math.PI / 2;
    return flowGroups.map((group, i) => {
      const span = (group.totalImpressions / totalFlowImpressions) * Math.PI * 2;
      const start = angle;
      angle += span;
      return { start, end: angle, span, group, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    });
  }, [flowGroups, totalFlowImpressions]);

  const flowFilterName = flowFilter
    ? flowGroups.find((g) => g.flowId === flowFilter)?.flowName ?? null
    : null;

  const filtered = flows.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const published = flows.filter((f) => f.isPublished).length;

  const handleEdit = (id: string) => {
    navigate({ to: "/editor/$surveyId", params: { surveyId: id } });
  };

  const handleDelete = (id: string) => {
    deleteFlow(id, {
      onSuccess: () => toast.success("Survey deleted"),
      onError: () => toast.error("Failed to delete survey"),
    });
  };

  const handlePublish = (id: string) => {
    publishFlow(id, {
      onSuccess: () => toast.success("Survey published"),
      onError: () => toast.error("Failed to publish survey"),
    });
  };

  const handleUnpublish = (id: string) => {
    unpublishFlow(id, {
      onSuccess: () => toast.success("Survey unpublished"),
      onError: () => toast.error("Failed to unpublish survey"),
    });
  };

  const handleStats = (id: string) => {
    navigate({ to: "/stats/$flowId", params: { flowId: id } });
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/survey/${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied to clipboard!"));
  };

  const allDropOffs = dropOffs
    ? [...dropOffs.items].sort((a, b) => b.dropOffRate - a.dropOffRate)
    : [];

  const topDropOffs = dropOffsExpanded
    ? allDropOffs
    : allDropOffs.slice(0, DROPOFFS_PREVIEW);


  return (
    <AdminLayout>
      <PageContent variants={page} initial="hidden" animate="show">
        <motion.div variants={item}>
        <PageHeader>
          <TitleBlock>
            <PageTitle>Dashboard</PageTitle>
            <PageSubtitle>
              Overview of your surveys, sessions, and analytics
            </PageSubtitle>
          </TitleBlock>
          <Button
            size="lg"
            icon={<Plus size={18} />}
            onClick={() => setCreateOpen(true)}
          >
            Create Survey
          </Button>
        </PageHeader>
        </motion.div>

        {/* Unified compact stats */}
        <motion.div variants={item}>
        <DashKpiGrid>
          {[
            { label: "Total Surveys",    value: flows.length,                                               icon: <LayoutGrid size={15} />,   color: "accent"   as ColorKey },
            { label: "Published",        value: published,                                                  icon: <CheckCircle2 size={15} />, color: "success"  as ColorKey },
            { label: "Total Sessions",   value: sessionStats?.totalSessions ?? "—",                         icon: <Users size={15} />,        color: "accent"   as ColorKey },
            { label: "In Progress",      value: sessionStats?.inProgress ?? "—",                            icon: <TrendingUp size={15} />,   color: "info"     as ColorKey },
            { label: "Completed",        value: sessionStats?.completed ?? "—",                             icon: <CheckCircle2 size={15} />, color: "success"  as ColorKey },
            { label: "Abandoned",        value: sessionStats?.abandoned ?? "—",                             icon: <XCircle size={15} />,      color: "error"    as ColorKey },
            { label: "Completion Rate",  value: sessionStats ? `${sessionStats.completionRate.toFixed(1)}%` : "—", icon: <TrendingUp size={15} />,   color: "success"  as ColorKey },
            { label: "Abandon Rate",     value: sessionStats ? `${sessionStats.abandonRate.toFixed(1)}%`   : "—", icon: <TrendingDown size={15} />, color: "error"    as ColorKey },
          ].map((stat, i) => (
            <DashKpiCard
              key={stat.label}
              $color={stat.color}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <DashKpiIcon $color={stat.color}>{stat.icon}</DashKpiIcon>
              <DashKpiContent>
                <DashKpiValue>{stat.value}</DashKpiValue>
                <DashKpiLabel>{stat.label}</DashKpiLabel>
              </DashKpiContent>
            </DashKpiCard>
          ))}
        </DashKpiGrid>
        </motion.div>

        {/* Offer stats */}
        {sortedOffers.length > 0 && (
          <motion.div variants={item}>
          <>
            <SectionHeader>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <SectionTitle>
                  <ShoppingBag size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
                  Offer Performance
                  <OfferCountBadge>{sortedOffers.length} offers</OfferCountBadge>
                </SectionTitle>
                <OfferSortRow>
                  {(["timesPresented", "timesConverted", "conversionRate", "offerName"] as const).map((key) => (
                    <OfferSortBtn
                      key={key}
                      $active={offerSort === key}
                      onClick={() => { setOfferSort(key); setOffersExpanded(false); }}
                    >
                      {key === "timesPresented" && "Presented"}
                      {key === "timesConverted" && "Converted"}
                      {key === "conversionRate" && "Conv. Rate"}
                      {key === "offerName" && "Name A–Z"}
                    </OfferSortBtn>
                  ))}
                  {flowFilterName && (
                    <OfferFlowFilterChip onClick={() => { setFlowFilter(null); setOffersExpanded(false); }}>
                      {flowFilterName}
                      <XCircle size={12} style={{ flexShrink: 0 }} />
                    </OfferFlowFilterChip>
                  )}
                </OfferSortRow>
              </div>
            </SectionHeader>

            {/* Flow donut */}
            {flowSectors.length > 0 && (
              <DashDonutSection>
                <DashDonutBox>
                  <svg width={240} height={240} viewBox="0 0 240 240" style={{ overflow: 'visible' }}>
                    {flowSectors.map((s, i) => {
                      const isHov = hoveredFlow === i;
                      const anyHov = hoveredFlow !== null;
                      const span = s.end - s.start;
                      const hg = Math.min(D_GAP / 2, span * 0.08);
                      const a1 = s.start + hg, a2 = s.end - hg;

                      // Offer sub-arcs within hovered flow
                      let subAngle = a1;
                      const offerSubArcs = isHov ? s.group.offers.map((o, oi) => {
                        const offerSpan = s.group.totalImpressions > 0 ? (a2 - a1) * o.timesPresented / s.group.totalImpressions : 0;
                        const subStart = subAngle;
                        subAngle += offerSpan;
                        return { start: subStart, end: subAngle, offer: o, color: DONUT_COLORS[(i * 3 + oi + 1) % DONUT_COLORS.length] };
                      }) : [];

                      return (
                        <motion.g
                          key={i}
                          animate={{ opacity: anyHov && !isHov ? 0.22 : 1, scale: isHov ? 1.06 : 1 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          style={{ transformOrigin: `${D_CX}px ${D_CY}px`, cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredFlow(i)}
                          onMouseLeave={() => setHoveredFlow(null)}
                          onClick={() => toggleFlowFilter(s.group.flowId)}
                        >
                          <motion.path
                            d={dSector(s.start, s.end)}
                            fill={s.color}
                            animate={{ opacity: isHov ? 0 : 1 }}
                            transition={{ duration: 0.18 }}
                          />
                          <AnimatePresence>
                            {isHov && offerSubArcs.map((sub, oi) => (
                              <motion.path
                                key={oi}
                                d={dSectorRaw(sub.start, sub.end, D_R + 6, D_r - 4)}
                                fill={sub.color}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              />
                            ))}
                          </AnimatePresence>
                        </motion.g>
                      );
                    })}

                    <AnimatePresence mode="wait">
                      {hoveredFlow !== null ? (() => {
                        const g = flowSectors[hoveredFlow].group;
                        const short = g.flowName.length > 16 ? g.flowName.slice(0, 14) + '…' : g.flowName;
                        return (
                          <motion.g key="hov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                            <text x={D_CX} y={D_CY - 16} textAnchor="middle" fill={theme.colors.textPrimary} fontSize="10" fontWeight="600" fontFamily="inherit">{short}</text>
                            <text x={D_CX} y={D_CY + 4}  textAnchor="middle" fill={theme.colors.accent} fontSize="20" fontWeight="700" fontFamily="inherit">{g.totalImpressions}</text>
                            <text x={D_CX} y={D_CY + 20} textAnchor="middle" fill={theme.colors.textTertiary} fontSize="10" fontFamily="inherit">impressions</text>
                            <text x={D_CX} y={D_CY + 34} textAnchor="middle" fill={theme.colors.textTertiary} fontSize="10" fontFamily="inherit">{g.offers.length} offer{g.offers.length !== 1 ? 's' : ''}</text>
                          </motion.g>
                        );
                      })() : (
                        <motion.g key="def" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                          <text x={D_CX} y={D_CY - 4}  textAnchor="middle" fill={theme.colors.textPrimary} fontSize="22" fontWeight="700" fontFamily="inherit">{totalFlowImpressions}</text>
                          <text x={D_CX} y={D_CY + 16} textAnchor="middle" fill={theme.colors.textTertiary} fontSize="11" fontFamily="inherit">impressions</text>
                        </motion.g>
                      )}
                    </AnimatePresence>
                  </svg>
                </DashDonutBox>

                <DashFlowLegend>
                  {flowSectors.map((s, i) => {
                    const share = totalFlowImpressions > 0 ? (s.group.totalImpressions / totalFlowImpressions) * 100 : 0;
                    return (
                      <DashFlowLegendItem
                        key={s.group.flowId}
                        $active={hoveredFlow === i}
                        onMouseEnter={() => setHoveredFlow(i)}
                        onMouseLeave={() => setHoveredFlow(null)}
                        onClick={() => toggleFlowFilter(s.group.flowId)}
                      >
                        <DashFlowLegendDot $color={s.color} />
                        <DashFlowLegendName>{s.group.flowName}</DashFlowLegendName>
                        <DashFlowLegendRight>
                          <DashFlowLegendPct>{share.toFixed(1)}%</DashFlowLegendPct>
                          <DashFlowLegendCount>{s.group.offers.length} offers</DashFlowLegendCount>
                        </DashFlowLegendRight>
                      </DashFlowLegendItem>
                    );
                  })}
                </DashFlowLegend>
              </DashDonutSection>
            )}

            <OfferTable>
              <OfferTableHeader>
                <OfferColName>Offer</OfferColName>
                <OfferColFlow>Flow</OfferColFlow>
                <OfferColStat $sortable $active={offerSort === "timesPresented"} onClick={() => { setOfferSort("timesPresented"); setOffersExpanded(false); }}>Presented</OfferColStat>
                <OfferColStat $sortable $active={offerSort === "timesConverted"} onClick={() => { setOfferSort("timesConverted"); setOffersExpanded(false); }}>Converted</OfferColStat>
                <OfferColBar $sortable $active={offerSort === "conversionRate"} onClick={() => { setOfferSort("conversionRate"); setOffersExpanded(false); }}>Conversion Rate</OfferColBar>
              </OfferTableHeader>

              {visibleOffers.map((offer, i) => {
                const rate = offer.conversionRate;
                const rateColor =
                  rate >= 50
                    ? theme.colors.success
                    : rate >= 20
                      ? theme.colors.warning
                      : theme.colors.error;
                const barWidth = maxPresented > 0 ? (offer.timesPresented / maxPresented) * 100 : 0;
                return (
                  <OfferRow
                    key={offer.offerId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => window.open(`/offer-preview?offerId=${offer.offerId}`, '_blank', 'noopener,noreferrer')}
                  >
                    <OfferColName>
                      <OfferRowName>{offer.offerName}</OfferRowName>
                      <OfferRowSlug>{offer.offerSlug}</OfferRowSlug>
                    </OfferColName>
                    <OfferColFlow>
                      <OfferFlowTag>{offer.flowName}</OfferFlowTag>
                    </OfferColFlow>
                    <OfferColStat>
                      <OfferStatNum>{offer.timesPresented}</OfferStatNum>
                    </OfferColStat>
                    <OfferColStat>
                      <OfferStatNum>{offer.timesConverted}</OfferStatNum>
                    </OfferColStat>
                    <OfferColBar>
                      <OfferBarGroup>
                        <OfferBarTrack>
                          <OfferBarReach
                            style={{ width: `${barWidth}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.6, delay: i * 0.04 + 0.1 }}
                            $color={theme.colors.border}
                          />
                          <OfferBarConv
                            style={{ width: `${Math.min(rate, 100)}%`, background: rateColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(rate, 100)}%` }}
                            transition={{ duration: 0.7, delay: i * 0.04 + 0.2 }}
                          />
                        </OfferBarTrack>
                        <OfferRateLabel style={{ color: rateColor }}>
                          {rate % 1 === 0 ? rate : rate.toFixed(1)}%
                        </OfferRateLabel>
                      </OfferBarGroup>
                    </OfferColBar>
                  </OfferRow>
                );
              })}
            </OfferTable>

            {sortedOffers.length > OFFERS_PREVIEW && (
              <OfferExpandBtn
                onClick={() => setOffersExpanded((v) => !v)}
                whileTap={{ scale: 0.97 }}
              >
                {offersExpanded ? (
                  <><ChevronUp size={14} /> Show less</>
                ) : (
                  <><ChevronDown size={14} /> Show {sortedOffers.length - OFFERS_PREVIEW} more offers</>
                )}
              </OfferExpandBtn>
            )}
          </>
          </motion.div>
        )}

        {/* Surveys list */}
        <motion.div variants={item}>
        <SectionHeader>
          <SectionTitle>
            <LayoutGrid size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Surveys
          </SectionTitle>
        </SectionHeader>

        <Toolbar>
          <SearchWrapper>
            <Input
              placeholder="Search surveys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={15} />}
            />
          </SearchWrapper>
        </Toolbar>

        {isLoading ? (
          <LoadingBlock>
            <Spinner size={32} />
          </LoadingBlock>
        ) : isError ? (
          <EmptyState initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyIcon>
              <AlertTriangle size={28} color={theme.colors.warning} />
            </EmptyIcon>
            <EmptyTitle>Failed to load surveys</EmptyTitle>
            <EmptyDesc>
              Unable to connect to the server. Please try again.
            </EmptyDesc>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyIcon>
              <LayoutGrid size={28} color="#A1A1AA" />
            </EmptyIcon>
            <EmptyTitle>
              {searchQuery ? "No surveys found" : "No surveys yet"}
            </EmptyTitle>
            <EmptyDesc>
              {searchQuery
                ? "Try a different search term"
                : "Create your first survey to get started with the DAG editor."}
            </EmptyDesc>
            {!searchQuery && (
              <Button
                icon={<Plus size={16} />}
                onClick={() => setCreateOpen(true)}
              >
                Create Survey
              </Button>
            )}
          </EmptyState>
        ) : (
          <Grid>
            {filtered.map((flow, i) => (
              <SurveyCard
                key={flow.id}
                flow={flow}
                index={i}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopyLink={handleCopyLink}
                onStats={handleStats}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
              />
            ))}
          </Grid>
        )}
        </motion.div>

        {/* Drop-off analysis */}
        {allDropOffs.length > 0 && (
          <motion.div variants={item}>
          <>
            <SectionHeader>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <SectionTitle>
                  <AlertTriangle size={18} style={{ verticalAlign: "middle", marginRight: 8, color: theme.colors.error }} />
                  Drop-off Hotspots
                  <OfferCountBadge>{allDropOffs.length} nodes</OfferCountBadge>
                </SectionTitle>
                <SectionSubtitle>Nodes where users leave most</SectionSubtitle>
              </div>
            </SectionHeader>
            <DropOffList>
              {topDropOffs.map((item, i) => {
                const pct = item.dropOffRate;
                const severity =
                  pct >= 40
                    ? theme.colors.error
                    : theme.colors.warning;
                return (
                  <DropOffRow
                    key={item.nodeId}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <DropOffLeft>
                      <DropOffRank>#{i + 1}</DropOffRank>
                      <DropOffDot style={{ background: severity }} />
                      <DropOffTextBlock>
                        <DropOffNodeName>{item.nodeTitle}</DropOffNodeName>
                        <DropOffFlowName>{item.flowTitle}</DropOffFlowName>
                      </DropOffTextBlock>
                      <DropOffBadge $severity={severity}>
                        {item.sessionCount} sessions
                      </DropOffBadge>
                    </DropOffLeft>
                    <DropOffBarWrapper>
                      <DropOffBarTrack>
                        <DropOffBar
                          style={{ background: severity }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.04 + 0.15 }}
                        />
                      </DropOffBarTrack>
                      <DropOffRate style={{ color: severity }}>
                        {pct.toFixed(1)}%
                      </DropOffRate>
                    </DropOffBarWrapper>
                  </DropOffRow>
                );
              })}
            </DropOffList>

            {allDropOffs.length > DROPOFFS_PREVIEW && (
              <OfferExpandBtn
                onClick={() => setDropOffsExpanded((v) => !v)}
                whileTap={{ scale: 0.97 }}
              >
                {dropOffsExpanded ? (
                  <><ChevronUp size={14} /> Show less</>
                ) : (
                  <><ChevronDown size={14} /> Show {allDropOffs.length - DROPOFFS_PREVIEW} more nodes</>
                )}
              </OfferExpandBtn>
            )}
          </>
          </motion.div>
        )}

        <CreateSurveyModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      </PageContent>
    </AdminLayout>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

const colorMap = (theme: AppTheme, color: ColorKey) => {
  const map: Record<ColorKey, { bg: string; fg: string }> = {
    accent: { bg: theme.colors.accentLight, fg: theme.colors.accent },
    success: { bg: theme.colors.successLight, fg: theme.colors.success },
    error: { bg: theme.colors.errorLight, fg: theme.colors.error },
    warning: { bg: theme.colors.warningLight, fg: theme.colors.warning },
    info: { bg: theme.colors.infoLight, fg: theme.colors.info },
  };
  return map[color];
};

/* ─── Styled Components ────────────────────────────────────────────── */

const PageContent = styled(motion.div)`
  padding: 32px 40px;
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  overflow: scroll;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 16px;
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
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
  margin-top: 6px;
`;

/* ─── Unified compact KPI grid ─────────────────────────────────────── */

const DashKpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 28px;
`;

const DashKpiCard = styled(motion.div)<{ $color: ColorKey }>`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ theme, $color }) => colorMap(theme, $color).fg};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 11px 14px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

const DashKpiIcon = styled.div<{ $color: ColorKey }>`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $color }) => colorMap(theme, $color).bg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme, $color }) => colorMap(theme, $color).fg};
`;

const DashKpiContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const DashKpiValue = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.2;
`;

const DashKpiLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`;

/* ─── Section Headers ──────────────────────────────────────────────── */

const SectionHeader = styled.div`
  margin-bottom: 16px;
  margin-top: 8px;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: 2px;
`;

/* ─── Dashboard Donut ──────────────────────────────────────────────── */

const DashDonutSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const DashDonutBox = styled.div`
  flex-shrink: 0;
`;

const DashFlowLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 180px;
`;

const DashFlowLegendItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $active }) => $active ? theme.colors.bgElevated : 'transparent'};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
`;

const DashFlowLegendDot = styled.div<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const DashFlowLegendName = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DashFlowLegendRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const DashFlowLegendPct = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

const DashFlowLegendCount = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

/* ─── Offer Table ──────────────────────────────────────────────────── */

const OfferCountBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 2px 8px;
  margin-left: 10px;
  vertical-align: middle;
`;

const OfferTable = styled.div`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  margin-bottom: 8px;
`;

const offerRowBase = `
  display: grid;
  grid-template-columns: 2fr 1.4fr 90px 90px 1fr;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
`;

const OfferTableHeader = styled.div`
  ${offerRowBase}
  padding-top: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgElevated};
`;

const OfferRow = styled(motion.div)`
  ${offerRowBase}
  padding-top: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: background ${({ theme }) => theme.transitions.fast};
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
  }
`;

const headerCellBase = `
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const OfferColName = styled.div`
  ${headerCellBase}
  color: ${({ theme }) => theme.colors.textTertiary};
  min-width: 0;
`;

const OfferColFlow = styled.div`
  ${headerCellBase}
  color: ${({ theme }) => theme.colors.textTertiary};
  min-width: 0;
`;

const OfferColStat = styled.div<{ $sortable?: boolean; $active?: boolean }>`
  ${headerCellBase}
  color: ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.textTertiary};
  text-align: center;
  cursor: ${({ $sortable }) => $sortable ? "pointer" : "default"};
  user-select: none;
  transition: color ${({ theme }) => theme.transitions.fast};
  &:hover { color: ${({ theme, $sortable }) => $sortable ? theme.colors.textPrimary : undefined}; }
`;

const OfferColBar = styled.div<{ $sortable?: boolean; $active?: boolean }>`
  ${headerCellBase}
  color: ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.textTertiary};
  cursor: ${({ $sortable }) => $sortable ? "pointer" : "default"};
  user-select: none;
  transition: color ${({ theme }) => theme.transitions.fast};
  &:hover { color: ${({ theme, $sortable }) => $sortable ? theme.colors.textPrimary : undefined}; }
`;

const OfferSortRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const OfferSortBtn = styled.button<{ $active: boolean }>`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.border};
  background: ${({ theme, $active }) => $active ? theme.colors.accentLight : "transparent"};
  color: ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.textSecondary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const OfferFlowFilterChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accentLight};
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all ${({ theme }) => theme.transitions.fast};
  &:hover {
    background: ${({ theme }) => theme.colors.accent};
    color: #fff;
  }
`;

const OfferRowName = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const OfferRowSlug = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  font-family: monospace;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const OfferFlowTag = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accentLight};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 2px 8px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

const OfferStatNum = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
`;

const OfferBarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OfferBarTrack = styled.div`
  flex: 1;
  height: 8px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
  position: relative;
`;

const OfferBarReach = styled(motion.div)<{ $color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $color }) => $color};
  opacity: 0.35;
`;

const OfferBarConv = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.full};
`;

const OfferRateLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  min-width: 42px;
  text-align: right;
  flex-shrink: 0;
`;

const OfferExpandBtn = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 16px;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  margin-bottom: 16px;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

/* ─── Drop-off Analysis ────────────────────────────────────────────── */

const DropOffList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
`;

const DropOffRow = styled(motion.div)`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const DropOffLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 320px;
  flex-shrink: 0;
`;

const DropOffRank = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.error};
  min-width: 28px;
  flex-shrink: 0;
`;

const DropOffDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  flex-shrink: 0;
`;

const DropOffTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

const DropOffNodeName = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DropOffFlowName = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DropOffBadge = styled.span<{ $severity: string }>`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ $severity }) => $severity};
  background: ${({ $severity }) => $severity}18;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  white-space: nowrap;
  flex-shrink: 0;
`;

const DropOffBarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

const DropOffBarTrack = styled.div`
  flex: 1;
  height: 8px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

const DropOffBar = styled(motion.div)`
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.full};
`;

const DropOffRate = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  min-width: 50px;
  text-align: right;
  flex-shrink: 0;
`;

/* ─── Toolbar / Search ─────────────────────────────────────────────── */

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const SearchWrapper = styled.div`
  flex: 1;
  max-width: 320px;
`;

/* ─── Survey Grid ──────────────────────────────────────────────────── */

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 10px;
  margin-bottom: 32px;
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 80px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: ${({ theme }) => theme.radii.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 8px;
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const EmptyDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 300px;
`;

const LoadingBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
`;
