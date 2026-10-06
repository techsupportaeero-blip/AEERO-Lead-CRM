import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Course names from the Products & Services catalog, plus the lead's saved
// value when it isn't in the catalog (so an existing course is never silently
// replaced by the first dropdown option).
export const useCourseOptions = (savedValue) => {
  const [catalogNames, setCatalogNames] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api.getCourses()
      .then(list => {
        if (cancelled || !Array.isArray(list)) return;
        const names = list.map(c => c.name).filter(Boolean);
        setCatalogNames([...new Set(names)].sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const options = [...catalogNames];
  if (savedValue && !options.includes(savedValue)) options.unshift(savedValue);
  return options;
};

// Values that exist only as display placeholders in tables; they must never
// be written into a form field (or saved back to the database).
export const cleanFormValue = (value) => {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  return s === '-' || s.toUpperCase() === 'N/A' ? '' : String(value);
};
