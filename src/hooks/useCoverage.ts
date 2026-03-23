import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  TestCoverageItem,
  CreateTestCoverageItemInput,
  UpdateTestCoverageItemInput,
} from '../types';
import * as db from '../services/database';

export const useCoverage = (productId: string | undefined) => {
  const [coverageItems, setCoverageItems] = useState<TestCoverageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCoverageItems = useCallback(async (pid?: string) => {
    const id = pid || productId;
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await db.getCoverageItems({ product_id: id });
      setCoverageItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coverage items');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Load on mount / productId change
  useEffect(() => {
    if (productId) loadCoverageItems(productId);
  }, [productId, loadCoverageItems]);

  // Realtime subscription
  useEffect(() => {
    if (!productId) return;
    const sub = supabase
      .channel(`coverage-${productId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'test_coverage_items' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const item = payload.new as TestCoverageItem;
            if (item.product_id === productId) {
              setCoverageItems(prev => [item, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const item = payload.new as TestCoverageItem;
            setCoverageItems(prev => prev.map(i => i.id === item.id ? item : i));
          } else if (payload.eventType === 'DELETE') {
            setCoverageItems(prev => prev.filter(i => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [productId]);

  const createCoverageItem = async (input: CreateTestCoverageItemInput) => {
    try {
      const item = await db.createCoverageItem(input);
      setCoverageItems(prev => [item, ...prev]);
      return item;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coverage item');
      throw err;
    }
  };

  const updateCoverageItem = async (input: UpdateTestCoverageItemInput) => {
    try {
      const item = await db.updateCoverageItem(input);
      setCoverageItems(prev => prev.map(i => i.id === item.id ? item : i));
      return item;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update coverage item');
      throw err;
    }
  };

  const deleteCoverageItem = async (id: string) => {
    const original = [...coverageItems];
    setCoverageItems(prev => prev.filter(i => i.id !== id));
    try {
      await db.deleteCoverageItem(id);
    } catch (err) {
      setCoverageItems(original);
      setError(err instanceof Error ? err.message : 'Failed to delete coverage item');
      throw err;
    }
  };

  return {
    coverageItems,
    loading,
    error,
    loadCoverageItems,
    createCoverageItem,
    updateCoverageItem,
    deleteCoverageItem,
  };
};
