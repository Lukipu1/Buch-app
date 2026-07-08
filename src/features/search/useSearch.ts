import { useEffect, useRef, useState } from 'react';

import { searchRepository } from '@/services/database';
import { SearchResult } from '@/types/models';

type Status = 'idle' | 'searching' | 'done';

interface SearchState {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  status: Status;
}

/** Debounced global search hook. */
export function useSearch(): SearchState {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (timer.current) clearTimeout(timer.current);

    if (trimmed.length === 0) {
      setResults([]);
      setStatus('idle');
      return;
    }

    setStatus('searching');
    timer.current = setTimeout(async () => {
      const next = await searchRepository.search(trimmed);
      setResults(next);
      setStatus('done');
    }, 250);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  return { query, setQuery, results, status };
}
