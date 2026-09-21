import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Play,
  Save,
  RotateCcw,
  UploadCloud,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Users,
  Send,
  Eye,
  Copy,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ExternalLink,
  Mail,
  FileText,
  Sliders,
  ShieldCheck,
  Info,
  Sparkles,
  StopCircle,
  ArrowLeft,
  Home,
  Calendar,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { eventService } from '@/services/eventService';
import {
  certificateService,
  type EventCertificateConfig,
  type AttendedParticipant,
  type CertificateAsset,
  type JobProgressResponse,
} from '@/services/certificateService';
import type { ClubEvent } from '@/lib/formUtils';
import { toast } from '@/hooks/use-toast';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';

export const AdminCertificatesPage: React.FC = () => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Events & selection
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Active Workspace Tab: 'editor' | 'participants'
  const [activeTab, setActiveTab] = useState<'editor' | 'participants'>('editor');

  // Certificate Configuration State
  const [config, setConfig] = useState<EventCertificateConfig | null>(null);
  const [scriptCode, setScriptCode] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'png'>('pdf');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);

  // Live Preview State
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Assets Management State
  const [assets, setAssets] = useState<CertificateAsset[]>([]);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  // Attended Participants State
  const [participants, setParticipants] = useState<AttendedParticipant[]>([]);
  const [totalAttended, setTotalAttended] = useState(0);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<Set<string>>(new Set());
  const [participantFilter, setParticipantFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State for Large Attendee Lists
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Batch Job Progress Modal State
  const [activeJob, setActiveJob] = useState<JobProgressResponse | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [isStartingDispatch, setIsStartingDispatch] = useState(false);
  const [isCancellingJob, setIsCancellingJob] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Check if code or settings have unsaved modifications
  const isDirty = useMemo(() => {
    if (!config) return false;
    return (
      scriptCode !== config.scriptCode ||
      outputFormat !== config.outputFormat ||
      emailSubject !== config.emailSubject ||
      emailBody !== config.emailBody
    );
  }, [config, scriptCode, outputFormat, emailSubject, emailBody]);

  // 1. Fetch Events List on Mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
        const res = await eventService.listEvents();
        if (res?.events?.length) {
          setEvents(res.events);
          setSelectedEventId(res.events[0].id);
        }
      } catch {
        toast({
          title: 'Failed to load events',
          description: 'Could not retrieve events list from server.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // 2. Fetch Assets List
  const fetchAssets = async () => {
    try {
      const res = await certificateService.listAssets(token);
      setAssets(res.assets || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [token]);

  // 3. Load Event Config & Attended Attendees when selectedEventId changes
  useEffect(() => {
    if (!selectedEventId) return;

    const loadEventDetails = async () => {
      try {
        setIsLoadingConfig(true);
        setIsLoadingParticipants(true);
        setCurrentPage(1);

        // Fetch certificate configuration
        const cfg = await certificateService.getEventConfig(selectedEventId, token);
        const fallbackSubject =
          cfg.defaultEmailSubject || `Your Certificate of Participation: ${cfg.eventTitle}`;
        const fallbackBody =
          cfg.defaultEmailBody ||
          `Hi {attendee_name},\n\nCongratulations on attending "${cfg.eventTitle}"! Please find your official certificate of participation attached below.\n\nBest regards,\nGoogle Developer Groups (GDG)`;

        setConfig(cfg);
        setScriptCode(cfg.scriptCode);
        setOutputFormat(cfg.outputFormat === 'png' ? 'png' : 'pdf');
        setEmailSubject(cfg.emailSubject && cfg.emailSubject.trim() ? cfg.emailSubject : fallbackSubject);
        setEmailBody(cfg.emailBody && cfg.emailBody.trim() ? cfg.emailBody : fallbackBody);

        // Fetch attended participants
        const pRes = await certificateService.getAttendedParticipants(selectedEventId, token);
        setParticipants(pRes.participants || []);
        setTotalAttended(pRes.totalAttended || 0);

        // Auto-select pending attendees by default
        const pendingIds = new Set(
          (pRes.participants || []).filter((p) => !p.certificateSent).map((p) => p.id)
        );
        setSelectedSubmissionIds(pendingIds);

        // Auto generate fresh preview
        handleGeneratePreview(selectedEventId, cfg.scriptCode);
      } catch (err: any) {
        toast({
          title: 'Failed to load event certificate',
          description: err.message || 'Could not load certificate settings for this event.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingConfig(false);
        setIsLoadingParticipants(false);
      }
    };

    loadEventDetails();
  }, [selectedEventId, token]);

  // 4. Generate Preview
  const handleGeneratePreview = async (eventId = selectedEventId, code = scriptCode) => {
    if (!eventId) return;
    try {
      setIsGeneratingPreview(true);
      const res = await certificateService.previewCertificate({ eventId, scriptCode: code }, token);
      if (res.dataUrl) {
        setPreviewDataUrl(res.dataUrl);
      }
    } catch (err: any) {
      toast({
        title: 'Preview Generation Failed',
        description: err.message || 'Check your Python script for syntax or drawing errors.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // 5. Save Configuration (Dual-persists to DB)
  const handleSaveConfig = async () => {
    if (!selectedEventId) return;
    try {
      setIsSavingConfig(true);
      const res = await certificateService.saveEventConfig(
        selectedEventId,
        {
          scriptCode,
          outputFormat,
          emailSubject,
          emailBody,
        },
        token
      );

      // Immediately sync local config state so it marks as saved
      setConfig((prev) =>
        prev
          ? {
              ...prev,
              scriptCode,
              outputFormat,
              emailSubject,
              emailBody,
              hasCustomCode: true,
              updatedAt: res?.updatedAt || new Date().toISOString(),
            }
          : prev
      );

      toast({
        title: 'Certificate Code Saved',
        description: 'Python script and email template have been permanently saved for this event.',
      });

      // Refresh preview to confirm changes
      handleGeneratePreview(selectedEventId, scriptCode);
    } catch (err: any) {
      toast({
        title: 'Failed to save configuration',
        description: err.message || 'Could not save certificate settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // 6. Load Default Template
  const handleLoadDefaultTemplate = async () => {
    try {
      setIsLoadingDefault(true);
      let defaultCode = config?.defaultScriptCode;
      let defaultSub = config?.defaultEmailSubject;
      let defaultTxt = config?.defaultEmailBody;

      if (!defaultCode) {
        const res = await certificateService.getDefaultTemplate(token, selectedEvent?.title);
        defaultCode = res.defaultScriptCode;
        defaultSub = res.defaultEmailSubject;
        defaultTxt = res.defaultEmailBody;
      }

      if (defaultCode) {
        setScriptCode(defaultCode);
        if (!emailSubject.trim() && defaultSub) {
          setEmailSubject(defaultSub);
        }
        if (!emailBody.trim() && defaultTxt) {
          setEmailBody(defaultTxt);
        }
        toast({
          title: 'Default Template Loaded',
          description: 'Official GDG Certificate Python code loaded into editor. Click "Save Code" when ready to persist.',
        });
        handleGeneratePreview(selectedEventId, defaultCode);
      }
    } catch {
      toast({
        title: 'Failed to load default template',
        description: 'Could not fetch default certificate template.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDefault(false);
    }
  };

  // 7. Load Default Email Subject & Body
  const handleLoadDefaultEmail = () => {
    const defaultSubject =
      config?.defaultEmailSubject ||
      `Your Certificate of Participation: ${selectedEvent?.title || 'GDG Event'}`;
    const defaultBody =
      config?.defaultEmailBody ||
      `Hi {attendee_name},\n\nCongratulations on attending "${selectedEvent?.title || 'GDG Event'}"! Please find your official certificate of participation attached below.\n\nBest regards,\nGoogle Developer Groups (GDG)`;

    setEmailSubject(defaultSubject);
    setEmailBody(defaultBody);

    toast({
      title: 'Default Email Loaded',
      description: 'Official email subject and message template restored. Click "Save Code" to apply.',
    });
  };

  // 7. Upload Graphic Asset (Logo/Background)
  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAsset(true);
      const res = await certificateService.uploadAsset(file, token);
      toast({
        title: 'Asset Uploaded',
        description: `"${res.asset.filename}" is now available in your Python code via get_asset("${res.asset.filename}").`,
      });
      await fetchAssets();
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err.message || 'Could not upload graphic asset.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAsset(false);
      if (assetFileInputRef.current) {
        assetFileInputRef.current.value = '';
      }
    }
  };

  // 8. Copy Field or Asset Path Helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({
      title: 'Copied to clipboard',
      description: `${label} copied. Ready to paste in Python script.`,
    });
  };

  // Copy Entire Script Code to Clipboard
  const handleCopyAllCode = () => {
    if (!scriptCode) return;
    navigator.clipboard.writeText(scriptCode);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2000);
    toast({
      title: 'Code Copied',
      description: 'Python certificate generator code copied to clipboard.',
    });
  };

  // 9. Filtered participants list based on status & search
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      if (participantFilter === 'pending' && p.certificateSent) return false;
      if (participantFilter === 'sent' && !p.certificateSent) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchEmail = p.email.toLowerCase().includes(q);
        const matchTicket = (p.ticketId || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchTicket) return false;
      }

      return true;
    });
  }, [participants, participantFilter, searchQuery]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [participantFilter, searchQuery]);

  // Paged slice of participants for smooth DOM rendering of huge lists
  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / pageSize));
  const pagedParticipants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredParticipants.slice(start, start + pageSize);
  }, [filteredParticipants, currentPage, pageSize]);

  // Selection helpers
  const toggleSelectAllFiltered = () => {
    if (selectedSubmissionIds.size === filteredParticipants.length) {
      setSelectedSubmissionIds(new Set());
    } else {
      setSelectedSubmissionIds(new Set(filteredParticipants.map((p) => p.id)));
    }
  };

  const toggleSelectVisiblePage = () => {
    const visibleIds = pagedParticipants.map((p) => p.id);
    const allVisibleSelected = visibleIds.every((id) => selectedSubmissionIds.has(id));

    setSelectedSubmissionIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectParticipant = (id: string) => {
    setSelectedSubmissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 10. Start High-Volume Batch Dispatch
  const handleStartBatchDispatch = async () => {
    if (selectedSubmissionIds.size === 0) {
      toast({
        title: 'No participants selected',
        description: 'Please select at least one attended participant to dispatch certificates.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsStartingDispatch(true);
      // Auto-save latest config before dispatching
      await certificateService.saveEventConfig(
        selectedEventId,
        { scriptCode, outputFormat, emailSubject, emailBody },
        token
      );

      const res = await certificateService.dispatchCertificates(
        {
          eventId: selectedEventId,
          submissionIds: Array.from(selectedSubmissionIds),
        },
        token
      );

      setShowJobModal(true);
      startPollingJob(res.jobId);
    } catch (err: any) {
      toast({
        title: 'Could not start dispatch',
        description: err.message || 'Failed to trigger batch certificate job.',
        variant: 'destructive',
      });
    } finally {
      setIsStartingDispatch(false);
    }
  };

  // 11. Polling Job Progress
  const startPollingJob = (jobId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const progress = await certificateService.getJobProgress(jobId, token);
        setActiveJob(progress);

        if (
          progress.status === 'completed' ||
          progress.status === 'failed' ||
          progress.status === 'cancelled'
        ) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          // Refresh participants table when job finishes
          const pRes = await certificateService.getAttendedParticipants(selectedEventId, token);
          setParticipants(pRes.participants || []);
        }
      } catch {
        // ignore polling network hiccup
      }
    }, 1200);
  };

  // 12. Cancel Running Batch Job
  const handleCancelBatchJob = async () => {
    if (!activeJob?.jobId) return;
    try {
      setIsCancellingJob(true);
      await certificateService.cancelJob(activeJob.jobId, token);
      toast({
        title: 'Batch Cancelled',
        description: 'Certificate batch generation has been safely stopped.',
      });
    } catch (err: any) {
      toast({
        title: 'Could not cancel batch',
        description: err.message || 'Failed to cancel job.',
        variant: 'destructive',
      });
    } finally {
      setIsCancellingJob(false);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-500/20">
      {/* Top Bar with Dedicated Back Button (replaces standard site navigation header) */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Prominent Back Button */}
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/admin/events');
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 shrink-0"
              title="Back to Previous Page"
            >
              <ArrowLeft className="w-4 h-4 text-blue-500" />
              <span>Back</span>
            </button>

            <Link
              to="/admin/events"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-sm shrink-0"
              title="Back to Admin Events"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Events</span>
            </Link>

            <Link
              to="/"
              className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm shrink-0"
              title="Go to Homepage"
            >
              <Home className="w-4 h-4" />
            </Link>

            <div className="h-4 w-px bg-border hidden sm:block shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                <Award className="w-3 h-3" />
                Certificates Studio
              </span>
              {selectedEvent && (
                <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-[320px]">
                  {selectedEvent.title}
                </span>
              )}
            </div>
          </div>

          {/* Event Selection Dropdown right in the top bar */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-semibold text-muted-foreground hidden lg:inline-block shrink-0">
              Event:
            </label>
            <div className="relative w-44 sm:w-60 md:w-68">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={isLoadingEvents}
                className="w-full appearance-none px-3 py-1.5 pr-8 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm truncate"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full pt-6 sm:pt-8 pb-16 px-3 sm:px-6 lg:px-8 space-y-6">
        {/* ========================================================================= */}
        {/* HEADER BAR                                                                */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 font-mono">
                <Award className="w-3.5 h-3.5" />
                Admin Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight font-sans">
              Certificates Studio
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              Python Pillow certificate generator with dynamic placeholders, attendance verification, and high-volume email dispatch.
            </p>
          </div>

          {/* Event Selection Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-semibold text-muted-foreground shrink-0">
              Select Event:
            </label>
            <div className="relative w-full sm:w-64 md:w-72">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={isLoadingEvents}
                className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-border bg-card text-foreground text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABS NAVIGATION                                                           */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-1 sm:pb-0">
          <div className="flex overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'editor'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Python Studio & Design</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('participants')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'participants'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Attended Participants</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {totalAttended}
              </span>
            </button>
          </div>

          {/* Quick summary pill */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground pt-1 sm:pt-0">
            <span>
              Attended: <strong className="text-foreground">{totalAttended}</strong>
            </span>
            <span>•</span>
            <span>
              Sent:{' '}
              <strong className="text-emerald-500">
                {participants.filter((p) => p.certificateSent).length}
              </strong>
            </span>
            <span>•</span>
            <span>
              Pending:{' '}
              <strong className="text-blue-500">
                {participants.filter((p) => !p.certificateSent).length}
              </strong>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PYTHON STUDIO & DESIGN                                             */}
        {/* ========================================================================= */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Python Editor & Email Settings (7 cols on desktop, 12 on mobile/tablet) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Editor Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-blue-500" />
                    generator.py
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                    Python 3.12 • Pillow (PIL)
                  </span>

                  {/* Save status badge */}
                  {isDirty ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      ● Unsaved Changes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3" /> Code Saved
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Format Selector */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground font-medium text-[11px]">Format:</span>
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as any)}
                      className="px-2 py-1.5 rounded-lg border border-border bg-card text-xs font-bold focus:outline-none"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="png">PNG Image</option>
                    </select>
                  </div>

                  {/* Load Default Code Button */}
                  <button
                    type="button"
                    onClick={handleLoadDefaultTemplate}
                    disabled={isLoadingDefault}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                    title="Restore official GDG certificate Python code template"
                  >
                    {isLoadingDefault ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span>Load Default Code</span>
                  </button>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSavingConfig ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Code</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Form Field Badges Toolbar (Click to Copy) */}
              <div className="bg-card p-3.5 rounded-2xl border border-border space-y-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Click variable to copy & insert into script:</span>
                  </p>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Includes all live form fields & attendee answers
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Standard Attendee & Event Fields */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-muted-foreground block mb-1.5">
                      Standard Event & Attendee Fields
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {config?.availableFields
                        .filter((f) => !f.key.includes('answers.'))
                        .map((f) => {
                          const cleanKey = f.key.replace(/[{}]/g, '');
                          const copySnippet = `data.get("${cleanKey}")`;
                          return (
                            <button
                              key={f.key}
                              type="button"
                              onClick={() => copyToClipboard(copySnippet, f.key)}
                              title={`${f.label} • Sample: "${f.sample}" (Copies: ${copySnippet})`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-muted hover:bg-blue-500/15 text-foreground hover:text-blue-500 border border-border transition-all shadow-2xs"
                            >
                              {copiedKey === f.key ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60" />
                              )}
                              <span>{f.key}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Form Registration Fields */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-google-blue block mb-1.5">
                      Registration Form Fields ({config?.availableFields.filter((f) => f.key.includes('answers.')).length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {config?.availableFields
                        .filter((f) => f.key.includes('answers.'))
                        .map((f) => {
                          const cleanKey = f.key.replace(/[{}]/g, '');
                          const subKey = cleanKey.replace('answers.', '');
                          const copySnippet = `answers.get("${subKey}")`;
                          return (
                            <button
                              key={f.key}
                              type="button"
                              onClick={() => copyToClipboard(copySnippet, f.key)}
                              title={`${f.label} • Sample: "${f.sample}" (Copies: ${copySnippet})`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all shadow-2xs"
                            >
                              {copiedKey === f.key ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60 text-blue-500" />
                              )}
                              <span>{f.key}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monaco Code Editor */}
              <div className="relative rounded-2xl border border-border bg-[#1e1e1e] overflow-hidden shadow-lg">
                {/* Editor Top Bar with File Details & Copy Button */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] dark:bg-[#18181b] border-b border-[#333333] dark:border-border text-xs select-none">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 items-center mr-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80 inline-block" />
                    </div>
                    <div className="h-3.5 w-px bg-white/10 dark:bg-border mx-0.5" />
                    <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                      <FileCode className="w-3.5 h-3.5 text-blue-400" />
                      generator.py
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-medium border border-blue-500/30">
                      Python 3
                    </span>
                  </div>

                  {/* Copy Button at Right Top */}
                  <button
                    type="button"
                    onClick={handleCopyAllCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-100 transition-all border border-white/15 dark:border-zinc-700 active:scale-95 shadow-sm"
                    title="Copy entire Python code to clipboard"
                  >
                    {isCodeCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Monaco Editor Instance */}
                <div className="w-full">
                  <Editor
                    height="530px"
                    language="python"
                    theme={theme === 'light' ? 'light' : 'vs-dark'}
                    value={scriptCode}
                    onChange={(value) => setScriptCode(value || '')}
                    loading={
                      <div className="h-[530px] flex items-center justify-center bg-[#1e1e1e] text-zinc-400 text-xs font-mono gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Loading Monaco Python Editor...</span>
                      </div>
                    }
                    options={{
                      fontSize: 13,
                      fontFamily: "'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
                      fontLigatures: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                      renderLineHighlight: 'all',
                      tabSize: 4,
                      insertSpaces: true,
                      wordWrap: 'on',
                      automaticLayout: true,
                      padding: { top: 12, bottom: 12 },
                      scrollbar: {
                        vertical: 'visible',
                        horizontal: 'visible',
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                      },
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                    }}
                  />
                </div>
              </div>

              {/* Email Message Settings Card */}
              <div className="bg-card p-4 rounded-2xl border border-border space-y-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                      Email Message Template
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadDefaultEmail}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-[11px] font-semibold transition-all shadow-sm"
                    title="Reset email subject and message body to default GDG template"
                  >
                    <RotateCcw className="w-3 h-3 text-muted-foreground" />
                    <span>Load Default Email</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Your Certificate of Participation: {event_title}"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    Email Body (Supports {`{attendee_name}`} and {`{event_title}`})
                  </label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y leading-relaxed"
                    placeholder="Hi {attendee_name},\n\nCongratulations on attending..."
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Live Certificate Preview & Graphic Assets (5 cols on desktop, 12 on mobile/tablet) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Live Certificate Preview Card */}
              <div className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">
                      Live Rendering Preview
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleGeneratePreview()}
                      disabled={isGeneratingPreview}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-colors disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isGeneratingPreview ? 'animate-spin' : ''}`}
                      />
                      <span>Re-render</span>
                    </button>

                    {previewDataUrl && (
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-google-blue hover:bg-google-blue/90 text-white text-xs font-semibold transition-colors"
                        title="View Full High-Resolution"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Full HD</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview Canvas Container */}
                <div className="relative aspect-[16/9] w-full rounded-xl border border-border bg-[#161b22] flex items-center justify-center overflow-hidden shadow-sm group">
                  {isGeneratingPreview ? (
                    <div className="text-center space-y-2 p-4">
                      <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-muted-foreground font-mono">Running Python script...</p>
                    </div>
                  ) : previewDataUrl ? (
                    <img
                      src={previewDataUrl}
                      alt="Certificate Preview"
                      className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                      onClick={() => setShowPreviewModal(true)}
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2 text-muted-foreground">
                      <Award className="w-10 h-10 mx-auto opacity-40" />
                      <p className="text-xs font-medium">Click "Re-render" to preview your Python design.</p>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Sample preview uses realistic mock student data.
                </p>
              </div>

              {/* Graphic Resources & Logos Drawer */}
              <div className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">
                        Graphic Resources & Logos
                      </h3>
                      <p className="text-[10px] text-muted-foreground">
                        Loaded via <code className="text-blue-500 font-mono">get_asset("filename")</code>
                      </p>
                    </div>
                  </div>

                  {/* Upload Button */}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors border border-border">
                    <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      ref={assetFileInputRef}
                      onChange={handleUploadAsset}
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      disabled={isUploadingAsset}
                    />
                  </label>
                </div>

                {/* Asset Files Grid */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-border/60">
                  {assets.map((ast) => (
                    <div key={ast.filename} className="pt-2 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono font-bold text-foreground truncate">{ast.filename}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {(ast.size / 1024).toFixed(1)} KB {ast.isDefault ? '• Built-in' : '• Custom'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(`get_asset("${ast.filename}")`, ast.filename)
                        }
                        title="Copy python loader expression"
                        className="shrink-0 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedKey === ast.filename ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Helper Tips */}
              <div className="p-3.5 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-blue-400 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>Large Scale Safety & Crash Guard</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  The batch generator uses a bounded worker pool (3 concurrent workers), throttled 250ms spacing, and automatic rate-limit retries. Even with thousands of attendees, memory and CPU remain strictly controlled without crashing the server.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ATTENDED PARTICIPANTS & BATCH DISPATCH                              */}
        {/* ========================================================================= */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            {/* Action Bar: Filters, Search, and Send Button */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
              {/* Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                <div className="flex rounded-xl border border-border bg-background p-1 text-xs font-semibold overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setParticipantFilter('all')}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      participantFilter === 'all'
                        ? 'bg-google-blue text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All Attended ({totalAttended})
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipantFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      participantFilter === 'pending'
                        ? 'bg-google-blue text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Pending ({participants.filter((p) => !p.certificateSent).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipantFilter('sent')}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      participantFilter === 'sent'
                        ? 'bg-google-blue text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sent ({participants.filter((p) => p.certificateSent).length})
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search attendee, email, ticket..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {/* Batch Action Button */}
              <button
                type="button"
                onClick={handleStartBatchDispatch}
                disabled={isStartingDispatch || selectedSubmissionIds.size === 0}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 shrink-0"
              >
                {isStartingDispatch ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  Generate & Send Certificates ({selectedSubmissionIds.size})
                </span>
              </button>
            </div>

            {/* Quick Selection Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  Showing <strong>{pagedParticipants.length}</strong> of{' '}
                  <strong>{filteredParticipants.length}</strong> attendees
                </span>
                <button
                  type="button"
                  onClick={toggleSelectVisiblePage}
                  className="text-blue-500 hover:underline font-semibold"
                >
                  Toggle Page Selection
                </button>
                <button
                  type="button"
                  onClick={toggleSelectAllFiltered}
                  className="text-blue-500 hover:underline font-semibold"
                >
                  {selectedSubmissionIds.size === filteredParticipants.length
                    ? 'Deselect All'
                    : `Select All Filtered (${filteredParticipants.length})`}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px]">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-border bg-card text-xs font-semibold"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>
            </div>

            {/* Attended Participants Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            pagedParticipants.length > 0 &&
                            pagedParticipants.every((p) => selectedSubmissionIds.has(p.id))
                          }
                          onChange={toggleSelectVisiblePage}
                          className="rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3.5">Attendee Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Ticket ID</th>
                      <th className="p-3.5">Attendance Status</th>
                      <th className="p-3.5">Certificate Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {isLoadingParticipants ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                          Loading attended participants...
                        </td>
                      </tr>
                    ) : filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No participants found for the selected filter.
                          {totalAttended === 0 && (
                            <p className="text-[11px] mt-1 text-amber-500 font-semibold">
                              Note: Mark attendees as "Attended" in the Submissions panel first.
                            </p>
                          )}
                        </td>
                      </tr>
                    ) : (
                      pagedParticipants.map((p) => {
                        const isSelected = selectedSubmissionIds.has(p.id);
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-muted/40 transition-colors ${
                              isSelected ? 'bg-blue-500/5' : ''
                            }`}
                          >
                            <td className="p-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectParticipant(p.id)}
                                className="rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3.5 font-bold text-foreground">{p.name}</td>
                            <td className="p-3.5 text-muted-foreground">{p.email}</td>
                            <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                              {p.ticketId || '—'}
                            </td>
                            <td className="p-3.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                Attended
                              </span>
                            </td>
                            <td className="p-3.5">
                              {p.certificateSent ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
                                    <Award className="w-3 h-3" />
                                    Sent
                                  </span>
                                  {p.certificateSentAt && (
                                    <p className="text-[10px] text-muted-foreground">
                                      {new Date(p.certificateSentAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Footer */}
              {totalPages > 1 && (
                <div className="p-3.5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredParticipants.length} total)
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          pageNum = Math.min(totalPages - 4 + i, currentPage - 2 + i);
                        }
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                              currentPage === pageNum
                                ? 'bg-google-blue text-white'
                                : 'border border-border bg-card hover:bg-muted text-muted-foreground'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* HIGH-VOLUME BATCH DISPATCH PROGRESS MODAL                                 */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showJobModal && activeJob && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground font-sans">
                        {activeJob.status === 'completed'
                          ? 'Batch Dispatch Finished'
                          : activeJob.status === 'cancelled'
                          ? 'Batch Cancelled'
                          : 'Dispatching Certificates...'}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">{activeJob.eventTitle}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      activeJob.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : activeJob.status === 'cancelled'
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-500 border border-blue-500/30 animate-pulse'
                    }`}
                  >
                    {activeJob.status}
                  </span>
                </div>

                {/* Live Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground">
                      Processed: {activeJob.processed} of {activeJob.total} attendees
                    </span>
                    <span className="text-blue-500 font-bold">{activeJob.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${activeJob.percentage}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Succeeded vs Failed Counts */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-lg font-black text-emerald-500">{activeJob.succeeded}</p>
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Successfully Sent
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <p className="text-lg font-black text-rose-500">{activeJob.failed}</p>
                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      Failed Deliveries
                    </p>
                  </div>
                </div>

                {/* Error messages if any occurred during batch */}
                {activeJob.errors && activeJob.errors.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 max-h-32 overflow-y-auto space-y-1">
                    <p className="text-[11px] font-bold text-rose-500">Delivery Notices:</p>
                    {activeJob.errors.map((err, idx) => (
                      <p key={idx} className="text-[10px] text-rose-400 font-mono">
                        • {err}
                      </p>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  {activeJob.status === 'processing' && (
                    <button
                      type="button"
                      onClick={handleCancelBatchJob}
                      disabled={isCancellingJob}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-all"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>{isCancellingJob ? 'Cancelling...' : 'Cancel Batch'}</span>
                    </button>
                  )}

                  {(activeJob.status === 'completed' ||
                    activeJob.status === 'failed' ||
                    activeJob.status === 'cancelled') && (
                    <button
                      type="button"
                      onClick={() => setShowJobModal(false)}
                      className="w-full py-2.5 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-xs font-bold transition-all shadow-md"
                    >
                      Done
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* FULL HD PREVIEW MODAL                                                     */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showPreviewModal && previewDataUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
              onClick={() => setShowPreviewModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-5xl w-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black"
                onClick={(e) => e.stopPropagation()}
              >
                <img src={previewDataUrl} alt="High Res Certificate" className="w-full h-auto" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
