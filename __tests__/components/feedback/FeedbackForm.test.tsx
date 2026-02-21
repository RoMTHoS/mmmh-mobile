/**
 * Tests for the FeedbackForm component.
 *
 * @see Story 6.2 Task 7
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { FeedbackForm } from '../../../src/components/feedback/FeedbackForm';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

const mockSubmitFeedback = jest.fn().mockResolvedValue(undefined);
const mockGatherContext = jest.fn().mockResolvedValue({
  appVersion: '1.0.0',
  device: 'ios 17',
  os: 'ios',
  planTier: 'trial',
  recipesCount: 5,
  importsCount: 3,
  deviceId: 'test-device-123',
});
const mockEncodeScreenshot = jest.fn().mockResolvedValue('base64data');

jest.mock('../../../src/services/feedback', () => ({
  submitFeedback: (...args: unknown[]) => mockSubmitFeedback(...args),
  gatherContext: () => mockGatherContext(),
  encodeScreenshot: (...args: unknown[]) => mockEncodeScreenshot(...args),
}));

const mockMarkFeedbackSubmitted = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../src/components/feedback/FeedbackPrompt', () => ({
  markFeedbackSubmitted: () => mockMarkFeedbackSubmitted(),
}));

const mockAnalyticsTrack = jest.fn();
jest.mock('../../../src/services/analytics', () => ({
  analytics: { track: (...args: unknown[]) => mockAnalyticsTrack(...args) },
}));

jest.mock('../../../src/utils/analyticsEvents', () => ({
  EVENTS: {
    FEEDBACK_SUBMITTED: 'Feedback Submitted',
  },
}));

const mockLaunchImageLibraryAsync = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [{ uri: 'file://mock-screenshot.jpg' }],
});
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
}));

const mockToastShow = jest.fn();
jest.mock('react-native-toast-message', () => {
  const Toast = () => null;
  Toast.show = (...args: unknown[]) => mockToastShow(...args);
  Toast.hide = jest.fn();
  return { __esModule: true, default: Toast };
});

describe('FeedbackForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders type picker, message input, screenshot button, and submit button', () => {
    const { getByTestId } = render(React.createElement(FeedbackForm));

    expect(getByTestId('feedback-type-picker')).toBeDefined();
    expect(getByTestId('feedback-message-input')).toBeDefined();
    expect(getByTestId('feedback-attach-screenshot')).toBeDefined();
    expect(getByTestId('feedback-submit-button')).toBeDefined();
  });

  it('renders all three feedback type options', () => {
    const { getByTestId } = render(React.createElement(FeedbackForm));

    expect(getByTestId('feedback-type-bug')).toBeDefined();
    expect(getByTestId('feedback-type-feature')).toBeDefined();
    expect(getByTestId('feedback-type-general')).toBeDefined();
  });

  it('submit button is disabled when form is invalid (no type, empty message)', () => {
    const { getByTestId } = render(React.createElement(FeedbackForm));

    const submitButton = getByTestId('feedback-submit-button');
    expect(
      submitButton.props.accessibilityState?.disabled ?? submitButton.props.disabled
    ).toBeTruthy();
  });

  it('submit button is disabled when message is too short', () => {
    const { getByTestId } = render(React.createElement(FeedbackForm));

    fireEvent.press(getByTestId('feedback-type-bug'));
    fireEvent.changeText(getByTestId('feedback-message-input'), 'Short');

    const submitButton = getByTestId('feedback-submit-button');
    expect(
      submitButton.props.accessibilityState?.disabled ?? submitButton.props.disabled
    ).toBeTruthy();
  });

  it('submit button is enabled when form is valid', () => {
    const { getByTestId } = render(React.createElement(FeedbackForm));

    fireEvent.press(getByTestId('feedback-type-bug'));
    fireEvent.changeText(
      getByTestId('feedback-message-input'),
      'This is a valid bug report message'
    );

    const submitButton = getByTestId('feedback-submit-button');
    expect(submitButton.props.disabled).toBeFalsy();
  });

  it('shows validation error for short messages', () => {
    const { getByTestId, getByText } = render(React.createElement(FeedbackForm));

    fireEvent.changeText(getByTestId('feedback-message-input'), 'Short');

    expect(getByText(/Minimum 10 caracteres/)).toBeDefined();
  });

  it('attaches screenshot via image picker', async () => {
    const { getByTestId, queryByTestId } = render(React.createElement(FeedbackForm));

    await act(async () => {
      fireEvent.press(getByTestId('feedback-attach-screenshot'));
    });

    expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
    expect(getByTestId('feedback-screenshot-preview')).toBeDefined();
    expect(queryByTestId('feedback-attach-screenshot')).toBeNull();
  });

  it('allows removing attached screenshot', async () => {
    const { getByTestId, queryByTestId } = render(React.createElement(FeedbackForm));

    // Attach
    await act(async () => {
      fireEvent.press(getByTestId('feedback-attach-screenshot'));
    });
    expect(getByTestId('feedback-screenshot-preview')).toBeDefined();

    // Remove
    fireEvent.press(getByTestId('feedback-remove-screenshot'));
    expect(queryByTestId('feedback-screenshot-preview')).toBeNull();
    expect(getByTestId('feedback-attach-screenshot')).toBeDefined();
  });

  it('submits feedback successfully and shows confirmation toast', async () => {
    const { getByTestId } = render(React.createElement(FeedbackForm));

    fireEvent.press(getByTestId('feedback-type-feature'));
    fireEvent.changeText(getByTestId('feedback-message-input'), 'I would love dark mode support');

    await act(async () => {
      fireEvent.press(getByTestId('feedback-submit-button'));
    });

    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feature',
        message: 'I would love dark mode support',
        context: expect.objectContaining({
          appVersion: '1.0.0',
          planTier: 'trial',
        }),
      })
    );

    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        text1: 'Merci !',
      })
    );
  });

  it('marks feedback as submitted on success', async () => {
    const { getByTestId } = render(React.createElement(FeedbackForm));

    fireEvent.press(getByTestId('feedback-type-bug'));
    fireEvent.changeText(getByTestId('feedback-message-input'), 'Something is broken in the app');

    await act(async () => {
      fireEvent.press(getByTestId('feedback-submit-button'));
    });

    expect(mockMarkFeedbackSubmitted).toHaveBeenCalled();
  });

  it('tracks analytics event on successful submission', async () => {
    const { getByTestId } = render(React.createElement(FeedbackForm));

    fireEvent.press(getByTestId('feedback-type-general'));
    fireEvent.changeText(getByTestId('feedback-message-input'), 'Great app, love it so far!');

    await act(async () => {
      fireEvent.press(getByTestId('feedback-submit-button'));
    });

    expect(mockAnalyticsTrack).toHaveBeenCalledWith('Feedback Submitted', {
      type: 'general',
      hasScreenshot: false,
      messageLength: 26,
    });
  });

  it('shows error toast on submission failure', async () => {
    mockSubmitFeedback.mockRejectedValueOnce(new Error('Network error'));

    const { getByTestId } = render(React.createElement(FeedbackForm));

    fireEvent.press(getByTestId('feedback-type-bug'));
    fireEvent.changeText(
      getByTestId('feedback-message-input'),
      'This is a bug report that should fail'
    );

    await act(async () => {
      fireEvent.press(getByTestId('feedback-submit-button'));
    });

    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: 'Envoi echoue',
      })
    );
  });

  it('encodes and includes screenshot in submission', async () => {
    const { getByTestId } = render(React.createElement(FeedbackForm));

    // Attach screenshot
    await act(async () => {
      fireEvent.press(getByTestId('feedback-attach-screenshot'));
    });

    fireEvent.press(getByTestId('feedback-type-bug'));
    fireEvent.changeText(
      getByTestId('feedback-message-input'),
      'UI is broken, see screenshot attached'
    );

    await act(async () => {
      fireEvent.press(getByTestId('feedback-submit-button'));
    });

    expect(mockEncodeScreenshot).toHaveBeenCalledWith('file://mock-screenshot.jpg');
    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        screenshotBase64: 'base64data',
      })
    );
  });
});
