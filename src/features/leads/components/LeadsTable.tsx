import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled, { useTheme } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ChevronUp, ChevronDown, X, ChevronLeft, ChevronRight,
  User, Mail, Phone, Building2, Briefcase, Globe, StickyNote,
  Clock, Calendar, Hash, ExternalLink,
} from 'lucide-react'
import { useLeads, usePatchLead } from '../hooks/useLeads'
import { formatDate } from '@shared/utils/format'
import type { LeadDto } from '@shared/types/api.types'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const TIERS = ['Hot', 'Warm', 'Cold', 'Disqualified'] as const
const STATUSES = ['New', 'Contacted', 'Qualified', 'Disqualified', 'Converted'] as const

const TIER_META: Record<string, { emoji: string; color: string; bg: string }> = {
  Hot:          { emoji: '🔥', color: '#DC2626', bg: '#FEF2F2' },
  Warm:         { emoji: '⚡', color: '#2563EB', bg: '#EFF6FF' },
  Cold:         { emoji: '💎', color: '#0284C7', bg: '#F0F9FF' },
  Disqualified: { emoji: '🌿', color: '#64748B', bg: '#F8FAFC' },
}

const STATUS_META: Record<string, { color: string; bg: string }> = {
  New:          { color: '#7C3AED', bg: '#F5F3FF' },
  Contacted:    { color: '#D97706', bg: '#FFFBEB' },
  Qualified:    { color: '#059669', bg: '#ECFDF5' },
  Disqualified: { color: '#DC2626', bg: '#FEF2F2' },
  Converted:    { color: '#0369A1', bg: '#F0F9FF' },
}

type SortField = 'FullName' | 'CompanyName' | 'Score' | 'TimeToComplete' | 'CreatedAt'

const SORT_COLS: { key: SortField; label: string; width: string }[] = [
  { key: 'FullName',        label: 'Name',    width: 'minmax(160px,1fr)' },
  { key: 'CompanyName',     label: 'Company', width: '130px' },
  { key: 'FullName',        label: 'Tier',    width: '90px' },  // dummy key; tier is not sortable
  { key: 'FullName',        label: 'Status',  width: '108px' }, // dummy key
  { key: 'Score',           label: 'Score',   width: '64px' },
  { key: 'TimeToComplete',  label: 'Time',    width: '80px' },
  { key: 'CreatedAt',       label: 'Date',    width: '96px' },
]

const SORTABLE: Record<string, SortField | null> = {
  Name:    'FullName',
  Company: 'CompanyName',
  Tier:    null,
  Status:  null,
  Score:   'Score',
  Time:    'TimeToComplete',
  Date:    'CreatedAt',
}

