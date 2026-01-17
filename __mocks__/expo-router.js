const React = require('react');

const Stack = ({ children }) => React.createElement('div', { 'data-testid': 'stack' }, children);
Stack.Screen = ({ name, options }) =>
  React.createElement('div', { 'data-testid': 'stack-screen', 'data-name': name });

const Tabs = ({ children }) => React.createElement('div', { 'data-testid': 'tabs' }, children);
Tabs.Screen = ({ name, options }) =>
  React.createElement('div', { 'data-testid': 'tabs-screen', 'data-name': name });

const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
};

const useLocalSearchParams = () => ({ id: 'test-id' });
const usePathname = () => '/';
const useNavigationContainerRef = () => ({ isReady: () => true });

const Link = ({ children, href }) =>
  React.createElement('a', { href, 'data-testid': 'link' }, children);

module.exports = {
  Stack,
  Tabs,
  router,
  useLocalSearchParams,
  usePathname,
  useNavigationContainerRef,
  Link,
};
