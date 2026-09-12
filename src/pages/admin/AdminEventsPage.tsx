import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Home,
  Loader2,
} from 'lucide-react';
import { eventService } from '@/services/eventService';
import { formService } from '@/services/formService';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import {
  type ClubEvent,
  type EventForm,
  formatEventDate,
  formatEventDateRange,
  formatEventTimeRange,
  stripMarkdown,
} from '@/lib/formUtils';
import { GmailAuthCard } from '@/components/admin/GmailAuthCard';
import { DriveStorageAuthCard } from '@/components/admin/DriveStorageAuthCard';


export const AdminEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [formsByEvent, setFormsByEvent] = useState<Record<string, EventForm>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Load events and their attached forms
  const loadData = async () => {
    setIsLoading(true);
    try {
      const { events: fetchedEvents } = await eventService.listEvents();
      setEvents(fetchedEvents || []);

      // Fetch attached forms for each event in parallel
      const formMap: Record<string, EventForm> = {};
      await Promise.all(
        (fetchedEvents || []).map(async (ev) => {
          try {
            const { forms } = await formService.getFormsByEvent(ev.id);
            if (forms && forms.length > 0) {
              formMap[ev.id] = forms[0];
            }
          } catch {
            // Ignore single form fetch failure
          }
        })
      );
      setFormsByEvent(formMap);
    } catch (err: any) {
      toast({
        title: 'Error loading events',
        description: err.message || 'Failed to fetch events from server.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Check if returning from Google OAuth consent flow
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail_auth') === 'success') {
      toast({
        title: 'Gmail API Connected Successfully',
        description: 'The refresh token was updated and queued confirmation emails are being sent.',
      });
      // Clean up the URL query
      navigate('/admin/events', { replace: true });
    } else if (params.get('drive_auth') === 'success') {
      toast({
        title: 'Google Drive Storage Connected',
        description: 'The dedicated storage account is active. Event file uploads will now be stored in this Drive.',
      });
      // Clean up the URL query
      navigate('/admin/events', { replace: true });
    }
  }, []);


  // Filter events based on search query and status
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const details = event.details || {};
      const isPublished = details.status === 'published' || details.published === true;
      const status = isPublished ? 'published' : 'draft';

      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = event.title.toLowerCase().includes(q);
        const descMatch = (details.description || '').toLowerCase().includes(q);
        const venueMatch = (details.location || details.venue || '').toLowerCase().includes(q);
        const categoryMatch = (details.category || '').toLowerCase().includes(q);
        return titleMatch || descMatch || venueMatch || categoryMatch;
      }

      return true;
    });
  }, [events, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = events.length;
    const published = events.filter(
      (e) => e.details?.status === 'published' || e.details?.published === true
    ).length;
    const drafts = total - published;
    const totalForms = Object.keys(formsByEvent).length;
    return { total, published, drafts, totalForms };
  }, [events, formsByEvent]);

  // Toggle Publish / Draft
  const handleTogglePublish = async (event: ClubEvent) => {
    const isCurrentlyPublished =
      event.details?.status === 'published' || event.details?.published === true;
    const nextStatus = isCurrentlyPublished ? 'draft' : 'published';
    const nextPublished = !isCurrentlyPublished;

    setIsProcessing(event.id);
    try {
      const updatedDetails = {
        ...(event.details || {}),
        status: nextStatus as 'draft' | 'published',
        published: nextPublished,
      };

      await eventService.updateEvent(event.id, {
        title: event.title,
        details: updatedDetails,
      });

      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, details: updatedDetails } : e
        )
      );

      toast({
        title: nextPublished ? 'Event Published!' : 'Event Moved to Draft',
        description: nextPublished
          ? `"${event.title}" is now visible to students on the events portal.`
          : `"${event.title}" is now hidden from students.`,
      });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message || 'Could not change publication status.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(null);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    setIsProcessing(id);
    try {
      await eventService.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setDeleteConfirmId(null);
      toast({
        title: 'Event Deleted',
        description: 'The event and its associated forms were removed.',
      });
    } catch (err: any) {
      toast({
        title: 'Delete failed',
        description: err.message || 'Could not delete event.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-google-red/10 text-google-red border border-google-red/20 font-mono">
                <Shield className="w-3.5 h-3.5" />
                Admin Portal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-sans">
              Events & Forms Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage club events, dynamic registration forms, deadlines, and view student submissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold transition-all shadow-sm"
              title="Go to Homepage"
            >
              <Home className="w-4 h-4 text-google-blue" />
              <span>Home</span>
            </Link>
            <Link
              to="/admin/events/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md hover:shadow-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #4285F4, #1A73E8)',
                boxShadow: '0 4px 14px rgba(66, 133, 244, 0.3)',
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Create Event & Form</span>
            </Link>
          </div>
        </div>

        {/* Gmail API OAuth Health & Queue Management Card */}
        <GmailAuthCard onQueueUpdated={loadData} />

        {/* Google Drive Dedicated Storage Account & Quota Card */}
        <DriveStorageAuthCard onStatusUpdated={loadData} />

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase font-mono">Total Events</span>
              <Calendar className="w-4 h-4 text-google-blue" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans">{stats.total}</div>
          </div>

          <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase font-mono">Published</span>
              <CheckCircle2 className="w-4 h-4 text-google-green" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans text-google-green">
              {stats.published}
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase font-mono">Drafts</span>
              <Clock className="w-4 h-4 text-google-yellow" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans text-google-yellow">
              {stats.drafts}
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase font-mono">Active Forms</span>
              <FileText className="w-4 h-4 text-google-red" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-sans">{stats.totalForms}</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, venue, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex p-1 rounded-xl bg-muted/80 border border-border w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'published'
                  ? 'bg-background text-google-green shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Published ({stats.published})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'draft'
                  ? 'bg-background text-google-yellow shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Drafts ({stats.drafts})
            </button>
          </div>
        </div>

        {/* Events Grid / List */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading club events and forms...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed rounded-2xl bg-card/50">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-bold">No events found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'Get started by creating your first club event and registration form!'}
            </p>
            <Link
              to="/admin/events/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-google-blue text-white text-sm font-semibold hover:bg-google-blue/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const details = event.details || {};
              const isPublished =
                details.status === 'published' || details.published === true;
              const attachedForm = formsByEvent[event.id];
              const isExpired =
                attachedForm?.expires_at &&
                new Date() > new Date(attachedForm.expires_at);

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col justify-between rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Status & Category Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono ${
                          isPublished
                            ? 'bg-google-green/10 text-google-green border border-google-green/30'
                            : 'bg-google-yellow/10 text-google-yellow border border-google-yellow/30'
                        }`}
                      >
                        {isPublished ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </span>

                      {details.category && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                          {details.category}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-xl font-bold font-sans line-clamp-1 text-foreground">
                        {event.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {stripMarkdown(details.description || 'No event description provided.')}
                      </p>
                    </div>

                    {/* Date, Time & Venue */}
                    <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-google-blue shrink-0" />
                        <span>
                          {formatEventDateRange(
                            details.startTime || details.start_time,
                            details.endTime || details.end_time
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-google-yellow shrink-0" />
                        <span>
                          {formatEventTimeRange(
                            details.startTime || details.start_time,
                            details.endTime || details.end_time
                          )}
                        </span>
                      </div>
                      {(details.location || details.venue) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-google-red shrink-0" />
                          <span className="truncate">{details.location || details.venue}</span>
                        </div>
                      )}
                      {attachedForm && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <Users className="w-3.5 h-3.5 text-google-green shrink-0" />
                          <span>
                            {(() => {
                              const count = attachedForm.submission_count ?? 0;
                              const limit = attachedForm.submission_limit || attachedForm.schema?.submission_limit;
                              if (limit && Number(limit) > 0) {
                                const remaining = Math.max(0, Number(limit) - count);
                                return (
                                  <>
                                    <strong className="text-foreground font-semibold">{count}</strong> registered
                                    <span className="text-muted-foreground mx-1">•</span>
                                    <span className={remaining === 0 ? 'text-rose-500 font-semibold' : 'text-google-green font-semibold'}>
                                      {remaining === 0 ? 'No spots left' : `${remaining} spot${remaining === 1 ? '' : 's'} left`}
                                    </span>
                                  </>
                                );
                              }
                              return (
                                <>
                                  <strong className="text-foreground font-semibold">{count}</strong> registered
                                  <span className="text-muted-foreground mx-1">•</span>
                                  <span className="text-muted-foreground">Unlimited spots</span>
                                </>
                              );
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Attached Form Pill */}
                    <div className="p-3 rounded-xl bg-muted/60 border border-border/60 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <FileText className="w-3.5 h-3.5 text-google-blue" />
                          <span>{attachedForm ? attachedForm.title : 'No Form Attached'}</span>
                        </span>
                        {attachedForm && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {attachedForm.schema?.fields?.length || 0} fields
                          </span>
                        )}
                      </div>

                      {attachedForm?.expires_at && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-muted-foreground">Deadline:</span>
                          <span
                            className={
                              isExpired
                                ? 'text-destructive font-semibold'
                                : 'text-google-yellow font-medium'
                            }
                          >
                            {formatEventDate(attachedForm.expires_at)} {isExpired ? '(Expired)' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer Bar */}
                  <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                    {/* Publish Toggle */}
                    <button
                      type="button"
                      disabled={isProcessing === event.id}
                      onClick={() => handleTogglePublish(event)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all inline-flex items-center gap-1.5 disabled:opacity-60 ${
                        isPublished
                          ? 'border-border hover:bg-muted text-foreground'
                          : 'bg-google-green text-white border-transparent hover:bg-google-green/90 shadow-sm'
                      }`}
                    >
                      {isProcessing === event.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : isPublished ? (
                        'Unpublish'
                      ) : (
                        'Publish Now'
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* View Submissions & Mark Attendance (if form exists) */}
                      {attachedForm && (
                        <Link
                          to={`/admin/forms/${attachedForm.id}/submissions`}
                          title="View Student Submissions & Mark Attendance"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-google-blue/30 bg-google-blue/10 hover:bg-google-blue/20 text-google-blue text-xs font-semibold transition-all shadow-sm"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Submissions</span>
                        </Link>
                      )}

                      {/* Edit Button */}
                      <Link
                        to={`/admin/events/${event.id}/edit`}
                        title="Edit Event & Form"
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(event.id)}
                        title="Delete Event"
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border p-6 bg-card text-card-foreground shadow-2xl"
            >
              <div className="flex items-center gap-3 text-destructive mb-3">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold text-lg">Delete Event?</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                This will permanently delete the event, its dynamic registration form, and all student submissions. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 px-3 rounded-xl border text-xs font-semibold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing === deleteConfirmId}
                  onClick={() => handleDeleteEvent(deleteConfirmId)}
                  className="flex-1 py-2 px-3 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {isProcessing === deleteConfirmId ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    'Delete Permanently'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminEventsPage;
