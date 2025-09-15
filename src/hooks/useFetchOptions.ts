import { useEffect, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export function useFetchOptions(endpoint: string) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOptions() {
      try {
        setLoading(true);
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Failed to fetch options");
        const data = await res.json();

        setOptions(data);
      } catch (err) {
        console.error(`Error fetching from ${endpoint}:`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchOptions();
  }, [endpoint]);

  return { options, loading };
}
