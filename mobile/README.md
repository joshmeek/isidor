# Isidor Mobile App

This is the mobile app for Isidor, an AI-driven life protocol system designed to optimize fitness, nutrition, sleep, cognitive performance, and overall well-being.

## Development Setup

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Expo Go app installed on your iPhone (available on the App Store)
- Xcode (for iOS simulator, optional)

### Running the App on Your iPhone

1. **Install dependencies:**

```bash
cd mobile
npm install
```

2. **Start the development server:**

```bash
npm start
```

3. **Connect to your iPhone:**

   - Make sure your iPhone and development computer are on the same Wi-Fi network
   - Install the Expo Go app from the App Store on your iPhone
   - Scan the QR code displayed in your terminal with your iPhone's camera
   - Tap the notification to open the app in Expo Go

4. **Alternative method (if your iPhone is connected via USB):**

```bash
npm run ios
```

This will open the app in Expo Go on your connected iPhone.

### Development Notes

- Changes to the code will automatically reload in the app
- Shake your device to open the developer menu
- Press `i` in the terminal to open in iOS simulator (if Xcode is installed)
- Press `a` in the terminal to open in Android emulator (if Android Studio is installed)

## Project Structure

- `app/` - Main application code using Expo Router
- `components/` - Reusable UI components
- `assets/` - Images, fonts, and other static assets

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
