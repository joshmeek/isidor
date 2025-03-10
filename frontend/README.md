# Isidor Mobile App

This is the mobile app for Isidor, an AI-driven life protocol system designed to optimize fitness, nutrition, sleep, cognitive performance, and overall well-being.

## Development Setup

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app installed on your iPhone

### Running the App on Your iPhone

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Scan the QR code with your iPhone camera app or the Expo Go app.

4. The app will open in the Expo Go app on your iPhone.

### Building for Production

To create a standalone build for iOS:

1. Install EAS CLI:
   ```
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```
   eas login
   ```

3. Configure the build:
   ```
   eas build:configure
   ```

4. Build for iOS:
   ```
   eas build --platform ios
   ```

## Project Structure

- `App.tsx` - Main application component
- `app.json` - Expo configuration file
- `assets/` - Images and other static assets

## Future Development

This is a minimal implementation to verify the build process. The full implementation will include:
- HealthKit integration
- AI-driven insights
- Protocol management
- Data visualization 