type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <>
      {/* PC: title + subtitle + action */}
      <div className="hidden md:flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1
            className="font-extrabold text-gray-900 leading-tight"
            style={{ fontSize: 'clamp(24px, 3vw, 28px)', letterSpacing: '-0.03em' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 mt-1.5" style={{ fontSize: 'clamp(14px, 1.5vw, 15px)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 mt-1">{action}</div>}
      </div>
      {/* Mobile: action button only (title + subtitle shown in fixed top header) */}
      {action && (
        <div className="flex md:hidden justify-end mb-4">{action}</div>
      )}
    </>
  );
}
