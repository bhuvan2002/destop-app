# Bhuvan Desktop App - Publishing Guide

To publish an update to your desktop application after making changes to your frontend (FE) or backend (BE) source code, you need to compile those changes and then package a new release of your Electron app. Since your Electron app uses `electron-updater` and GitHub for releases, the app will automatically download and install the new update for your users once it is published.

Here is the step-by-step guide to doing this:

## Step 1: Rebuild the Backend (if you made BE changes)
If you made changes to the backend (or your database schema), you need to recompile the TypeScript code to JavaScript. 
1. Open your terminal.
2. Navigate to the backend directory:
   ```powershell
   cd f:\Bhuvan_App\BE
   ```
3. Run the build command:
   ```powershell
   npm run build
   ```
*(This will update the `BE/dist` folder with your latest changes).*

## Step 2: Rebuild the Frontend (if you made FE changes)
If you made changes to the React frontend, you need to bundle it using Vite.
1. Navigate to the frontend directory:
   ```powershell
   cd f:\Bhuvan_App\FE
   ```
2. Run the build command:
   ```powershell
   npm run build
   ```
*(This will update the `FE/dist` folder which your Electron app relies on).*

## Step 3: Test Your Changes Locally (Highly Recommended)
Before packaging everything, verify that the Electron app still works correctly inside its wrapper with your new changes.
1. Navigate to the desktop directory:
   ```powershell
   cd f:\Bhuvan_App\desktop
   ```
2. Start the local Electron instance:
   ```powershell
   npm start
   ```

## Step 4: Increase the Application Version
For the `electron-updater` to recognize that this is a new update (so it can download it to user machines), you **must** increment the version number.
1. Open `f:\Bhuvan_App\desktop\package.json`
2. Find the `"version"` field at the top of the file.
3. Increase it to the next version number (e.g., from `"1.1.1"` to `"1.1.2"` or `"1.2.0"`).

## Step 5: Ensure Your GitHub Token is Set
Because your app publishes directly to GitHub (`bhuvan2002/destop-app`), `electron-builder` requires authorization to upload the release draft.
1. Ensure you have generated a Personal Access Token on GitHub with `repo` permissions.
2. In your standard Windows Command Prompt or PowerShell, set the token temporarily before running the publish command.

**PowerShell:**
```powershell
$env:GH_TOKEN="ghp_your_personal_access_token_here"
```

## Step 6: Build and Publish the Release!
Finally, you compile the desktop application and send the installer directly to GitHub.
1. Ensure you are still in the `desktop` directory:
   ```powershell
   cd f:\Bhuvan_App\desktop
   ```
2. Run your publish script:
   ```powershell
   npm run publish
   ```

### What happens next?
`electron-builder` will compile the entire app into a `.exe` setup file, bundle `../FE/dist` and `../BE/dist`, and upload it as a "Draft Release" on your GitHub repository. 

Once the upload is finished, go to your GitHub releases page and **publish** the draft release. The next time you open the existing Bhuvan desktop app on any computer, your auto-updater code in `main.ts` will detect the new version, download it, and prompt the user to restart and install the update!

### 💡 Note on `git push` vs Publishing
You **do not** need to use `git commit` or `git push` to trigger the auto-update for your users (although you should still `git push` to back up your source code!). 

The `npm run publish` command handles the entire update delivery by connecting to your GitHub repository and uploading the compiled `.exe` directly into the "Releases" section. The app's auto-updater looks at this "Releases" section to find and download updates, not at your raw source code files.
