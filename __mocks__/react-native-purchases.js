const mockPurchases = {
  configure: jest.fn(),
  getCustomerInfo: jest.fn().mockResolvedValue({
    entitlements: { active: {} },
    activeSubscriptions: [],
  }),
  addCustomerInfoUpdateListener: jest.fn().mockReturnValue(jest.fn()),
};

module.exports = {
  __esModule: true,
  default: mockPurchases,
  ...mockPurchases,
};
