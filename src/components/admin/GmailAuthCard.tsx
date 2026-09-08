import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Send,
  Clock,
  Sparkles,
  KeyRound,
  XCircle,
} from 'lucide-react';
import { authService, type GmailStatusResponse } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface GmailAuthCardProps {
  onQueueUpdated?: () => void;
}

export const GmailAuthCard: React.FC<GmailAuthCardProps> = ({ onQueueUpdated }) => {
  const { token } = useAuth();
  const [data, setData] = useState<GmailStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDraining, setIsDraining] = useState(false);
  const [targetExpiryTime, setTargetExpiryTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const isAutoFetchingRef = useRef(false);

  const fetchStatus = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const res = await authService.getGmailStatus(token);
      setData(res);

      if (typeof res.expiresIn === 'number' && res.expiresIn > 0) {
        setTargetExpiryTime(Date.now() + res.expiresIn * 1000);
        setRemainingSeconds(res.expiresIn);
      } else {
        setTargetExpiryTime(null);
        setRemainingSeconds(null);
      }

      if (showToast) {
        toast({
          title: 'Status Refreshed',
          description: `Gmail API status: ${res.status.toUpperCase()}`,
        });
      }
    } catch (err: any) {
      toast({
        title: 'Failed to check Gmail status',
        description: err.message || 'Could not verify token with server.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  // Real-time ticking interval for live countdown
  useEffect(() => {
    if (!targetExpiryTime || data?.status !== 'alive') {
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((targetExpiryTime - Date.now()) / 1000));
      setRemainingSeconds(diff);

      // Silently re-check with Google once token reaches 0 to trigger auto-renew
      if (diff <= 0 && !isAutoFetchingRef.current) {
        isAutoFetchingRef.current = true;
        fetchStatus(false).finally(() => {
          isAutoFetchingRef.current = false;
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetExpiryTime, data?.status]);

  const formatCountdown = (totalSecs: number) => {
    if (totalSecs <= 0) return 'Auto-refreshing...';
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    if (m > 0) {
      return `${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${s}s`;
  };

  const getLiveTimingDisplay = () => {
    if (remainingSeconds === null) {
      return data?.expirationTiming || 'Checking live validity...';
    }
    const renewStr = formatCountdown(remainingSeconds);
    if (data?.testModeDaysLeft !== undefined && data?.testModeDaysLeft !== null) {
      return `~${data.testModeDaysLeft}d left (Test Token) • Auto-refreshes in ${renewStr}`;
    }
    return `Auto-refreshes in ${renewStr}`;
  };

  const handleConnectGmail = async () => {
    try {
      const { auth_url } = await authService.getGmailAuthUrl();
      if (auth_url) {
        window.location.href = auth_url;
      }
    } catch (err: any) {
      toast({
        title: 'Authorization Error',
        description: err.message || 'Failed to generate Gmail OAuth authorization URL.',
        variant: 'destructive',
      });
    }
  };

  const handleDrainQueue = async () => {
    setIsDraining(true);
    try {
      const res = await authService.drainGmailQueue(token);
      toast({
        title: 'Queue Drained',
        description: `${res.result?.drained || 0} pending email(s) dispatched.`,
      });
      await fetchStatus();
      if (onQueueUpdated) onQueueUpdated();
    } catch (err: any) {
      toast({
        title: 'Queue Drain Failed',
        description: err.message || 'Failed to dispatch queued emails.',
        variant: 'destructive',
      });
    } finally {
      setIsDraining(false);
    }
  };

  const isAlive = data?.status === 'alive';
  const isExpired = data?.status === 'expired';
  const isNotConfigured = data?.status === 'not_configured';
  const pendingQueueCount = data?.queue?.pending || 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 sm:p-6 shadow-sm">
      {/* Decorative background glow */}
      <div
        className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isAlive ? 'bg-google-green' : isExpired ? 'bg-google-red' : 'bg-google-yellow'
        }`}
      />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left Status Details */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
              <Mail className="w-3.5 h-3.5 text-google-blue" />
              Gmail API Service
            </span>

            {isLoading ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Verifying live token...
              </span>
            ) : isAlive ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ALIVE &amp; ACTIVE
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-google-blue border border-google-blue/30 font-mono tracking-tight"
                  title="Live countdown until Google access token auto-refresh"
                >
                  <Clock className="w-3 h-3 text-google-blue" />
                  {getLiveTimingDisplay()}
                </span>
              </>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <XCircle className="w-3.5 h-3.5" />
                TOKEN EXPIRED / REVOKED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                NOT CONFIGURED
              </span>
            )}

            {pendingQueueCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                <Clock className="w-3 h-3" />
                {pendingQueueCount} queued email{pendingQueueCount > 1 ? 's' : ''}
              </span>
            )}
          </div>


          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              Automated Event Confirmation Dispatcher
              {isAlive && <ShieldCheck className="w-4 h-4 text-google-green inline" />}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
              {isAlive
                ? `Registration passes and custom drafts are actively dispatched via Google's official Gmail REST API (${data?.email}).`
                : isExpired
                ? 'Your Gmail refresh token has expired or been revoked. New registrant emails are currently safely queued and will send automatically once re-authenticated.'
                : 'Configure Google OAuth to authorize sending registration confirmations and custom email drafts.'}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            {data?.email && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">Sender:</span>
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">
                  {data.email}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">Queue:</span>
              <span>
                {data?.queue?.pending || 0} pending &bull; {data?.queue?.sent || 0} sent &bull;{' '}
                {data?.queue?.failed || 0} failed
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">Scope:</span>
              <span className="font-mono text-[11px] text-google-blue">gmail.send</span>
            </div>
            {(data?.expirationTiming || remainingSeconds !== null) && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">Validity:</span>
                <span className="font-mono text-[11px] text-google-blue font-semibold">
                  {getLiveTimingDisplay()}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
          <button
            onClick={() => fetchStatus(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-all shadow-sm disabled:opacity-50"
            title="Check real-time Google token validity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Check Now</span>
          </button>

          {pendingQueueCount > 0 && isAlive && (
            <button
              onClick={handleDrainQueue}
              disabled={isDraining}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm disabled:opacity-50"
              title="Dispatch pending emails now"
            >
              <Send className={`w-3.5 h-3.5 ${isDraining ? 'animate-spin' : ''}`} />
              <span>Drain Queue ({pendingQueueCount})</span>
            </button>
          )}

          <button
            onClick={handleConnectGmail}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md hover:shadow-lg ${
              isExpired
                ? 'bg-gradient-to-r from-google-red to-rose-600 hover:opacity-95 ring-2 ring-rose-500/40 animate-pulse'
                : 'bg-gradient-to-r from-google-blue to-blue-600 hover:opacity-95'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isExpired ? 'Re-authorize Gmail Now' : isAlive ? 'Reconnect / Switch' : 'Authorize Gmail'}</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};
