# Apple HealthKit Integration for Isidor

This document provides instructions on how to build and run the Isidor mobile app with Apple HealthKit integration.

## Overview

The Isidor app now integrates with Apple HealthKit to fetch health data from the user's device. This integration allows the app to:

1. Read health data such as steps, distance, flights climbed, active energy burned, heart rate, weight, and body fat percentage
2. Sync this data with the Isidor backend
3. Display the data in the app's health screen

## Requirements

- iOS device (HealthKit is only available on iOS)
- Xcode 14 or later
- Node.js 16 or later
- Expo CLI

## Setup Instructions

### 1. Install Dependencies

Make sure you have all the required dependencies installed:

```bash
cd mobile
npm install
```

### 2. Create a Development Client

Since HealthKit integration requires native code, you need to create a custom development client:

```bash
npx expo install expo-dev-client
```

### 3. Build the iOS App

Build the native iOS project:

```bash
npx expo run:ios
```

This will create an Xcode project in the `ios` directory and build the app for the iOS simulator or a connected device.

### 4. Run on a Physical Device (Recommended)

For the best experience and to access real health data, run the app on a physical iOS device:

1. Connect your iOS device to your computer
2. In Xcode, select your device from the device dropdown
3. Click the Run button or use the following command:

```bash
npx expo run:ios -d
```

## Using HealthKit in the App

1. When you first launch the app, it will request permission to access your health data
2. Navigate to the Health tab to see the HealthKit integration
3. Use the "Sync" button to fetch the latest data from HealthKit and send it to the Isidor backend

## Troubleshooting

### Permissions Issues

If the app doesn't request HealthKit permissions:

1. Make sure you're running on a physical iOS device
2. Check that the app has the correct permissions in Settings > Privacy > Health
3. Reinstall the app if necessary

### Build Issues

If you encounter build issues:

1. Clean the build folder in Xcode (Product > Clean Build Folder)
2. Delete the `ios/build` directory
3. Run `npx expo run:ios` again

## Implementation Details

The HealthKit integration consists of the following components:

1. `services/healthkit.ts` - Service for interacting with HealthKit
2. `hooks/useHealthKit.ts` - Hook for using HealthKit data in React components
3. `components/HealthKitSync.tsx` - Component for displaying and syncing HealthKit data
4. Integration in the Health tab

## Additional Resources

- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [React Native Health Library](https://github.com/agencyenterprise/react-native-health)
- [Expo Development Client](https://docs.expo.dev/development/development-builds/introduction/) 