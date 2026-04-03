import { useState } from "react";
import styled, { useTheme } from "styled-components";
import { motion } from "framer-motion";
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
} from "lucide-react";
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

interface StatDef {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: ColorKey;
}

export function DashboardPage() {
  const theme = useTheme() as AppTheme;
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: flows = [], isLoading, isError } = useFlows();
  const { mutate: deleteFlow } = useDeleteFlow();
  const { mutate: publishFlow } = usePublishFlow();
  const { mutate: unpublishFlow } = useUnpublishFlow();

  const { data: sessionStats } = useGlobalSessionStats();
  const { data: offerStats } = useGlobalOfferStats();
  const { data: dropOffs } = useGlobalDropOffs();

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

  const sessionStatCards: StatDef[] = [
    {
      label: "Total Sessions",
      value: sessionStats?.totalSessions ?? "—",
      icon: <Users size={20} />,
      color: "accent",
    },
    {
      label: "In Progress",
      value: sessionStats?.inProgress ?? "—",
      icon: <TrendingUp size={20} />,
      color: "info",
    },
    {
      label: "Completed",
      value: sessionStats?.completed ?? "—",
      icon: <CheckCircle2 size={20} />,
      color: "success",
    },
    {
      label: "Abandoned",
      value: sessionStats?.abandoned ?? "—",
      icon: <XCircle size={20} />,
      color: "error",
    },
    {
      label: "Completion Rate",
      value: sessionStats
        ? `${sessionStats.completionRate.toFixed(1)}%`
        : "—",
      icon: <TrendingUp size={20} />,
      color: "success",
    },
    {
      label: "Abandon Rate",
      value: sessionStats
        ? `${sessionStats.abandonRate.toFixed(1)}%`
        : "—",
      icon: <TrendingDown size={20} />,
      color: "error",
    },
  ];

  const topDropOffs = dropOffs
    ? [...dropOffs.items]
        .sort((a, b) => b.dropOffRate - a.dropOffRate)
        .slice(0, 5)
    : [];

  const maxDropOff =
    topDropOffs.length > 0
      ? Math.max(...topDropOffs.map((d) => d.dropOffRate))
      : 0;

  return (
    <AdminLayout>
      <PageContent>
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

        {/* Survey overview mini-stats */}
        <MiniStatsRow>
          <MiniStat
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MiniStatIcon $color="accent">
              <LayoutGrid size={16} />
            </MiniStatIcon>
            <div>
              <MiniStatValue>{flows.length}</MiniStatValue>
              <MiniStatLabel>Total Surveys</MiniStatLabel>
            </div>
          </MiniStat>
          <MiniStat
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <MiniStatIcon $color="success">
              <CheckCircle2 size={16} />
            </MiniStatIcon>
            <div>
              <MiniStatValue>{published}</MiniStatValue>
              <MiniStatLabel>Published</MiniStatLabel>
            </div>
          </MiniStat>
        </MiniStatsRow>

        {/* Session analytics cards */}
        <SectionHeader>
          <SectionTitle>Session Analytics</SectionTitle>
        </SectionHeader>
        <StatsGrid>
          {sessionStatCards.map((stat, i) => (
            <ColorStatCard
              key={stat.label}
              $color={stat.color}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ColorStatIcon $color={stat.color}>{stat.icon}</ColorStatIcon>
              <ColorStatValue>{stat.value}</ColorStatValue>
              <ColorStatLabel>{stat.label}</ColorStatLabel>
            </ColorStatCard>
          ))}
        </StatsGrid>

        {/* Offer stats */}
        {offerStats && offerStats.items.length > 0 && (
          <>
            <SectionHeader>
              <SectionTitle>
                <ShoppingBag size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
                Offer Performance
              </SectionTitle>
            </SectionHeader>
            <OfferCardsGrid>
              {offerStats.items.map((offer, i) => {
                const rate = offer.conversionRate;
                const rateColor =
                  rate >= 50
                    ? theme.colors.success
                    : rate >= 20
                      ? theme.colors.warning
                      : theme.colors.error;
                return (
                  <OfferCard
                    key={offer.offerId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <OfferCardHeader>
                      <OfferName>{offer.offerName}</OfferName>
                      <OfferSlug>{offer.offerSlug}</OfferSlug>
                    </OfferCardHeader>
                    <OfferMetrics>
                      <OfferMetric>
                        <OfferMetricValue>{offer.timesPresented}</OfferMetricValue>
                        <OfferMetricLabel>Presented</OfferMetricLabel>
                      </OfferMetric>
                      <OfferMetric>
                        <OfferMetricValue>{offer.timesConverted}</OfferMetricValue>
                        <OfferMetricLabel>Converted</OfferMetricLabel>
                      </OfferMetric>
                      <OfferMetric>
                        <OfferMetricValue style={{ color: rateColor }}>
                          {rate.toFixed(1)}%
                        </OfferMetricValue>
                        <OfferMetricLabel>Conv. Rate</OfferMetricLabel>
                      </OfferMetric>
                    </OfferMetrics>
                    <ProgressBarTrack>
                      <ProgressBarFill
                        style={{ width: `${Math.min(rate, 100)}%`, background: rateColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(rate, 100)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06 + 0.2 }}
                      />
                    </ProgressBarTrack>
                  </OfferCard>
                );
              })}
            </OfferCardsGrid>
          </>
        )}

        {/* Drop-off analysis — top 5 worst */}
        {topDropOffs.length > 0 && (
          <>
            <SectionHeader>
              <SectionTitle>
                <AlertTriangle size={18} style={{ verticalAlign: "middle", marginRight: 8, color: theme.colors.error }} />
                Drop-off Hotspots
              </SectionTitle>
              <SectionSubtitle>Top 5 nodes where users leave</SectionSubtitle>
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
          </>
        )}

        {/* Surveys list */}
        <SectionHeader style={{ marginTop: 8 }}>
          <SectionTitle>Surveys</SectionTitle>
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

const PageContent = styled.div`
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

/* ─── Mini Stats (surveys) ─────────────────────────────────────────── */

const MiniStatsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
`;

const MiniStat = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 14px 20px;
`;

const MiniStatIcon = styled.div<{ $color: ColorKey }>`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $color }) => colorMap(theme, $color).bg};
  color: ${({ theme, $color }) => colorMap(theme, $color).fg};