const GRID = SORT_COLS.map(c => c.width).join(' ')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDuration(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return '—'
  let total: number
  if (typeof raw === 'number') {
    total = raw
  } else {
    const parts = raw.split(':')
    if (parts.length < 3) return '—'
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    const s = parseFloat(parts[2])
    total = h * 3600 + m * 60 + s
  }
  if (total === 0) return '0s'
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${Math.round(s)}s`
  return `${s < 10 ? s.toFixed(1) : Math.round(s)}s`
}

function fmtShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeadsTableProps {
  flowId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeadsTable({ flowId }: LeadsTableProps) {
  const theme = useTheme()

  // Filter state
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('CreatedAt')
  const [sortDesc, setSortDesc] = useState(true)
  const [page, setPage] = useState(1)

  // Modal state
  const [selectedLead, setSelectedLead] = useState<LeadDto | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editTier, setEditTier] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 360)
  }

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [tier, status, from, to, sortBy, sortDesc])

  const params = {
    search: search || undefined,
    tier: tier ?? undefined,
    status: status ?? undefined,
    from: from || undefined,
    to: to || undefined,
    sortBy,
    sortDescending: sortDesc,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isFetching } = useLeads(flowId, params)
  const patchLead = usePatchLead(flowId)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const openModal = (lead: LeadDto) => {
    setSelectedLead(lead)
    setEditStatus(lead.status ?? '')
    setEditTier(lead.tier ?? '')
    setEditNotes(lead.notes ?? '')
  }

  const closeModal = () => setSelectedLead(null)

  const handleSave = async () => {
    if (!selectedLead) return
    await patchLead.mutateAsync({
      leadId: selectedLead.id,
      data: {
        status: editStatus || null,
        tier: editTier || null,
        notes: editNotes || null,
      },
    })
    closeModal()
  }

  const handleSort = (col: string) => {
    const field = SORTABLE[col]
    if (!field) return
    if (sortBy === field) {
      setSortDesc((d) => !d)
    } else {
      setSortBy(field)
      setSortDesc(true)
    }
  }

  return (
    <Wrapper>
      {/* ── Filter bar ── */}
      <FilterBar>
        <FilterTop>
          <SearchWrap>
            <SearchIcon><Search size={14} /></SearchIcon>
            <SearchInput
              placeholder="Search by name, email, company…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchInput && (
              <ClearBtn onClick={() => { setSearchInput(''); setSearch(''); }}>
                <X size={12} />
              </ClearBtn>
            )}
          </SearchWrap>

          <DateRange>
            <DateInput
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              title="From date"
            />
            <DateSep>—</DateSep>
            <DateInput
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              title="To date"
            />
          </DateRange>
        </FilterTop>

        <FilterChips>
          <FilterGroup>
            <FilterGroupLabel>Tier</FilterGroupLabel>
            <PillBtn $active={tier === null} onClick={() => setTier(null)}>All</PillBtn>
            {TIERS.map((t) => {
              const m = TIER_META[t]
              return (
                <TierPill
                  key={t}
                  $active={tier === t}
                  $color={m.color}
                  $bg={m.bg}
                  onClick={() => setTier(tier === t ? null : t)}
                >
                  {m.emoji} {t}
                </TierPill>
              )
            })}
          </FilterGroup>

          <FilterDivider />

          <FilterGroup>
            <FilterGroupLabel>Status</FilterGroupLabel>
            <PillBtn $active={status === null} onClick={() => setStatus(null)}>All</PillBtn>
            {STATUSES.map((s) => {
              const m = STATUS_META[s]
              return (
                <StatusPill
                  key={s}
                  $active={status === s}
                  $color={m.color}
                  $bg={m.bg}
                  onClick={() => setStatus(status === s ? null : s)}
                >
                  {s}
                </StatusPill>
              )
            })}
          </FilterGroup>
        </FilterChips>
      </FilterBar>

      {/* ── Table ── */}
      <TableWrap $fading={isFetching}>
        <TableHead style={{ gridTemplateColumns: GRID }}>
          {SORT_COLS.map((col, i) => {
            const field = SORTABLE[col.label]
            const active = field && sortBy === field
            return (
              <HeadCell
                key={col.label + i}
                $sortable={!!field}
                $active={!!active}
                onClick={() => handleSort(col.label)}
              >
                {col.label}
                {field && (
                  <SortIcon>
                    {active ? (
                      sortDesc ? <ChevronDown size={11} /> : <ChevronUp size={11} />
                    ) : (
                      <ChevronDown size={11} style={{ opacity: 0.3 }} />
                    )}
                  </SortIcon>
                )}
              </HeadCell>
            )
          })}
        </TableHead>

        {items.length === 0 && !isFetching && (
          <EmptyState>
            <EmptyIcon><User size={22} /></EmptyIcon>
            <EmptyText>No leads found</EmptyText>
            <EmptyHint>Try adjusting your filters</EmptyHint>
          </EmptyState>
        )}

        {items.map((lead) => {
          const tierMeta = lead.tier ? TIER_META[lead.tier] : null
          const statusMeta = lead.status ? STATUS_META[lead.status] : null
          return (
            <TableRow
              key={lead.id}
              style={{ gridTemplateColumns: GRID }}
              onClick={() => openModal(lead)}
            >
              <NameCell>
                <LeadName>{lead.fullName || '—'}</LeadName>
                {lead.email && <LeadEmail>{lead.email}</LeadEmail>}
              </NameCell>

              <Cell>
                <CellText>{lead.companyName || '—'}</CellText>
              </Cell>

              <Cell>
                {tierMeta ? (
                  <TierBadge $color={tierMeta.color} $bg={tierMeta.bg}>
                    {tierMeta.emoji} {lead.tier}
                  </TierBadge>
                ) : <MutedText>—</MutedText>}
              </Cell>

              <Cell>
                {statusMeta ? (
                  <StatusBadge $color={statusMeta.color} $bg={statusMeta.bg}>
                    {lead.status}
                  </StatusBadge>
                ) : <MutedText>—</MutedText>}
              </Cell>

              <Cell>
                {lead.score !== null ? (
                  <ScoreWrap>
                    <ScoreBar style={{ width: `${Math.min(100, lead.score)}%` }} />
                    <ScoreNum>{lead.score}</ScoreNum>
                  </ScoreWrap>
                ) : <MutedText>—</MutedText>}
              </Cell>

              <Cell><CellText>{fmtDuration(lead.timeToCompleteSeconds ?? lead.timeToComplete)}</CellText></Cell>

              <Cell><CellText>{fmtShortDate(lead.createdAt)}</CellText></Cell>
            </TableRow>
          )
        })}
      </TableWrap>

      {/* ── Pagination ── */}
      {total > PAGE_SIZE && (
        <Pagination>
          <PaginationInfo>{total} lead{total !== 1 ? 's' : ''}</PaginationInfo>
          <PaginationControls>
            <PageBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={14} />
            </PageBtn>
            <PageText>Page {page} of {totalPages}</PageText>
            <PageBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={14} />
            </PageBtn>
          </PaginationControls>
        </Pagination>
      )}

      {total > 0 && total <= PAGE_SIZE && (
        <TableFooter>
          <PaginationInfo>{total} lead{total !== 1 ? 's' : ''}</PaginationInfo>
        </TableFooter>
      )}

      {/* ── Lead modal ── */}
      {createPortal(
      <AnimatePresence>
        {selectedLead && (
          <Backdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeModal}
          >
            <ModalCard
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <ModalHeader>
                <ModalTitleBlock>
                  <ModalName>{selectedLead.fullName || 'Unknown Lead'}</ModalName>
                  <ModalMeta>
                    {selectedLead.email && <ModalMetaItem><Mail size={12} />{selectedLead.email}</ModalMetaItem>}
                    {selectedLead.phone && <ModalMetaItem><Phone size={12} />{selectedLead.phone}</ModalMetaItem>}
                  </ModalMeta>
                </ModalTitleBlock>
                <ModalCloseBtn onClick={closeModal}><X size={16} /></ModalCloseBtn>
              </ModalHeader>

              {/* Info grid */}
              <ModalBody>
                <ModalInfoGrid>
                  {selectedLead.companyName && (
                    <ModalInfoItem>
                      <ModalInfoIcon><Building2 size={13} /></ModalInfoIcon>
                      <ModalInfoContent>
                        <ModalInfoLabel>Company</ModalInfoLabel>
                        <ModalInfoValue>{selectedLead.companyName}</ModalInfoValue>
                      </ModalInfoContent>
                    </ModalInfoItem>
                  )}
                  {selectedLead.jobTitle && (
                    <ModalInfoItem>
                      <ModalInfoIcon><Briefcase size={13} /></ModalInfoIcon>
                      <ModalInfoContent>
                        <ModalInfoLabel>Job Title</ModalInfoLabel>
                        <ModalInfoValue>{selectedLead.jobTitle}</ModalInfoValue>
                      </ModalInfoContent>
                    </ModalInfoItem>
                  )}
                  {selectedLead.companySize && (
                    <ModalInfoItem>
                      <ModalInfoIcon><Hash size={13} /></ModalInfoIcon>
                      <ModalInfoContent>
                        <ModalInfoLabel>Company Size</ModalInfoLabel>
                        <ModalInfoValue>{selectedLead.companySize}</ModalInfoValue>
                      </ModalInfoContent>
                    </ModalInfoItem>
                  )}
                  {selectedLead.website && (
                    <ModalInfoItem>
                      <ModalInfoIcon><Globe size={13} /></ModalInfoIcon>
                      <ModalInfoContent>
                        <ModalInfoLabel>Website</ModalInfoLabel>
                        <ModalInfoValue>
                          <WebsiteLink href={selectedLead.website} target="_blank" rel="noopener noreferrer">
                            {selectedLead.website.replace(/^https?:\/\//, '')}
                            <ExternalLink size={10} />
                          </WebsiteLink>
                        </ModalInfoValue>
                      </ModalInfoContent>
                    </ModalInfoItem>
                  )}
                  {selectedLead.score !== null && (
                    <ModalInfoItem>
                      <ModalInfoIcon style={{ color: theme.colors.accent }}><Hash size={13} /></ModalInfoIcon>
                      <ModalInfoContent>
                        <ModalInfoLabel>Score</ModalInfoLabel>
                        <ModalInfoValue>{selectedLead.score}</ModalInfoValue>
                      </ModalInfoContent>
                    </ModalInfoItem>
                  )}
                  {(selectedLead.timeToCompleteSeconds != null || selectedLead.timeToComplete) && (
                    <ModalInfoItem>
                      <ModalInfoIcon><Clock size={13} /></ModalInfoIcon>
                      <ModalInfoContent>
                        <ModalInfoLabel>Time to Complete</ModalInfoLabel>
                        <ModalInfoValue>{fmtDuration(selectedLead.timeToCompleteSeconds ?? selectedLead.timeToComplete)}</ModalInfoValue>
                      </ModalInfoContent>
                    </ModalInfoItem>
                  )}
                  <ModalInfoItem>
                    <ModalInfoIcon><Calendar size={13} /></ModalInfoIcon>
                    <ModalInfoContent>
                      <ModalInfoLabel>Created</ModalInfoLabel>
                      <ModalInfoValue>{formatDate(selectedLead.createdAt)}</ModalInfoValue>
                    </ModalInfoContent>
                  </ModalInfoItem>
                </ModalInfoGrid>

                {/* Edit section */}
                <ModalEditSection>
                  <ModalEditTitle>Edit</ModalEditTitle>
                  <ModalEditRow>
                    <ModalFieldGroup>
                      <ModalFieldLabel>Status</ModalFieldLabel>
                      <ModalSelect value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        <option value="">— None —</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </ModalSelect>
                    </ModalFieldGroup>
                    <ModalFieldGroup>
                      <ModalFieldLabel>Tier</ModalFieldLabel>
                      <ModalSelect value={editTier} onChange={(e) => setEditTier(e.target.value)}>
                        <option value="">— None —</option>
                        {TIERS.map((t) => <option key={t} value={t}>{TIER_META[t].emoji} {t}</option>)}
                      </ModalSelect>
                    </ModalFieldGroup>
                  </ModalEditRow>
                  <ModalFieldGroup style={{ marginTop: 10 }}>
                    <ModalFieldLabel><StickyNote size={12} /> Notes</ModalFieldLabel>
                    <ModalTextarea
                      placeholder="Add a note about this lead…"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                    />
                  </ModalFieldGroup>
                </ModalEditSection>
              </ModalBody>

              {/* Footer */}
              <ModalFooter>
                <CancelBtn onClick={closeModal}>Cancel</CancelBtn>
                <SaveBtn
                  onClick={handleSave}
                  disabled={patchLead.isPending}
                >
                  {patchLead.isPending ? 'Saving…' : 'Save changes'}
                </SaveBtn>
              </ModalFooter>
            </ModalCard>
          </Backdrop>
        )}
      </AnimatePresence>,
      document.body
      )}
    </Wrapper>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`

// ── Filter bar ───────────────────────────────────────────────────────────────

const FilterBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: none;
  border-radius: ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0 0;
`

const FilterTop = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`

const SearchWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
`

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textTertiary};
  display: flex;
  pointer-events: none;
`

const SearchInput = styled.input`
  width: 100%;
  height: 34px;
  padding: 0 32px 0 32px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  outline: none;
  transition: border-color 0.15s;

  &::placeholder { color: ${({ theme }) => theme.colors.textTertiary}; }
  &:focus { border-color: ${({ theme }) => theme.colors.accent}; }
`

const ClearBtn = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.textTertiary}30;
  color: ${({ theme }) => theme.colors.textTertiary};
  cursor: pointer;
  padding: 0;

  &:hover { background: ${({ theme }) => theme.colors.textTertiary}50; }
