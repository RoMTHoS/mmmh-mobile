const mockPeople = {
  set: jest.fn(),
};

const mockMixpanel = {
  init: jest.fn().mockResolvedValue(undefined),
  track: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  getPeople: jest.fn().mockReturnValue(mockPeople),
};

class Mixpanel {
  constructor() {
    Object.assign(this, mockMixpanel);
  }
}

module.exports = {
  Mixpanel,
  __mockMixpanel: mockMixpanel,
  __mockPeople: mockPeople,
};
