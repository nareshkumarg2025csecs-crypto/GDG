import { useState, useEffect } from 'react';
import { RepoItem } from '@/data/knowledgeHubData';
import { fetchSingleRepoStats, GitHubStats } from '@/services/githubService';

export function useGitHubStats(repos: RepoItem[]) {
  const [statsMap, setStatsMap] = useState<Record<string, GitHubStats>>(() => {
    // Initial state with repo defaults
    const initial: Record<string, GitHubStats> = {};
    repos.forEach((r) => {
      initial[r.id] = { stars: r.stars, forks: r.forks, isLive: false };
    });
    return initial;
  });

  useEffect(() => {
    let isMounted = true;

    // Fetch stats in parallel for each repo
    repos.forEach(async (repo) => {
      const stats = await fetchSingleRepoStats(repo.repoUrl, repo.stars, repo.forks);
      if (isMounted) {
        setStatsMap((prev) => ({
          ...prev,
          [repo.id]: stats,
        }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [repos]);

  return statsMap;
}