`;

const MiniStatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1;
`;

const MiniStatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
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

/* ─── Session Stats Grid ───────────────────────────────────────────── */

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 36px;
`;

const ColorStatCard = styled(motion.div)<{ $color: ColorKey }>`
  position: relative;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 20px;
  overflow: hidden;
  transition: box-shadow ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ theme, $color }) => colorMap(theme, $color).fg};
    border-radius: ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg} 0 0;
  }

  &:hover {
    border-color: ${({ theme, $color }) => colorMap(theme, $color).fg};
    box-shadow: 0 4px 16px ${({ theme, $color }) => colorMap(theme, $color).fg}22;
  }
`;

const ColorStatIcon = styled.div<{ $color: ColorKey }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $color }) => colorMap(theme, $color).bg};
  color: ${({ theme, $color }) => colorMap(theme, $color).fg};
  margin-bottom: 14px;
`;

const ColorStatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xxl};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1;
`;

const ColorStatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

/* ─── Offer Cards ──────────────────────────────────────────────────── */

const OfferCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 36px;
`;

const OfferCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const OfferCardHeader = styled.div`
  margin-bottom: 16px;
  flex: 1;
`;

const OfferName = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const OfferSlug = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: 2px;
  font-family: monospace;
`;

const OfferMetrics = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 14px;
`;

const OfferMetric = styled.div`
  flex: 1;
`;

const OfferMetricValue = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const OfferMetricLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const ProgressBarTrack = styled.div`
  width: 100%;
  height: 6px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

const ProgressBarFill = styled(motion.div)`
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.full};
`;

/* ─── Drop-off Analysis ────────────────────────────────────────────── */

const DropOffList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 36px;
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
  margin-bottom: 24px;
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
  gap: 16px;
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