`

const DateRange = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`

const DateSep = styled.span`
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
`

const DateInput = styled.input`
  height: 34px;
  padding: 0 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;

  &:focus { border-color: ${({ theme }) => theme.colors.accent}; }
  &::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
`

const FilterChips = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const FilterGroupLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 2px;
`

const FilterDivider = styled.div`
  width: 1px;
  height: 20px;
  background: ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
  margin: 0 4px;
`

const PillBtn = styled.button<{ $active: boolean }>`
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.accent : theme.colors.border};
  background: ${({ $active, theme }) => $active ? `${theme.colors.accent}15` : theme.colors.bgElevated};
  color: ${({ $active, theme }) => $active ? theme.colors.accent : theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.13s;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
  }
`

const TierPill = styled.button<{ $active: boolean; $color: string; $bg: string }>`
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid ${({ $active, $color, theme }) => $active ? $color : theme.colors.border};
  background: ${({ $active, $color, $bg, theme }) => $active ? $bg : theme.colors.bgElevated};
  color: ${({ $active, $color, theme }) => $active ? $color : theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.13s;
  white-space: nowrap;

  &:hover {
    border-color: ${({ $color }) => $color};
    color: ${({ $color }) => $color};
    background: ${({ $bg }) => $bg};
  }
`

const StatusPill = styled(TierPill)``

// ── Table ────────────────────────────────────────────────────────────────────

const TableWrap = styled.div<{ $fading: boolean }>`
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md};
  overflow: hidden;
  opacity: ${({ $fading }) => $fading ? 0.65 : 1};
  transition: opacity 0.2s;
