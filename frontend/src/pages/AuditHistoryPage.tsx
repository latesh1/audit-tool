import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { auditApi } from '../services/api';
import { AuditSummary } from '../types/audit';
import { 
  History, Search, Filter, Trash2, ArrowRight, 
  RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Eye 
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { EmptyState } from '../components/common/EmptyState';
import { usePolling } from '../hooks/usePolling';
import { LiveIndicator } from '../components/common/LiveIndicator';

export const AuditHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAudits = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await auditApi.getAudits({
        page,
        per_page: 10,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setAudits(res.data);
      if (res.meta) {
        setTotalPages(res.meta.last_page);
        setTotalRecords(res.meta.total);
      }
    } catch (err) {
      console.error('Failed to load audit history', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  // Realtime polling every 10 seconds, auto-pausing when tab is hidden
  const { isPolling, lastUpdated, triggerNow } = usePolling(
    () => fetchAudits(false),
    10000,
    { immediate: false, pauseOnHidden: true }
  );

  useEffect(() => {
    fetchAudits(true);
  }, [fetchAudits]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAudits(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await auditApi.deleteAudit(deleteTargetId);
      setDeleteTargetId(null);
      fetchAudits(true);
    } catch (err) {
      console.error('Failed to delete audit', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Audit Repository</h2>
            <LiveIndicator
              lastUpdated={lastUpdated}
              isPolling={isPolling}
              onRefresh={() => triggerNow()}
              label="Live"
            />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalRecords} historical audit record{totalRecords === 1 ? '' : 's'} stored in database
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search domain, URL, industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 w-56 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="partially_completed">Partial Results</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
          </select>

          <button
            type="button"
            onClick={() => triggerNow()}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl"
            title="Refresh history"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Audits Table */}
      {audits.length === 0 && !isLoading ? (
        <EmptyState
          icon={History}
          title="No Matching Audits Found"
          description="Try adjusting your search criteria or create a new audit to inspect website health."
          actionText="Run New Audit"
          actionHref="/new-audit"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Target Website</th>
                  <th className="px-5 py-3.5">Competitors</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Overall</th>
                  <th className="px-5 py-3.5">SEO</th>
                  <th className="px-5 py-3.5">UX</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-400">
                      #{audit.id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 truncate max-w-xs">{audit.normalized_domain}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{audit.primary_url}</div>
                      {audit.industry && (
                        <span className="inline-block mt-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {audit.industry}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {audit.competitor_count > 0 ? (
                        <div>
                          <span className="font-semibold text-indigo-600 block">
                            {audit.competitor_count} competitor{audit.competitor_count > 1 ? 's' : ''}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                            {audit.competitor_domains.join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      <div>{new Date(audit.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(audit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={audit.status} />
                    </td>
                    <td className="px-5 py-4">
                      <ScoreBadge score={audit.overall_score} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      <ScoreBadge score={audit.seo_score} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      <ScoreBadge score={audit.ux_score} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/audits/${audit.id}`}
                          className="p-1.5 text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          title="View Full Report"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(audit.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                          title="Delete Audit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Delete Audit #{deleteTargetId}?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This will permanently delete this audit record, extracted website snapshots, and AI report findings from the database.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
