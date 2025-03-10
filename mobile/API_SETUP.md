# Connecting the Isidor Mobile App to the Backend API

This guide explains how to connect your Isidor mobile app to the backend API during development.

## Quick Setup for Physical Devices

If you're testing on a physical device and experiencing connection issues, follow these steps:

1. Find your computer's IP address:
   - On macOS: System Preferences > Network (or run `ifconfig` in Terminal)
   - On Windows: Run `ipconfig` in Command Prompt
   - On Linux: Run `ip addr show` or `ifconfig` in Terminal

2. Open `services/api.ts` and update the MANUAL_IP constant:
   ```typescript
   // Change this from null to your actual IP address
   const MANUAL_IP = '192.168.1.123'; // Replace with your IP
   ```

3. Make sure your backend server is running on your computer
4. Make sure your phone and computer are on the same WiFi network
5. Restart the Expo development server: `npm start`

## API Configuration Details

The mobile app is configured to automatically detect the appropriate API URL based on your environment:

- iOS Simulator: Uses `http://localhost:8000`
- Android Emulator: Uses `http://10.0.2.2:8000` (Android's special IP for localhost)
- Physical Devices: Uses the IP address you set in MANUAL_IP

## API Endpoints Used by the App

The app uses the following API endpoints:

### Authentication
- `POST /api/v1/auth/login` - Login and get access token
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user information

### Health Metrics
- `GET /api/v1/health-metrics/user/{user_id}` - Get all health metrics for a user
- `GET /api/v1/health-metrics/user/{user_id}?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get health metrics for a date range
- `POST /api/v1/health-metrics/` - Create a new health metric

Note: The app automatically replaces `{user_id}` with the current user's ID. The `start_date` and `end_date` parameters must be in the format `YYYY-MM-DD`.

### Protocols
- `GET /api/v1/protocols/` - Get all available protocols
- `GET /api/v1/user-protocols/` - Get all user protocols
- `GET /api/v1/user-protocols/active` - Get active user protocols

## Testing API Endpoints

You can test the API endpoints directly using tools like curl or Postman:

1. Get an access token:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -d "username=your_email@example.com&password=your_password" \
     -H "Content-Type: application/x-www-form-urlencoded"
   ```

2. Use the token to access protected endpoints:
   ```bash
   curl -X GET http://localhost:8000/api/v1/auth/me \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

3. Get health metrics for a specific date:
   ```bash
   curl -X GET "http://localhost:8000/api/v1/health-metrics/user/YOUR_USER_ID?start_date=2025-03-10&end_date=2025-03-10" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Network Connectivity Check

The app includes a built-in network connectivity check tool that can help diagnose connection issues:

1. From the login screen, tap "Network Connectivity Check"
2. The tool will show your current API URL and test the connection
3. If the connection fails, follow the troubleshooting steps shown

## Common Connection Issues

1. **Wrong IP Address**: Make sure you're using the correct IP address for your computer
2. **Different Networks**: Ensure your phone and computer are on the same WiFi network
3. **Firewall Issues**: Check if your computer's firewall is blocking connections
4. **Backend Not Running**: Verify that your backend server is running
5. **Port Not Exposed**: Make sure port 8000 is accessible
6. **API Endpoint Mismatch**: Ensure the app is using the correct API endpoints

## Advanced Connection Options

### Option 1: Use your computer's IP address (same network)

This is the simplest approach for local development:

```typescript
const MANUAL_IP = '192.168.1.xxx'; // Replace with your computer's IP address
```

### Option 2: Use ngrok for external access

If you want to test from anywhere or share with others:

1. Install ngrok: `npm install -g ngrok` or download from [ngrok.com](https://ngrok.com/)
2. Start your backend server on port 8000
3. In a terminal, run: `ngrok http 8000`
4. Copy the HTTPS URL provided by ngrok
5. Update the MANUAL_IP in services/api.ts:

```typescript
// Use the ngrok URL without the protocol and port
const MANUAL_IP = 'a1b2c3d4.ngrok.io'; 
// And update the getApiUrl function to use https
if (MANUAL_IP) {
  return `https://${MANUAL_IP}`;
}
```

### Option 3: Deploy your backend

For a more permanent solution, deploy your backend to a cloud provider and use that URL.

## Troubleshooting

### Network Errors

If you see "Network request failed" errors:
- Verify the API URL is correct
- Ensure your backend server is running
- Check if your device can reach the API (try opening the URL in a browser on your phone)
- Make sure your device and computer are on the same network (if using local IP)
- Try using the Network Connectivity Check tool

### Authentication Issues

If login fails with authentication errors:
- Check the credentials
- Verify the API endpoints match what the backend expects
- Look for error messages in the console
- Check the backend logs for any server-side errors

### CORS Issues

If you see CORS errors:
- Make sure your backend allows requests from your mobile app's origin
- For development, you might need to configure your backend to accept all origins

## Next Steps

Once you've successfully connected to the API, you can:
1. Implement more API endpoints in `services/api.ts`
2. Create screens for viewing and managing health metrics
3. Develop protocol management features 