`

const TableHead = styled.div`
  display: grid;
  padding: 0 16px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const HeadCell = styled.div<{ $sortable: boolean; $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 9px 6px;
  font-size: 10.5px;
  font-weight: 600;
  color: ${({ $active, theme }) => $active ? theme.colors.accent : theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.045em;
  cursor: ${({ $sortable }) => $sortable ? 'pointer' : 'default'};
  user-select: none;
  transition: color 0.12s;

  &:hover {
    color: ${({ $sortable, theme }) => $sortable ? theme.colors.accent : theme.colors.textTertiary};
  }
`

const SortIcon = styled.span`
  display: flex;
  align-items: center;
`

const TableRow = styled.div`
  display: grid;
  padding: 0 16px;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: background 0.12s;

  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.colors.bgElevated}; }
`

const Cell = styled.div`
  padding: 10px 6px;
  min-width: 0;
`

const NameCell = styled(Cell)`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const LeadName = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const LeadEmail = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textTertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CellText = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const MutedText = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`

const TierBadge = styled.div<{ $color: string; $bg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
`

const StatusBadge = styled.div<{ $color: string; $bg: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
`

const ScoreWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const ScoreBar = styled.div`
  height: 3px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.accent};
  max-width: 48px;
  transition: width 0.3s ease;
