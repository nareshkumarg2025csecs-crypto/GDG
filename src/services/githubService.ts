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
export function copyTextToClipboard(text: string, container?: HTMLElement | null): boolean {
  if (typeof window === 'undefined' || !text) return false;

  let success = false;

  // 1. Try modern async navigator.clipboard if available in secure context
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      navigator.clipboard.writeText(text).catch(() => {
        // Fallback handled below
      });
    } catch {
      // Ignored
    }
  }

  // 2. Synchronous DOM fallback - engineered for mobile Android Chrome, iOS Safari, and modals
  try {
    const isIOS = typeof navigator !== 'undefined' && /ipad|iphone|ipod/i.test(navigator.userAgent || '');
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Mobile Safari & WebKit critical styling:
    // - Must NOT be pointer-events: none (which blocks selection in modern mobile Chrome)
    // - Must have fontSize >= 16px to prevent viewport auto-zoom on iOS
    // - Must be positioned in viewport with tiny footprint and high z-index
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
    textArea.style.opacity = '0.01';
    textArea.style.zIndex = '999999';

    // Append to modal container if inside a modal dialog, otherwise document.body
    const targetParent = container || document.body;
    targetParent.appendChild(textArea);

    if (isIOS) {
      textArea.contentEditable = 'true';
      textArea.readOnly = false;

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
      textArea.focus({ preventScroll: true });
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
    }

    success = document.execCommand('copy');

    // Clean up selection and temporary element
    if (window.getSelection()) {
      window.getSelection()?.removeAllRanges();
    }
    targetParent.removeChild(textArea);
  } catch (err) {
    console.warn('DOM execCommand copy error:', err);
    success = false;
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
