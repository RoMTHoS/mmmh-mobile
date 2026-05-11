import { useToastStore } from '../../../src/stores/toastStore';

describe('Toast System', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    jest.clearAllMocks();
  });

  describe('toastStore', () => {
    it('adds a success toast with 2s default duration', () => {
      useToastStore.getState().showToast('Recipe saved', 'success');

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Recipe saved');
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].duration).toBe(2000);
    });

    it('adds an error toast with 5s default duration', () => {
      useToastStore.getState().showToast('Something failed', 'error');

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].duration).toBe(5000);
    });

    it('adds an info toast with 3s default duration', () => {
      useToastStore.getState().showToast('FYI message', 'info');

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('info');
      expect(toasts[0].duration).toBe(3000);
    });

    it('accepts custom duration', () => {
      useToastStore.getState().showToast('Custom', 'success', 10000);

      expect(useToastStore.getState().toasts[0].duration).toBe(10000);
    });

    it('dismisses a specific toast by id', () => {
      useToastStore.getState().showToast('Toast 1', 'success');
      useToastStore.getState().showToast('Toast 2', 'error');

      const id = useToastStore.getState().toasts[0].id;
      useToastStore.getState().dismissToast(id);

      const remaining = useToastStore.getState().toasts;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].message).toBe('Toast 2');
    });

    it('supports multiple toasts in queue', () => {
      useToastStore.getState().showToast('First', 'success');
      useToastStore.getState().showToast('Second', 'error');
      useToastStore.getState().showToast('Third', 'info');

      expect(useToastStore.getState().toasts).toHaveLength(3);
    });

    it('assigns unique IDs to each toast', () => {
      useToastStore.getState().showToast('A', 'success');
      useToastStore.getState().showToast('B', 'success');

      const toasts = useToastStore.getState().toasts;
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });
  });

  describe('Toast compat adapter', () => {
    it('maps Toast.show format to store', () => {
      // Import the compat layer
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Toast } = require('../../../src/utils/toast');

      Toast.show({
        type: 'success',
        text1: 'Recipe saved',
        text2: 'Successfully',
        visibilityTime: 2000,
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toContain('Recipe saved');
      expect(toasts[0].message).toContain('Successfully');
      expect(toasts[0].type).toBe('success');
    });

    it('maps error type correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Toast } = require('../../../src/utils/toast');

      Toast.show({ type: 'error', text1: 'Failed' });

      expect(useToastStore.getState().toasts[0].type).toBe('error');
    });

    it('Toast.hide dismisses the last toast', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Toast } = require('../../../src/utils/toast');

      useToastStore.getState().showToast('Test', 'info');
      expect(useToastStore.getState().toasts).toHaveLength(1);

      Toast.hide();
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
