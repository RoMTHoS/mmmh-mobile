/**
 * Pre-import pipeline check hook.
 *
 * Checks local plan status before submitting an import and shows
 * informational Toast messages when relevant. This is advisory only —
 * the backend makes the actual routing decision.
 *
 * @see Story 5.3 Task 8
 */

import { Toast } from '../utils/toast';
import { usePlanStatus } from './usePlan';

/**
 * Returns a function that checks the local plan state and shows
 * an info Toast if the user's Gemini quota is exhausted for the week.
 *
 * - Free + quota remaining: no message (will use Gemini)
 * - Free/Trial + quota used: shows info message
 * - Premium: no message (always Gemini)
 */
export function usePipelinePreCheck() {
  const planStatus = usePlanStatus();

  return function checkPipeline(): void {
    if (!planStatus) return;

    if (planStatus.tier !== 'premium' && planStatus.geminiQuotaRemaining <= 0) {
      Toast.show({
        type: 'info',
        text1: 'Import standard',
        text2: 'Vos imports premium de la semaine ont été utilisés. Import avec qualité standard.',
        visibilityTime: 4000,
      });
    }
  };
}
