interface CapabilityMeterProps {
  percent: number;
  showLabel?: boolean;
  compact?: boolean;
}

export function getCapabilityBand(percent: number): {
  label: string;
  textColor: string;
  barColor: string;
} {
  if (percent >= 80) {
    return {
      label: 'High Fit',
      textColor: 'text-emerald-700',
      barColor: 'bg-emerald-600',
    };
  }
  if (percent >= 60) {
    return {
      label: 'Moderate Fit',
      textColor: 'text-amber-700',
      barColor: 'bg-amber-600',
    };
  }
  return {
    label: 'Skill Gap',
    textColor: 'text-red-700',
    barColor: 'bg-red-600',
  };
}

export function CapabilityMeter({
  percent,
  showLabel = false,
  compact = false,
}: CapabilityMeterProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const band = getCapabilityBand(clamped);

  return (
    <div className={compact ? 'flex items-center gap-2.5' : 'space-y-1.5'}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`font-mono tabular-nums font-semibold ${compact ? 'text-sm w-10' : 'text-base'} ${band.textColor}`}>
          {clamped}%
        </span>
        {showLabel && (
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            {band.label}
          </span>
        )}
      </div>
      <div
        className={`${compact ? 'w-20' : 'w-full'} h-1.5 bg-slate-200 rounded-sm overflow-hidden`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full ${band.barColor} transition-transform duration-200 ease-out origin-left`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
