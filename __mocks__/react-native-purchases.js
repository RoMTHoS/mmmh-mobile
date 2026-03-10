const mockPurchases = {
  configure: jest.fn(),
  getCustomerInfo: jest.fn().mockResolvedValue({
    entitlements: { active: {} },
    activeSubscriptions: [],
  }),
  getOfferings: jest.fn().mockResolvedValue({
    current: {
      monthly: {
        product: {
          priceString: '4,99 €',
          price: 4.99,
          currencyCode: 'EUR',
          identifier: 'mmmh_premium_monthly',
        },
        identifier: '$rc_monthly',
      },
    },
  }),
  purchasePackage: jest.fn().mockResolvedValue({
    customerInfo: {
      entitlements: {
        active: {
          premium: {
            productIdentifier: 'mmmh_premium_monthly',
            expirationDate: '2026-04-10T00:00:00Z',
            store: 'APP_STORE',
          },
        },
      },
    },
  }),
  restorePurchases: jest.fn().mockResolvedValue({
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
