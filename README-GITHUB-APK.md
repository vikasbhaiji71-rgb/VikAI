# VikAI — GitHub APK Build

This project is prepared to build the existing VikAI web app as an Android APK using Capacitor and GitHub Actions.

## Build on GitHub

1. Create a new GitHub repository.
2. Upload the contents of this project to the repository.
3. Push the project to the `main` branch.
4. Open **Actions** → **Build VikAI APK**.
5. Run the workflow if it did not start automatically.
6. Open the completed workflow run.
7. Download the **VikAI-debug-APK** artifact.

## Important

The Android shell packages the existing Vite/React frontend. If the app depends on a local Node/Express server, that server still needs to be deployed to a reachable HTTPS/WSS endpoint for the APK to use those backend features.

Do not commit API keys, private credentials, or service-account JSON files.
