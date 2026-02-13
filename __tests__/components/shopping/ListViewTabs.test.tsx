import { ListViewTabs } from '../../../src/components/shopping/ListViewTabs';

describe('ListViewTabs', () => {
  const mockOnTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports the component', () => {
    expect(ListViewTabs).toBeDefined();
    expect(typeof ListViewTabs).toBe('function');
  });

  it('has list-view-tabs testID', () => {
    const element = ListViewTabs({ activeTab: 'categories', onTabChange: mockOnTabChange });
    expect(element.props.testID).toBe('list-view-tabs');
  });

  it('renders 3 tabs', () => {
    const element = ListViewTabs({ activeTab: 'categories', onTabChange: mockOnTabChange });
    const tabs = element.props.children;
    expect(tabs).toHaveLength(3);
  });

  it('marks categories tab as selected when active', () => {
    const element = ListViewTabs({ activeTab: 'categories', onTabChange: mockOnTabChange });
    const tabs = element.props.children;
    expect(tabs[0].props.accessibilityState.selected).toBe(true);
    expect(tabs[1].props.accessibilityState.selected).toBe(false);
    expect(tabs[2].props.accessibilityState.selected).toBe(false);
  });

  it('marks recipe tab as selected when active', () => {
    const element = ListViewTabs({ activeTab: 'recipe', onTabChange: mockOnTabChange });
    const tabs = element.props.children;
    expect(tabs[0].props.accessibilityState.selected).toBe(false);
    expect(tabs[1].props.accessibilityState.selected).toBe(true);
  });

  it('marks unsorted tab as selected when active', () => {
    const element = ListViewTabs({ activeTab: 'unsorted', onTabChange: mockOnTabChange });
    const tabs = element.props.children;
    expect(tabs[2].props.accessibilityState.selected).toBe(true);
  });

  it('each tab has correct testID', () => {
    const element = ListViewTabs({ activeTab: 'categories', onTabChange: mockOnTabChange });
    const tabs = element.props.children;
    expect(tabs[0].props.testID).toBe('tab-categories');
    expect(tabs[1].props.testID).toBe('tab-recipe');
    expect(tabs[2].props.testID).toBe('tab-unsorted');
  });
});
