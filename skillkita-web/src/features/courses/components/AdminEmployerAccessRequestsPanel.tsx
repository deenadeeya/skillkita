type PendingAccessRequest = {
  id: string;
  employer_user_id: string;
  created_at: string;
  courses: { name: string } | { name: string }[] | null;
};

type Props = {
  pendingAccess: PendingAccessRequest[];
  employerNames: Record<string, string>;
  isSaving: boolean;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
};

export function AdminEmployerAccessRequestsPanel({
  pendingAccess,
  employerNames,
  isSaving,
  onApprove,
  onReject,
}: Props) {
  return (
    <section className="sk-card p-6">
      <h2 className="text-2xl font-bold text-[#7A1F1F]">Employer access to private files</h2>
      <p className="mt-2 text-sm text-black">
        When an employer requests access, approve or reject here. Approved employers can open private
        documents from their dashboard.
      </p>
      <div className="mt-5 space-y-3">
        {pendingAccess.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
            No pending requests.
          </p>
        )}
        {pendingAccess.map((req) => {
          const courseName = Array.isArray(req.courses) ? req.courses[0]?.name : req.courses?.name;
          return (
            <article
              key={req.id}
              className="flex flex-col gap-3 rounded-xl border border-[#efe1db] p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-[#0001fc]">{courseName ?? "Course"}</p>
                <p className="text-sm text-black">{employerNames[req.employer_user_id] ?? req.employer_user_id}</p>
                <p className="text-xs text-black/60">
                  Requested: {new Date(req.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => onApprove(req.id)}
                  className="sk-button-primary px-3 py-2"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => onReject(req.id)}
                  className="sk-button-secondary px-3 py-2"
                >
                  Reject
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

