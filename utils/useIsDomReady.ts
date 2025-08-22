// utils/useIsDomReady.ts
import { useEffect, useState } from "react";

export function useIsDomReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return ready;
}
