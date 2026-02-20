import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { GeminiFallbackDialog } from '../../../src/components/import/GeminiFallbackDialog';

describe('GeminiFallbackDialog', () => {
  const onAccept = jest.fn();
  const onDecline = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog with correct message', () => {
    const { getByTestId } = render(
      <GeminiFallbackDialog visible onAccept={onAccept} onDecline={onDecline} />
    );

    expect(getByTestId('gemini-fallback-dialog')).toBeTruthy();
    expect(getByTestId('gemini-fallback-title')).toBeTruthy();
    expect(getByTestId('gemini-fallback-message').props.children).toContain(
      'import premium du jour'
    );
  });

  it('calls onAccept when accept button pressed', () => {
    const { getByTestId } = render(
      <GeminiFallbackDialog visible onAccept={onAccept} onDecline={onDecline} />
    );

    fireEvent.press(getByTestId('gemini-fallback-accept'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('calls onDecline when cancel button pressed', () => {
    const { getByTestId } = render(
      <GeminiFallbackDialog visible onAccept={onAccept} onDecline={onDecline} />
    );

    fireEvent.press(getByTestId('gemini-fallback-decline'));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('does not render content when not visible', () => {
    const { queryByTestId } = render(
      <GeminiFallbackDialog visible={false} onAccept={onAccept} onDecline={onDecline} />
    );

    expect(queryByTestId('gemini-fallback-dialog')).toBeNull();
  });
});
