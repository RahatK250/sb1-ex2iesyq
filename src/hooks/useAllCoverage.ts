import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TestCoverageItem } from '../types';
import * as db from '../services/database';

/**
 * Loads ALL coverage items across every product.
 * Used by the manager Coverage Overview page.
 */
export const useAllCoverage = () => {
  const [allCoverageItems, setAllCoverageItems] = useState<TestCoverageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getAllCoverageItems();
      setAllCoverageItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coverage items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Realtime: listen to any change in test_coverage_items
  useEffect(() => {
    const sub = supabase
      .channel('all-coverage')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'test_coverage_items' },
        async () => {
          // Reload all on any change (simple & consistent)
          const data = await db.getAllCoverageItems();
          setAllCoverageItems(data);
        }
      )
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, []);

  return { allCoverageItems, loading, error };
};
