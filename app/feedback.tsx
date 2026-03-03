/**
 * Feedback screen — accessible from Settings menu.
 *
 * @see Story 6.2 Task 2
 */

import { useEffect } from 'react';
import { FeedbackForm } from '../src/components/feedback/FeedbackForm';
import { analytics } from '../src/services/analytics';
import { EVENTS } from '../src/utils/analyticsEvents';

export default function FeedbackScreen() {
  useEffect(() => {
    analytics.track(EVENTS.FEEDBACK_FORM_OPENED);
  }, []);

  return <FeedbackForm />;
}
