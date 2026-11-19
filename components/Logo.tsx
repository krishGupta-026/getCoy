/** Coy wordmark: lowercase "coy" with a solid pink dot sitting on the baseline. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-baseline text-[32px] font-extrabold leading-none tracking-[-0.04em] ${className}`}
      aria-label="Coy"
    >
      <span aria-hidden="true">coy</span>
      <span
        aria-hidden="true"
        className="ml-[3px] inline-block size-[10px] rounded-full bg-pink"
      />
    </span>
  );
}
