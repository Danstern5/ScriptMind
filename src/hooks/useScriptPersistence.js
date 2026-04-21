import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost, apiPut } from "../utils/api";

export default function useScriptPersistence({
  token,
  elements, setElements, setActiveElId,
  scriptTitle, setScriptTitle,
  titlePage, setTitlePage,
  defaultElements, defaultTitle, defaultTitlePage,
  onUnauthorized,
}) {
  const [scriptId, setScriptId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("just now");
  const hasLoaded = useRef(false);
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (!token || hasLoaded.current) return;
    hasLoaded.current = true;

    (async () => {
      try {
        const list = await apiGet("/api/scripts/", token);
        let data;
        if (!list || list.length === 0) {
          data = await apiPost(
            "/api/scripts/",
            { title: defaultTitle, elements: defaultElements, title_page: defaultTitlePage },
            token,
          );
        } else {
          data = await apiGet(`/api/scripts/${list[0].id}`, token);
        }
        skipNextSave.current = true;
        setScriptId(data.id);
        setScriptTitle(data.title);
        setElements(data.elements);
        setTitlePage(data.title_page);
        setActiveElId(data.elements[0]?.id || null);
        setIsLoaded(true);
      } catch (err) {
        if (err.status === 401) onUnauthorized();
        hasLoaded.current = false; // allow retry on next token change
      }
    })();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoaded || !scriptId || !token) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await apiPut(
          `/api/scripts/${scriptId}`,
          { title: scriptTitle, elements, title_page: titlePage },
          token,
        );
        setLastSaved("just now");
      } catch (err) {
        if (err.status === 401) { onUnauthorized(); return; }
        setLastSaved("save failed");
      } finally {
        setIsSaving(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [elements, scriptTitle, titlePage, isLoaded, scriptId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  return { scriptId, isLoaded, isSaving, lastSaved };
}
