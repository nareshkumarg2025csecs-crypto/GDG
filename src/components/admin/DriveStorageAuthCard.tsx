import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  UploadCloud,
  XCircle,
  Database,
  ArrowRightLeft,
  Sparkles,
  Info,
  Folder,
  FolderCheck,
  Trash2,
  Check,
  LogOut,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { authService, type DriveStatusResponse } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface DriveStorageAuthCardProps {
  onStatusUpdated?: () => void;
  compact?: boolean;
}

export const DriveStorageAuthCard: React.FC<DriveStorageAuthCardProps> = ({
  onStatusUpdated,
  compact = false,
}) => {
  const { token } = useAuth();
  const [data, setData] = useState<DriveStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showClearFolderModal, setShowClearFolderModal] = useState(false);
  const [folderInput, setFolderInput] = useState('');
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [isClearingFolder, setIsClearingFolder] = useState(false);

  const formatBytes = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const tb = bytes / (1024 * 1024 * 1024 * 1024);
    if (tb >= 1) return `${tb.toFixed(2)} TB`;
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const fetchStatus = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const res = await authService.getDriveStatus(token);
      setData(res);
      if (res.folderUrl || res.folderId) {
        setFolderInput(res.folderUrl || res.folderId || '');
      }

      if (showToast) {
        toast({
          title: 'Storage Status Refreshed',
          description: `Drive: ${res.email || 'Connected'} (${formatBytes(res.storageUsedBytes)} used)`,
        });
      }
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      if (showToast) {
        toast({
          title: 'Storage Status Check',
          description: 'Could not verify storage quota with Google. Please check your connection or try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleConnectOrSwitch = async () => {
    try {
      setIsConnecting(true);
      const { auth_url } = await authService.getDriveAuthUrl();
      if (!auth_url) {
        throw new Error('No authorization URL returned by server.');
      }
      // Redirect to Google OAuth consent
      window.location.href = auth_url;
    } catch (err: any) {
      toast({
        title: 'Could not start Google Drive connection',
        description: err.message || 'Please ensure Google OAuth credentials are configured.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const handleSaveFolder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!folderInput.trim()) {
      toast({
        title: 'Folder link or ID required',
        description: 'Please paste a Google Drive public or shared folder link.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsSavingFolder(true);
      const res = await authService.setDriveFolder(folderInput.trim(), token);
      toast({
        title: 'Designated Folder Saved',
        description: `Student files will now be saved inside "${res.folderName || 'Designated Folder'}".`,
      });
      await fetchStatus();
    } catch (err: any) {
      toast({
        title: 'Could not set Drive folder',
        description: err.message || 'Please verify the folder link and permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingFolder(false);
    }
  };

  const handleClearFolder = async () => {
    try {
      setIsClearingFolder(true);
      await authService.clearDriveFolder(token);
      setShowClearFolderModal(false);
      setFolderInput('');
      toast({
        title: 'Folder Reset to Drive Root',
        description: 'Student files will now be saved in the account root Drive directory.',
      });
      await fetchStatus();
    } catch (err: any) {
      toast({
        title: 'Could not reset Drive folder',
        description: 'Unable to reset folder to Drive root. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsClearingFolder(false);
    }
  };

  const handleDisconnectDrive = async () => {
    try {
      setIsDisconnecting(true);
      await authService.disconnectDrive(token);
      setShowDisconnectModal(false);
      toast({
        title: 'Google Drive Disconnected',
        description: 'The storage account has been logged out successfully.',
      });
      await fetchStatus();
    } catch (err: any) {
      toast({
        title: 'Failed to disconnect Drive',
        description: 'Could not disconnect storage account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-md animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="w-36 h-4 bg-muted rounded" />
            <div className="w-48 h-3 bg-muted rounded" />
          </div>
        </div>
        <div className="w-28 h-9 bg-muted rounded-xl" />
      </div>
    );
  }

  const isConfigured = Boolean(data?.isConfigured && data?.status !== 'not_configured');
  const isExceeded = isConfigured && data?.status === 'quota_exceeded';
  const isWarning = isConfigured && data?.status === 'warning';
  const isInstitutional = isConfigured && Boolean(data?.isInstitutional);
  const percentage = data?.usagePercentage ?? 0;

  // Progress bar color based on quota
  const progressBg = isExceeded
    ? 'bg-rose-500'
    : isWarning
    ? 'bg-amber-500'
    : percentage > 70
    ? 'bg-yellow-500'
    : 'bg-emerald-500';

  const disconnectModal = (
    <AlertDialog open={showDisconnectModal} onOpenChange={setShowDisconnectModal}>
      <AlertDialogContent className="w-[92vw] max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl">
        <AlertDialogHeader className="space-y-2.5 text-left">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <LogOut className="w-5 h-5" />
          </div>
          <AlertDialogTitle className="text-base sm:text-lg font-bold font-sans text-foreground">
            Disconnect Google Drive Account?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to disconnect and log out the Google Drive storage account? Student event file uploads will pause until a storage account is re-connected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4 pt-2 border-t border-border/50">
          <AlertDialogCancel
            disabled={isDisconnecting}
            className="rounded-xl text-xs font-semibold px-4 py-2.5 w-full sm:w-auto"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDisconnectDrive();
            }}
            disabled={isDisconnecting}
            className="rounded-xl text-xs font-bold px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/25 w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
          >
            {isDisconnecting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>{isDisconnecting ? 'Disconnecting...' : 'Yes, Disconnect Account'}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const clearFolderModal = (
    <AlertDialog open={showClearFolderModal} onOpenChange={setShowClearFolderModal}>
      <AlertDialogContent className="w-[92vw] max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl">
        <AlertDialogHeader className="space-y-2.5 text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <Trash2 className="w-5 h-5" />
          </div>
          <AlertDialogTitle className="text-base sm:text-lg font-bold font-sans text-foreground">
            Reset Designated Upload Folder?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            This will disconnect the designated shared folder. Future event file uploads will default back to the root of the connected Google Drive account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4 pt-2 border-t border-border/50">
          <AlertDialogCancel
            disabled={isClearingFolder}
            className="rounded-xl text-xs font-semibold px-4 py-2.5 w-full sm:w-auto"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleClearFolder();
            }}
            disabled={isClearingFolder}
            className="rounded-xl text-xs font-bold px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/25 w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
          >
            {isClearingFolder ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{isClearingFolder ? 'Resetting...' : 'Yes, Reset to Drive Root'}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (compact) {
    return (
      <>
        {disconnectModal}
        <div
          className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
            isExceeded
              ? 'border-rose-500/30 bg-rose-500/5'
              : isWarning
              ? 'border-amber-500/30 bg-amber-500/5'
              : isInstitutional
              ? 'border-purple-500/30 bg-purple-500/5'
              : 'border-border bg-card/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 max-w-full">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isExceeded
                    ? 'bg-rose-500/10 text-rose-500'
                    : isInstitutional
                    ? 'bg-purple-500/10 text-purple-400'
                    : 'bg-blue-500/10 text-blue-500'
                }`}
              >
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-xs font-semibold">Google Drive Storage</span>
                  {isExceeded ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500">
                      Storage Full
                    </span>
                  ) : isInstitutional ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                      {formatBytes(data?.storageUsedBytes)} Real Files
                    </span>
                  ) : isConfigured ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                      {percentage}% Used
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                      Not Linked
                    </span>
                  )}
                  {data?.folderName && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 truncate max-w-[140px]"
                      title={data.folderName}
                    >
                      📁 {data.folderName}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate break-all max-w-full">
                  {isConfigured && data?.email ? data.email : 'No storage account connected'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleConnectOrSwitch}
                disabled={isConnecting}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted transition-colors shadow-sm flex-1 sm:flex-initial"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                <span>{isConfigured ? 'Switch' : 'Connect'}</span>
              </button>
              {isConfigured && (
                <button
                  type="button"
                  onClick={() => setShowDisconnectModal(true)}
                  disabled={isDisconnecting}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-xs border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-500 transition-colors shadow-sm shrink-0"
                  title="Disconnect / Logout Drive Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {disconnectModal}
      {clearFolderModal}
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all shadow-sm ${
          isExceeded
            ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/20 via-card to-card'
            : isWarning
            ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-card to-card'
            : isInstitutional
            ? 'border-purple-500/30 bg-gradient-to-br from-purple-950/10 via-card to-card'
            : 'border-border bg-card/80'
        } backdrop-blur-md p-4 sm:p-6`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5">
          {/* Left Info Section */}
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border shrink-0 ${
                  isExceeded
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                    : isWarning
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    : isInstitutional
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                    : 'bg-google-blue/10 border-google-blue/20 text-google-blue'
                }`}
              >
                <HardDrive className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold font-sans tracking-tight">
                    Google Drive Storage Account
                  </h3>

                  {/* Status Badge */}
                  {isExceeded ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                      <XCircle className="w-3.5 h-3.5" />
                      Storage Full (100%)
                    </span>
                  ) : isWarning ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Storage Near Limit (&gt;90%)
                    </span>
                  ) : isInstitutional ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Institutional Domain
                    </span>
                  ) : isConfigured ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Storage Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                      <Info className="w-3.5 h-3.5" />
                      Not Configured
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="shrink-0">Account:</span>
                  <span className="font-mono font-medium text-foreground break-all">
                    {isConfigured && data?.email ? data.email : 'No storage account connected'}
                  </span>
                  {data?.isDedicatedAccount && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-500 shrink-0">
                      Dedicated Storage
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Real Storage Quota Display */}
            {isConfigured && (
              <div className="w-full max-w-md space-y-1.5 pt-1">
                {isInstitutional ? (
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Real Drive Files Used:</span>
                      <span className="font-mono font-bold text-purple-400">
                        {formatBytes(data?.storageUsedBytes)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      This account is in a college/university domain with pooled organization storage. Colleges enforce individual student quotas (typically 100MB - 1GB), which causes uploads to fail once reached.
                    </p>
                  </div>
                ) : data?.storageLimitBytes ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        {formatBytes(data.storageUsedBytes)} of {formatBytes(data.storageLimitBytes)} used
                      </span>
                      <span
                        className={`font-bold font-mono ${
                          isExceeded ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-foreground'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden border border-border/40">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${progressBg}`}
                        style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Real Drive Files Used:{' '}
                    <span className="font-mono font-bold text-foreground">
                      {formatBytes(data?.storageUsedBytes)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              {isExceeded ? (
                <span className="text-rose-400 font-medium">
                  ⚠️ Uploads will fail until storage is switched. Click "Switch Storage Account" below to connect any Google account with free space.
                </span>
              ) : isInstitutional ? (
                <span>
                  💡 <b>Recommendation:</b> Click <b>"Switch Storage Account"</b> and connect a regular <b>@gmail.com</b> account to get a dedicated <b>15 GB</b> with no college administrative limits.
                </span>
              ) : (
                <span>
                  All attendee registration files are organized into dedicated event folders in Google Drive. When storage fills up, you can connect a new account anytime with zero downtime.
                </span>
              )}
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0">
            <button
              type="button"
              onClick={() => fetchStatus(true)}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-sm shrink-0"
              title="Refresh Storage Quota"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            </button>

            {data?.email && (
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors shadow-sm shrink-0"
                title="Open Google Drive in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Open Drive</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleConnectOrSwitch}
              disabled={isConnecting}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex-1 sm:flex-initial ${
                isExceeded
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
              }`}
            >
              <ArrowRightLeft className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>
                {isConnecting
                  ? 'Connecting...'
                  : isConfigured
                  ? 'Switch Account'
                  : 'Connect Storage'}
              </span>
            </button>

            {isConfigured && (
              <button
                type="button"
                onClick={() => setShowDisconnectModal(true)}
                disabled={isDisconnecting}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-all shadow-sm shrink-0"
                title="Logout / Disconnect Google Drive Storage Account"
              >
                <LogOut className={`w-3.5 h-3.5 ${isDisconnecting ? 'animate-spin' : ''}`} />
                <span>{isDisconnecting ? 'Disconnecting...' : 'Logout Drive'}</span>
              </button>
            )}
          </div>
        </div>

      {/* Designated Shared / Public Google Drive Folder Section */}
      <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0 mt-0.5">
              <Folder className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-foreground font-sans">
                  Designated Public / Shared Folder for Student Uploads
                </h4>
                {data?.folderId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    Folder Linked (Top Priority)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Paste a public or shared Google Drive folder link. Student file uploads for each event will automatically be stored inside organized event subfolders within this folder with top priority.
              </p>
            </div>
          </div>

          {data?.folderId && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <a
                href={data.folderUrl || `https://drive.google.com/drive/folders/${data.folderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs font-semibold transition-colors border border-blue-500/20 shadow-sm flex-1 sm:flex-initial"
              >
                <FolderCheck className="w-3.5 h-3.5" />
                <span>Open Folder</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </a>
              <button
                type="button"
                onClick={() => setShowClearFolderModal(true)}
                disabled={isClearingFolder}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-rose-500/10 hover:text-rose-500 text-xs font-medium text-muted-foreground transition-colors shadow-sm"
                title="Reset to Drive Root"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearingFolder ? 'Clearing...' : 'Clear'}</span>
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveFolder} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="Paste Google Drive shared folder link (e.g. https://drive.google.com/drive/folders/...) or folder ID"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background/80 text-foreground placeholder:text-muted-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingFolder || !folderInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 whitespace-nowrap w-full sm:w-auto"
          >
            {isSavingFolder ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSavingFolder ? 'Connecting Folder...' : 'Set Destination Folder'}</span>
          </button>
        </form>

        {data?.folderId ? (
          <div className="mt-2.5 p-2.5 sm:p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 break-words">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-foreground">Top-Priority Destination:</span>
                <strong className="font-bold text-foreground">{data.folderName || 'Designated Folder'}</strong>
                <span className="font-mono text-[11px] text-muted-foreground break-all">({data.folderId})</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Every event form submission will create and store files inside dedicated event subfolders: <code className="px-1.5 py-0.5 rounded bg-muted font-mono break-all">{data.folderName || 'Folder'} / GDG - [Event Title] / [Files]</code>.
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
            💡 If left unconfigured, event folders will be stored directly in the root of the connected Google Drive account. Ensure the storage account has Edit access to the shared folder.
          </p>
        )}
      </div>
    </div>
  </>
  );
};
