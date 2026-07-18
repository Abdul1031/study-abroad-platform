import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { UniversityFilters } from '../types/university-filters.types';

export function useUniversityFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<UniversityFilters>(() => {
    // Load filters from URL on mount
    return {
      city: searchParams.getAll('city'),
      state: searchParams.getAll('state'),
      type: searchParams.getAll('type'),
      degree: searchParams.getAll('degree'),
      field: searchParams.getAll('field'),
      language: searchParams.getAll('language'),
      tuitionMin: searchParams.get('tuitionMin')
        ? Number(searchParams.get('tuitionMin'))
        : undefined,
      tuitionMax: searchParams.get('tuitionMax')
        ? Number(searchParams.get('tuitionMax'))
        : undefined,
      ieltsMin: searchParams.get('ieltsMin') ? Number(searchParams.get('ieltsMin')) : undefined,
      ieltsMax: searchParams.get('ieltsMax') ? Number(searchParams.get('ieltsMax')) : undefined,
      hasDormitory: searchParams.get('hasDormitory') === 'true',
      sortBy: (searchParams.get('sortBy') as any) || 'ranking',
    };
  });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.city?.length) filters.city.forEach((c) => params.append('city', c));
    if (filters.state?.length) filters.state.forEach((s) => params.append('state', s));
    if (filters.type?.length) filters.type.forEach((t) => params.append('type', t));
    if (filters.degree?.length) filters.degree.forEach((d) => params.append('degree', d));
    if (filters.field?.length) filters.field.forEach((f) => params.append('field', f));
    if (filters.language?.length) filters.language.forEach((l) => params.append('language', l));
    if (filters.tuitionMin) params.set('tuitionMin', String(filters.tuitionMin));
    if (filters.tuitionMax) params.set('tuitionMax', String(filters.tuitionMax));
    if (filters.ieltsMin) params.set('ieltsMin', String(filters.ieltsMin));
    if (filters.ieltsMax) params.set('ieltsMax', String(filters.ieltsMax));
    if (filters.hasDormitory) params.set('hasDormitory', 'true');
    if (filters.sortBy) params.set('sortBy', filters.sortBy);

    setSearchParams(params);
  }, [filters, setSearchParams]);

  const updateFilter = (key: keyof UniversityFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      sortBy: 'ranking',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.city?.length) count += filters.city.length;
    if (filters.state?.length) count += filters.state.length;
    if (filters.type?.length) count += filters.type.length;
    if (filters.degree?.length) count += filters.degree.length;
    if (filters.field?.length) count += filters.field.length;
    if (filters.language?.length) count += filters.language.length;
    if (filters.tuitionMin || filters.tuitionMax) count++;
    if (filters.ieltsMin || filters.ieltsMax) count++;
    if (filters.hasDormitory) count++;
    return count;
  };

  return {
    filters,
    updateFilter,
    clearAllFilters,
    getActiveFilterCount,
  };
}
