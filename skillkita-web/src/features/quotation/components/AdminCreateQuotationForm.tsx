import type { FormEvent } from "react";
import { RequiredMark } from "../../../shared/ui/RequiredMark";

type EmployerOption = { value: string; label: string; company_name: string | null; company_address: string | null };
type CourseOption = { value: string; label: string };

type Props = {
  isSaving: boolean;
  createEmployerUserId: string;
  createEmployerOptions: EmployerOption[];
  isManualEmployer: boolean;
  createManualEmployerName: string;
  createCompanyName: string;
  createCompanyAddress: string;
  createCourseId: string;
  createCourseOptions: CourseOption[];
  isManualCourse: boolean;
  createCourseName: string;
  createParticipants: string;
  createProposedDate: string;
  createAdditionalDescription: string;
  createCourseMode: string;
  createUnitPrice: string;
  createAmountRm: string;
  onChange: (patch: Partial<Record<string, string>>) => void;
  onSubmit: (ev: FormEvent<HTMLFormElement>) => void;
};

export function AdminCreateQuotationForm({
  isSaving,
  createEmployerUserId,
  createEmployerOptions,
  isManualEmployer,
  createManualEmployerName,
  createCompanyName,
  createCompanyAddress,
  createCourseId,
  createCourseOptions,
  isManualCourse,
  createCourseName,
  createParticipants,
  createProposedDate,
  createAdditionalDescription,
  createCourseMode,
  createUnitPrice,
  createAmountRm,
  onChange,
  onSubmit,
}: Props) {
  return (
    <section className="sk-card mt-8 p-6">
      <form className="space-y-4" onSubmit={onSubmit}>
        <p className="text-sm text-black/70">
          Required fields are marked with <RequiredMark />.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Employer
              <RequiredMark />
            </span>
            <select
              value={createEmployerUserId}
              onChange={(e) => onChange({ createEmployerUserId: e.target.value })}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              required
            >
              <option value="" disabled>
                Select an employer...
              </option>
              <option value="__manual__">Manual / not listed</option>
              {createEmployerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {isManualEmployer && (
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                Employer name
                <RequiredMark />
              </span>
              <input
                value={createManualEmployerName}
                onChange={(e) => onChange({ createManualEmployerName: e.target.value })}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                placeholder="Type employer name"
                required
              />
              <p className="mt-1 text-xs text-black/60">
                Manual quotations are stored under the admin account; employers won’t see them unless they have an account.
              </p>
            </label>
          )}

          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Company name (PDF)
              <RequiredMark />
            </span>
            <input
              value={createCompanyName}
              onChange={(e) => onChange({ createCompanyName: e.target.value })}
              className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Company address (PDF)</span>
            <textarea
              value={createCompanyAddress}
              onChange={(e) => onChange({ createCompanyAddress: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
              placeholder="Optional"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Course name
              <RequiredMark />
            </span>
            {!isManualCourse && (
              <p className="mt-1 mb-1 text-xs text-black/60">
                Pick an existing course, or choose “Manual / new course” to type a name.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={createCourseId}
                onChange={(e) => onChange({ createCourseId: e.target.value })}
                className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                required
              >
                <option value="" disabled>
                  Select existing course...
                </option>
                <option value="__manual__">Manual / new course</option>
                {createCourseOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {isManualCourse && (
                <input
                  value={createCourseName}
                  onChange={(e) => onChange({ createCourseName: e.target.value })}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                  placeholder="Type course name"
                  required
                />
              )}
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Participants
              <RequiredMark />
            </span>
            <input
              type="number"
              min={1}
              value={createParticipants}
              onChange={(e) => onChange({ createParticipants: e.target.value })}
              className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Proposed booking date
              <RequiredMark />
            </span>
            <input
              type="date"
              value={createProposedDate}
              onChange={(e) => onChange({ createProposedDate: e.target.value })}
              className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Additional description <span className="font-normal text-black/50">(optional)</span>
            </span>
            <textarea
              value={createAdditionalDescription}
              onChange={(e) => onChange({ createAdditionalDescription: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
              placeholder="Notes / venue / contacts..."
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Course mode
              <RequiredMark />
            </span>
            <select
              value={createCourseMode}
              onChange={(e) => onChange({ createCourseMode: e.target.value })}
              className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
              required
            >
              <option value="" disabled>
                Select…
              </option>
              <option value="Face-to-Face">Face-to-Face</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Unit price (RM)
              <RequiredMark />
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={createUnitPrice}
              onChange={(e) => onChange({ createUnitPrice: e.target.value })}
              className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Amount (RM)
              <RequiredMark />
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={createAmountRm}
              onChange={(e) => onChange({ createAmountRm: e.target.value })}
              className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
              required
            />
          </label>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={isSaving} className="sk-button-primary">
            {isSaving ? "Saving…" : "Create & generate PDF"}
          </button>
        </div>
      </form>
    </section>
  );
}

