Football Controller (Flutter)

This folder contains a simple Flutter controller app that sends HTTP requests to the Phaser game running on your PC.

Files created:
- pubspec.yaml
- lib/main.dart

How to run
1. Install Flutter SDK and connect a device or emulator.
2. From this folder, get packages:

```bash
cd flutter_controller_app
flutter pub get
```

3. Run on a connected device or emulator:

```bash
flutter run
```

Usage
- Enter your game host IP in the app (for example `http://192.168.0.107:8080`).
- Open Player 1 or Player 2 controller screens and press buttons.
- The app sends requests like:

```
GET http://<HOST>:8080/api/controller-state?action=left&value=1
GET http://<HOST>:8080/api/controller-state?action=left&value=0
```

Notes
- Ensure both phone and PC are on the same Wi-Fi network.
- If responses fail, check firewall and server status.
