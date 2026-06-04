export function CompleteM03Cta({
  enabled,
  onComplete,
  pending,
}: {
  enabled: boolean;
  onComplete: () => void;
  pending?: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-[780px] justify-end">
      <button
        type="button"
        className="btn-ichigo btn-ichigo-primary px-8 py-4"
        disabled={!enabled || pending}
        onClick={onComplete}
      >
        {pending ? "Completing M03..." : "Complete M03 →"}
      </button>
    </div>
  );
}

