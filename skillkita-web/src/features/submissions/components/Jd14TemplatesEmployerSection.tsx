import { useCallback, useEffect, useState } from "react";
import { listJd14SubmissionTemplates } from "../jd14TemplatesApi";
import { getSubmissionFileSignedUrl } from "../submissionsStorage";
import type { Jd14SubmissionTemplateRow } from "../types";

export function Jd14TemplatesEmployerSection() {
  const [rows, setRows] = useState<Jd14SubmissionTemplateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openingPath, setOpeningPath] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await listJd14SubmissionTemplates();
      if (!result.ok) {
        setRows([]);
        return;
      }
      setRows(result.rows);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void load().finally(() => setIsLoading(false));
  }, [load]);

  const download = async (path: string) => {
    setOpeningPath(path);
    try {
      const url = await getSubmissionFileSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      /* ignore — RLS may hide templates from non-employers */
    } finally {
      setOpeningPath(null);
    }
  };

  if (isLoading || rows.length === 0) return null;

  return (
    <section className="sk-card mt-6 space-y-3 p-5 md:p-6">
      <h2 className="text-lg font-bold text-[#7A1F1F]">Downloadable templates</h2>
      <p className="text-sm text-black/70">
        Download a template (Word, PDF, or other formats), then submit your completed JD14 as a PDF below.
      </p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#efe1db] bg-white px-3 py-2">
            <span className="text-sm font-medium text-[#0001fc]">{r.title}</span>
            <button
              type="button"
              className="sk-button-secondary shrink-0 px-3 py-1.5 text-sm"
              disabled={openingPath === r.file_storage_path}
              onClick={() => void download(r.file_storage_path)}
            >
              {openingPath === r.file_storage_path ? "Opening…" : "Download"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
