import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  adminCreateJd14Template,
  adminDeleteJd14Template,
  adminUpdateJd14Template,
  listJd14SubmissionTemplates,
} from "../jd14TemplatesApi";
import { JD14_TEMPLATE_FILE_ACCEPT } from "../jd14TemplateFiles";
import {
  getSubmissionFileSignedUrl,
  removeEmployerDocumentStoragePaths,
  uploadJd14TemplateFile,
} from "../submissionsStorage";
import type { Jd14SubmissionTemplateRow } from "../types";

export function Jd14TemplatesAdminSection() {
  const [rows, setRows] = useState<Jd14SubmissionTemplateRow[]>([]);
  const [deployMessage, setDeployMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [openingPath, setOpeningPath] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);
    setDeployMessage(null);
    try {
      const result = await listJd14SubmissionTemplates();
      if (!result.ok) {
        setRows([]);
        setDeployMessage(result.deployMessage);
        return;
      }
      setRows(result.rows);
    } catch (e) {
      setRows([]);
      setErrorMessage(e instanceof Error ? e.message : "Failed to load templates.");
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void load().finally(() => setIsLoading(false));
  }, [load]);

  const openPdf = async (path: string) => {
    setOpeningPath(path);
    setErrorMessage(null);
    try {
      const url = await getSubmissionFileSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open file.");
    } finally {
      setOpeningPath(null);
    }
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (deployMessage) return;
    if (!newTitle.trim() || !newFile) {
      setErrorMessage("Enter a title and choose a template file.");
      return;
    }
    setErrorMessage(null);
    setIsSaving(true);
    let uploadedPath: string | null = null;
    try {
      uploadedPath = await uploadJd14TemplateFile(newFile);
      await adminCreateJd14Template({ title: newTitle.trim(), file_storage_path: uploadedPath });
      setNewTitle("");
      setNewFile(null);
      await load();
    } catch (err) {
      if (uploadedPath) {
        try {
          await removeEmployerDocumentStoragePaths([uploadedPath]);
        } catch {
          /* best-effort cleanup */
        }
      }
      setErrorMessage(err instanceof Error ? err.message : "Could not create template.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (r: Jd14SubmissionTemplateRow) => {
    setErrorMessage(null);
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditFile(null);
  };

  const onSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) {
      setErrorMessage("Title is required.");
      return;
    }
    const row = rows.find((x) => x.id === editingId);
    if (!row) return;

    setErrorMessage(null);
    setIsSaving(true);
    let newPath: string | null = null;
    try {
      if (editFile) {
        newPath = await uploadJd14TemplateFile(editFile);
        await adminUpdateJd14Template(editingId, {
          title: editTitle.trim(),
          file_storage_path: newPath,
        });
        await removeEmployerDocumentStoragePaths([row.file_storage_path]);
      } else {
        await adminUpdateJd14Template(editingId, { title: editTitle.trim() });
      }
      cancelEdit();
      await load();
    } catch (err) {
      if (newPath) {
        try {
          await removeEmployerDocumentStoragePaths([newPath]);
        } catch {
          /* best-effort */
        }
      }
      setErrorMessage(err instanceof Error ? err.message : "Could not update template.");
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (r: Jd14SubmissionTemplateRow) => {
    if (!window.confirm(`Delete template “${r.title}”? This cannot be undone.`)) return;
    setErrorMessage(null);
    setIsSaving(true);
    try {
      const path = await adminDeleteJd14Template(r.id);
      await removeEmployerDocumentStoragePaths([path]);
      if (editingId === r.id) cancelEdit();
      await load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not delete template.");
    } finally {
      setIsSaving(false);
    }
  };

  const templatesLocked = Boolean(deployMessage);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm ring-1 ring-black/5 md:p-6">
      <h2 className="text-lg font-bold text-primary">JD14 templates</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Employers can download these before submitting their own JD14 (submission is still PDF). Upload Word, PDF,
        Excel, PowerPoint, OpenDocument, RTF, text, or CSV — plus a short title for each row.
      </p>

      {deployMessage && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Database setup required</p>
          <p className="mt-2 whitespace-pre-wrap text-amber-900/90">{deployMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errorMessage}</div>
      )}

      <form
        className="mt-5 space-y-3 border-t border-black/10 pt-5"
        onSubmit={(ev) => void onCreate(ev)}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Add template</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="block flex-1">
            <span className="mb-1 block text-xs font-semibold text-primary">Title</span>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.currentTarget.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              placeholder="e.g. Blank JD14 form"
              disabled={isSaving || templatesLocked}
            />
          </label>
          <label className="block w-full md:w-64">
            <span className="mb-1 block text-xs font-semibold text-primary">File</span>
            <input
              key={`new-${rows.length}`}
              type="file"
              accept={JD14_TEMPLATE_FILE_ACCEPT}
              onChange={(e) => setNewFile(e.currentTarget.files?.[0] ?? null)}
              className="w-full text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
              disabled={isSaving || templatesLocked}
            />
          </label>
          <button type="submit" className="sk-button-primary shrink-0 px-4 py-2 text-sm" disabled={isSaving || templatesLocked}>
            {isSaving ? "Saving…" : "Create"}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-black/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Existing templates</p>
        {isLoading ? (
          <p className="mt-3 text-sm text-ink-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            {deployMessage
              ? "Templates will appear here after the migration runs on this Supabase project."
              : "No templates yet. Create one above."}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-black/10 bg-primary/5 p-4">
                {editingId === r.id ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-primary">Title</span>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.currentTarget.value)}
                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                        disabled={isSaving}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-primary">Replace file (optional)</span>
                      <input
                        type="file"
                        accept={JD14_TEMPLATE_FILE_ACCEPT}
                        onChange={(e) => setEditFile(e.currentTarget.files?.[0] ?? null)}
                        className="w-full text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
                        disabled={isSaving}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="sk-button-primary px-3 py-2 text-sm"
                        disabled={isSaving}
                        onClick={() => void onSaveEdit()}
                      >
                        {isSaving ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        type="button"
                        className="sk-button-secondary px-3 py-2 text-sm"
                        disabled={isSaving}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-ink">{r.title}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="sk-button-secondary px-3 py-2 text-sm"
                        disabled={openingPath === r.file_storage_path || isSaving}
                        onClick={() => void openPdf(r.file_storage_path)}
                      >
                        {openingPath === r.file_storage_path ? "Opening…" : "View file"}
                      </button>
                      <button
                        type="button"
                        className="sk-button-secondary px-3 py-2 text-sm"
                        disabled={isSaving}
                        onClick={() => startEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
                        disabled={isSaving}
                        onClick={() => void onDelete(r)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
