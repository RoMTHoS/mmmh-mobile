# mmmh-mobile

![Mobile CI](https://github.com/RoMTHoS/mmmh-mobile/actions/workflows/mobile-ci.yml/badge.svg)

React Native + Expo mobile application for MyMealMateHelper.

## Prerequisites

- Node.js 20 LTS
- npm or yarn
- Expo Go app on your mobile device (for development)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Scan the QR code with Expo Go (Android) or Camera app (iOS)

## Scripts

| Command                | Description                           |
| ---------------------- | ------------------------------------- |
| `npm start`            | Start Expo development server         |
| `npm run android`      | Start on Android emulator             |
| `npm run ios`          | Start on iOS simulator                |
| `npm run web`          | Start web version                     |
| `npm run lint`         | Run ESLint                            |
| `npm run format`       | Run Prettier                          |
| `npm run generate-api` | Generate API client from OpenAPI spec |

## Project Structure

```
mmmh-mobile/
├── app/                    # Expo Router screens (future)
├── src/
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── services/
│   │   └── api/            # Generated API client
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Images, fonts, etc.
├── App.tsx                 # App entry point
├── app.json                # Expo configuration
└── tsconfig.json           # TypeScript configuration
```

## Development Workflow

1. Create feature branch from `main`
2. Implement changes following coding standards
3. Run `npm run lint` and `npm run format`
4. Commit with conventional commit message
5. Create PR for review

## API Client Generation

The API client is auto-generated from the backend OpenAPI spec:

```bash
npm run generate-api
```

This creates type-safe API calls in `src/services/api/`.
