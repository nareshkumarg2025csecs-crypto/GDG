import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ArrowLeft,
  Home,
  Search,
  Download,
  FileText,
  ExternalLink,
  TableProperties,
  ClipboardList,
  CheckCircle2,
  Check,
  RefreshCw,
  X,
  Key,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { formService } from '@/services/formService';
import { eventService } from '@/services/eventService';
import { toast } from '@/hooks/use-toast';
import {
  type EventForm,
  type FormSubmission,
  formatEventDate,
} from '@/lib/formUtils';

export const AdminSubmissionsPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();

  const [form, setForm] = useState<EventForm | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState<string | null>(null);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  useEffect(() => {
    if (!formId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [formRes, subsRes] = await Promise.all([
          formService.getFormById(formId),
          formService.getFormSubmissions(formId),
        ]);

        setForm(formRes.form);
        setSubmissions(subsRes.submissions || []);
      } catch (err: any) {
        toast({
          title: 'Error loading submissions',
          description: err.message || 'Could not fetch student responses.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [formId]);

  const fields = form?.schema?.fields || [];

  const handleToggleAttendance = async (submissionId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setUpdatingAttendanceId(submissionId);

    // Optimistic UI update
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, attended: newStatus } : s))
    );

    try {
      await formService.updateSubmissionAttendance(submissionId, newStatus);
      toast({
        title: newStatus ? 'Marked Attended' : 'Attendance Reset',
        description: newStatus
          ? 'Student participation has been marked and verified.'
          : 'Attendance marked as not attended.',
      });
    } catch (err: any) {
      // Revert optimistic update
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, attended: currentStatus } : s))
      );
      toast({
        title: 'Update failed',
        description: err.message || 'Could not update attendance status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingAttendanceId(null);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const answersText = Object.values(sub.answers || {}).join(' ').toLowerCase();
    return answersText.includes(q) || sub.user_id.toLowerCase().includes(q);
  });

  // ── Export as JSON ─────────────────────────────────────────────────────────
  const exportToJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(submissions, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `${form?.title || 'submissions'}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast({ title: 'JSON exported', description: 'Submissions saved as JSON.' });
  };

  // ── Export as CSV (opens cleanly in Google Sheets / Excel with text formatting) ──
  const exportToCsv = () => {
    if (submissions.length === 0) {
      toast({ title: 'No data', description: 'There are no submissions to export.' });
      return;
    }

    const headerRow = ['#', 'Submitted At', 'Attendance Status', ...fields.map((f) => f.label)];
    const rows = filteredSubmissions.map((sub, idx) => {
      const base = [
        String(idx + 1),
        new Date(sub.submitted_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        sub.attended ? 'Attended' : 'Not Attended',
      ];
      const fieldVals = fields.map((f) => {
        const val = sub.answers ? sub.answers[f.name || f.id] : '';
        if (val === null || val === undefined) return '';
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        return String(val);
      });
      return [...base, ...fieldVals];
    });

    // Format cell: force phone numbers, IDs, and long numeric values as text formulas ="..."
    // so that Excel does NOT convert them into scientific notation (e.g. 9.87654E+9)
    const escape = (cell: string, colIdx?: number) => {
      const trimmed = cell.trim();
      // Match phone numbers / numeric-looking values with 7 or more digits or leading plus
      const isNumericLike = /^\+?[0-9]{7,}$/.test(trimmed);
      const field = colIdx !== undefined && colIdx >= 3 ? fields[colIdx - 3] : null;
      const isPhoneOrIdField =
        field && /phone|mobile|contact|roll|reg|id|num/i.test(field.name || field.label);

      if (isNumericLike || (isPhoneOrIdField && /^[0-9+ -]+$/.test(trimmed))) {
        // Excel formula text representation: ="value"
        return `="""${trimmed.replace(/"/g, '""""')}"""`;
      }
      return `"${cell.replace(/"/g, '""')}"`;
    };

    const csv = [
      headerRow.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((r) => r.map((cell, cIdx) => escape(cell, cIdx)).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel compat
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form?.title || 'submissions'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exported', description: 'Phone numbers and IDs formatted as full text.' });
  };

  // ── On-Demand Sync with Google Sheet ─────────────────────────────────────────
  const handleSyncSheet = async () => {
    if (!formId) return;
    setIsSyncingSheet(true);
    try {
      const res = await eventService.syncSheetForAdmin(formId);
      toast({
        title: 'Google Sheet Synced',
        description: res.message || `Successfully synced ${submissions.length} rows to the sheet.`,
      });
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (
        errMsg.toLowerCase().includes('authorization') ||
        errMsg.toLowerCase().includes('connect') ||
        errMsg.toLowerCase().includes('permission') ||
        err?.status === 502
      ) {
        setShowConnectModal(true);
      } else {
        toast({
          title: 'Sync Failed',
          description: errMsg || 'Could not sync submissions to Google Sheet.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // ── Authorize Google Sheets (Token only, doesn't change login) ───────────────
  const handleAuthorizeGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      localStorage.setItem('auth_link_redirect', window.location.pathname);
      const { url } = await eventService.getGoogleLinkUrl();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No Google link URL generated.');
      }
    } catch (err: any) {
      toast({
        title: 'Authorization Error',
        description: err.message || 'Could not start Google authorization.',
        variant: 'destructive',
      });
      setIsConnectingGoogle(false);
    }
  };

  // ── Sheets link from form schema ───────────────────────────────────────────
  const sheetsLink: string | undefined =
    (form as any)?.schema?.sheets_url ||
    (form as any)?.sheets_url;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/events"
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Admin Events"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link
              to="/"
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Go to Homepage"
            >
              <Home className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-google-blue">SUBMISSIONS REPORT</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {submissions.length} Total Registrations
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-sans">{form?.title || 'Form Submissions'}</h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* Google Sheets Link & Sync (if admin set one) */}
            {sheetsLink && (
              <>
                <button
                  type="button"
                  disabled={isSyncingSheet}
                  onClick={handleSyncSheet}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-google-green/40 bg-google-green/10 text-google-green text-xs sm:text-sm font-semibold shadow-sm hover:bg-google-green/20 disabled:opacity-50 transition-all"
                  title="Sync current submissions to Google Sheet"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSheet ? 'Syncing...' : 'Sync Sheet'}</span>
                </button>

                <a
                  href={sheetsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-foreground text-xs sm:text-sm font-semibold shadow-sm hover:bg-muted transition-all"
                >
                  <TableProperties className="w-4 h-4 text-google-green" />
                  <span>Open Sheet</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              </>
            )}

            {/* Export CSV → Google Sheets compatible */}
            <button
              type="button"
              onClick={exportToCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-google-green/30 bg-card hover:bg-google-green/10 text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              <TableProperties className="w-4 h-4 text-google-green" />
              <span>Export CSV</span>
            </button>

            {/* Export JSON */}
            <button
              type="button"
              onClick={exportToJson}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-google-blue" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Sheets link banner (when linked) */}
        {sheetsLink && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-google-green/10 border border-google-green/25 text-sm">
            <TableProperties className="w-5 h-5 text-google-green shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-google-green">Live Google Sheet Connected</p>
              <p className="text-muted-foreground text-xs mt-0.5 truncate">
                New submissions are automatically appended to:{' '}
                <a href={sheetsLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-google-green">
                  {sheetsLink}
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Search Filter */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue"
            />
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {filteredSubmissions.length} of {submissions.length} shown
          </span>
        </div>

        {/* Submissions Table */}
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed rounded-2xl bg-card/50">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-bold">No submissions yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No responses match your search.'
                : 'When students register for this event, their responses will appear here.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-muted/70 text-muted-foreground border-b border-border font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Attendance</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Submitted At</th>
                    {fields.map((f) => (
                      <th key={f.id} className="py-3.5 px-4 whitespace-nowrap">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSubmissions.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">{idx + 1}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={updatingAttendanceId === sub.id}
                          onClick={() => handleToggleAttendance(sub.id, Boolean(sub.attended))}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono transition-all shadow-sm ${
                            sub.attended
                              ? 'bg-google-green text-white hover:bg-google-green/90 shadow-google-green/20'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground border border-border'
                          }`}
                          title="Click to toggle verified attendance status"
                        >
                          {sub.attended ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Attended</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                              <span>Mark Attendance</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(sub.submitted_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      {fields.map((f) => {
                        const val = sub.answers ? sub.answers[f.name || f.id] : null;
                        return (
                          <td key={f.id} className="py-3.5 px-4 max-w-xs truncate">
                            {val !== undefined && val !== null ? (
                              typeof val === 'boolean' ? (
                                val ? 'Yes' : 'No'
                              ) : (
                                String(val)
                              )
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Google Sheets Authorization Modal (Token Only) ── */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setShowConnectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-7 space-y-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-google-green/10 border border-google-green/20 flex items-center justify-center flex-shrink-0">
                    <TableProperties className="w-6 h-6 text-google-green" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Authorize Google Sheets</h3>
                    <p className="text-xs text-muted-foreground font-mono">Token Access Only</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Explainer */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 text-google-green" />
                  <span>No login change — token access only</span>
                </div>
                <p>
                  Google requires write permissions to append attendee rows directly into your spreadsheet.
                </p>
                <p>
                  Clicking below opens Google's consent screen. Once approved, you will return straight back to this page and your admin login will remain active.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  disabled={isConnectingGoogle}
                  onClick={handleAuthorizeGoogle}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-google-green hover:bg-google-green/90 text-white text-xs sm:text-sm font-bold shadow-md transition-all disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>{isConnectingGoogle ? 'Connecting...' : 'Authorize Google Sheets'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-3 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSubmissionsPage;
