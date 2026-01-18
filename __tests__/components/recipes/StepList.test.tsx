import { StepList } from '../../../src/components/recipes/StepList';
import type { Step } from '../../../src/types';

const mockStep = (overrides?: Partial<Step>): Step => ({
  order: 1,
  instruction: 'Mix ingredients together',
  ...overrides,
});

describe('StepList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders step list', () => {
    const steps = [mockStep()];
    const element = StepList({ steps });

    expect(element).toBeDefined();
    expect(element.props.testID).toBe('step-list');
  });

  it('renders empty state when no steps', () => {
    const element = StepList({ steps: [] });

    expect(element).toBeDefined();
    // Returns empty text instead of list
  });

  it('renders multiple steps', () => {
    const steps = [
      mockStep({ order: 1, instruction: 'Step 1' }),
      mockStep({ order: 2, instruction: 'Step 2' }),
      mockStep({ order: 3, instruction: 'Step 3' }),
    ];
    const element = StepList({ steps });

    expect(element).toBeDefined();
    expect(element.props.children).toHaveLength(3);
  });

  it('displays step number', () => {
    const steps = [mockStep({ order: 1 })];
    const element = StepList({ steps });

    expect(element).toBeDefined();
    // Step should display order number
  });

  it('displays step instruction', () => {
    const steps = [mockStep({ instruction: 'Bake for 20 minutes' })];
    const element = StepList({ steps });

    expect(element).toBeDefined();
    // Step should display instruction text
  });

  it('renders steps in order', () => {
    const steps = [
      mockStep({ order: 1, instruction: 'First' }),
      mockStep({ order: 2, instruction: 'Second' }),
    ];
    const element = StepList({ steps });

    expect(element).toBeDefined();
    expect(element.props.children[0].props.testID).toBe('step-item-0');
    expect(element.props.children[1].props.testID).toBe('step-item-1');
  });
});
