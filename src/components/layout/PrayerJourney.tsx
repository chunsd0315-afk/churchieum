import { BookOpen } from 'lucide-react';
import type { PrayerHistory } from '../../types/prayer';
import {
  formatJourneyDate,
  getJourneyStepLabel,
  getPrayerJourneySteps,
} from '../../services/prayerJourneyHelpers';

type Props = {
  history: PrayerHistory[];
};

export default function PrayerJourney({ history }: Props) {
  const steps = getPrayerJourneySteps(history);

  if (steps.length === 0) return null;

  return (
    <section className="bg-amber-50/80 border border-amber-100 rounded-2xl px-4 py-4">
      <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5 mb-4">
        <BookOpen className="w-4 h-4 shrink-0" aria-hidden />
        기도 여정
      </h4>

      <ol className="flex flex-col items-center text-center">
        {steps.map((step, index) => (
          <li key={step.id} className="w-full flex flex-col items-center">
            <div className="w-full py-2">
              <p className="text-base font-bold text-gray-800 tabular-nums">
                {formatJourneyDate(step.createdAt)}
              </p>
              <p className="text-sm font-semibold text-amber-900 mt-0.5">
                {getJourneyStepLabel(step.action, step.visibility)}
              </p>
              {step.action === 'gratitude_testimony' && step.testimonyContent && (
                <p className="text-xs text-gray-600 mt-2 leading-relaxed px-2">
                  {step.testimonyContent}
                </p>
              )}
            </div>
            {index < steps.length - 1 && (
              <span className="text-gray-400 text-lg leading-none py-0.5" aria-hidden>
                ↓
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