`

const ScoreNum = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 52px 24px;
  gap: 8px;
`

const EmptyIcon = styled.div`
  color: ${({ theme }) => theme.colors.textTertiary};
  opacity: 0.4;
`

const EmptyText = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyHint = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`

// ── Pagination ───────────────────────────────────────────────────────────────

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSurface};
  border-radius: 0 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md};
`

const TableFooter = styled(Pagination)``

const PaginationInfo = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
`

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const PageBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`

const PageText = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 90px;
  text-align: center;
`

// ── Modal ────────────────────────────────────────────────────────────────────

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.38);
  z-index: 200;
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const ModalCard = styled(motion.div)`
  position: relative;
  z-index: 201;
  width: min(600px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  background: ${({ theme }) => theme.colors.bgSurface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12);
`

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`

const ModalTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`

const ModalName = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.lg};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.3;
`

const ModalMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const ModalMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`

const ModalCloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.textTertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.12s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colors.border}; border-radius: 2px; }
`

const ModalInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

const ModalInfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 12px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: ${({ theme }) => theme.radii.sm};
`

const ModalInfoIcon = styled.div`
  display: flex;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: 2px;
  flex-shrink: 0;
`

const ModalInfoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`

const ModalInfoLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const ModalInfoValue = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  word-break: break-word;
`

const WebsiteLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;

  &:hover { text-decoration: underline; }
`

const ModalEditSection = styled.div`
  padding: 14px 16px;
  background: ${({ theme }) => theme.colors.bgElevated};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

const ModalEditTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
`

const ModalEditRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

const ModalFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const ModalFieldLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ModalSelect = styled.select`
  height: 34px;
  padding: 0 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgSurface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  outline: none;
  cursor: pointer;
  transition: border-color 0.14s;

  &:focus { border-color: ${({ theme }) => theme.colors.accent}; }
`

const ModalTextarea = styled.textarea`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgSurface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.14s;
  box-sizing: border-box;

  &::placeholder { color: ${({ theme }) => theme.colors.textTertiary}; }
  &:focus { border-color: ${({ theme }) => theme.colors.accent}; }
`

const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`

const CancelBtn = styled.button`
  height: 34px;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgElevated};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const SaveBtn = styled.button`
  height: 34px;
  padding: 0 20px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: none;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  cursor: pointer;
  transition: opacity 0.12s;

  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.5; cursor: default; }
`
