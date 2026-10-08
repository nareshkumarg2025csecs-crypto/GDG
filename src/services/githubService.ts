/**
 * GitHub API service to fetch realtime stars and forks with intelligent client caching.
 */

export interface GitHubStats {
  stars: number;
  forks: number;
  isLive?: boolean;
}

const CACHE_KEY_PREFIX = 'gdg_gh_repo_';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

/**
 * Extracts owner and repo name from a GitHub URL
 */
export function extractGitHubOwnerAndRepo(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl);
    if (!url.hostname.includes('github.com')) return null;
    const parts = url.pathname.replace(/^\/|\/$/g, '').split('/');
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  } catch {
    // URL parsing failed
  }
  return null;
}

/**
 * Generates git clone command from repo URL
 */
export function getCloneCommand(repoUrl: string): string {
  const cleanUrl = repoUrl.replace(/\/+$/, '');
  const gitUrl = cleanUrl.endsWith('.git') ? cleanUrl : `${cleanUrl}.git`;
  return `git clone ${gitUrl}`;
}

/**
 * Format numbers with compact notation (e.g. 17.8k or 1,200)
 */
export function formatStarForkCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toLocaleString();
}

/**
 * Robust cross-device clipboard copy supporting iOS Safari, Android, mobile HTTP, and desktop browsers
 */
export function copyTextToClipboard(text: string): boolean {
  if (typeof window === 'undefined' || !text) return false;

  let success = false;

  // 1. Synchronous DOM fallback FIRST - this guarantees execution within the user-gesture callstack
  // which is strictly required by iOS Safari and older mobile browsers.
  try {
    const isIOS = typeof navigator !== 'undefined' && /ipad|iphone|ipod/i.test(navigator.userAgent || '');
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Mobile Safari & WebKit critical styling:
    // - Must NOT be off-screen (-9999px) or display:none, otherwise iOS considers it unrendered and refuses selection.
    // - Must have fontSize >= 16px to prevent viewport auto-zoom on iOS.
    // - Must be positioned in viewport with fixed coords and tiny/invisible footprint.
    textArea.style.fontSize = '16px';
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0.001';
    textArea.style.pointerEvents = 'none';
    textArea.style.zIndex = '-9999';

    if (isIOS) {
      // On iOS WebKit, an element with 'readonly' CANNOT be selected via setSelectionRange.
      // We explicitly make it editable, select contents via Range, and select range.
      textArea.contentEditable = 'true';
      textArea.readOnly = false;
      document.body.appendChild(textArea);

      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus({ preventScroll: true });
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
    }

    success = document.execCommand('copy');

    // Clean up selection and temporary element
    if (window.getSelection()) {
      window.getSelection()?.removeAllRanges();
    }
    document.body.removeChild(textArea);
  } catch (err) {
    console.warn('Synchronous execCommand copy error:', err);
    success = false;
  }

  // 2. Also trigger modern navigator.clipboard.writeText if available (Desktop & HTTPS mobile)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(text).then(() => {
      success = true;
    }).catch(() => {
      // Ignored if execCommand already handled it
    });
  }

  return success;
}

/**
 * Fetch realtime statistics for a single repository from GitHub public API
 */
export async function fetchSingleRepoStats(
  repoUrl: string,
  fallbackStars: number,
  fallbackForks: number
): Promise<GitHubStats> {
  const parsed = extractGitHubOwnerAndRepo(repoUrl);
  if (!parsed) {
    return { stars: fallbackStars, forks: fallbackForks, isLive: false };
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${parsed.owner}_${parsed.repo}`;
  
  // Try reading from sessionStorage
  try {
    const cachedStr = sessionStorage.getItem(cacheKey);
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return { stars: cached.stars, forks: cached.forks, isLive: true };
      }
    }
  } catch {
    // ignore sessionStorage errors
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const stats: GitHubStats = {
        stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : fallbackStars,
        forks: typeof data.forks_count === 'number' ? data.forks_count : fallbackForks,
        isLive: true,
      };

      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            ...stats,
            timestamp: Date.now(),
          })
        );
      } catch {
        // quota exceeded or private mode
      }

      return stats;
    }
  } catch {
    // Network error or rate limiting
  }

  return { stars: fallbackStars, forks: fallbackForks, isLive: false };
}
