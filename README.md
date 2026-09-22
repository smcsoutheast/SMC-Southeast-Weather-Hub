# SMC Southeast Weather Hotline

This is a self-contained GitHub Pages weather hotline for Soccer Management Company Southeast tournaments.

## Included files

- index.html
- style.css
- script.js
- README.md

## Current version

Phase 3 adds the next operational layer on top of the full Phase 2 build.

## Phase 2 features included

- Multi-admin access
- Admin access minimized to shield icon
- Venue-level controls
- Venue details editing
- Multi-select events per venue
- Automatic global status from venue status
- Venue cards match status color
- Command Center-only filters
- Public current tournament visibility control
- Incident logging
- Private operations timeline
- File and photo uploads for incident records
- Public map and venue detail support
- Full-screen command mode
- Emergency Red button
- All Green and All Yellow buttons

## Phase 3 features included

- Automated lightning alert workflow
- Public lightning distance display
- Public lightning countdown clock
- 10-mile Red status trigger
- 15-mile Yellow monitoring trigger
- 30-minute lightning clear timer
- Dynamic public field status board
- Field-level status records by venue
- AI-generated weather update draft builder
- Apply generated update to a venue
- Apply generated update as the global public note
- Status history shows only Green, Yellow, and Red status updates
- Status badges use colored backgrounds with white text

## Admin access

Click the shield icon in the bottom right corner.

Admin users:

- Tournament Director, Justin: justin2026$
- Tournament Operations, Ashley: ashley2026$

These passwords are stored in the front-end JavaScript file. This is suitable for simple GitHub Pages use, but not secure for sensitive data. For stronger protection, move admin access and data storage to Firebase, Supabase, or another backend.

## GitHub Pages setup

1. Create a GitHub repository named `SMC-Southeast-Weather-Hotline`.
2. Upload all files from this folder.
3. Go to Settings.
4. Go to Pages.
5. Select Deploy from branch.
6. Choose the main branch.
7. Choose root folder.
8. Save.

Your site should publish at:

https://smcsoccer.github.io/SMC-Southeast-Weather-Hotline/

## How to use

1. Open the public hotline page.
2. Click the shield icon.
3. Enter an admin password.
4. Update venue status, notes, details, maps, and tournament assignments.
5. Use Public Tournament View to show only current tournaments.
6. Use Automated Lightning Alerts to enter strike distance and minutes since last strike.
7. Use AI-Generated Weather Update to create a public note from a weather alert.
8. Use Dynamic Field Status Board to post field-level updates.
9. Log private incidents with optional file uploads.
10. Use the private Operations Timeline for staff updates.

## Lightning alert logic

- 10 miles or less sets the selected venue to Red.
- 15 miles or less sets the selected venue to Yellow.
- 30 minutes since last strike sets the selected venue to Green.
- A Red lightning alert starts a 30-minute countdown.
- The public page shows the closest strike distance and active countdown clock.
- When the countdown finishes, the venue changes to Green with a restart confirmation note.

## Field status board

Field status options:

- Open
- Delayed
- Closed
- Under Review
- Maintenance

The public Field Status Board appears only when field status records exist.

## AI-generated weather update notes

The update builder runs in the browser. It does not use an external AI service or API key.

Use it to turn alert details into a clean public update, then review the draft before applying it.

## Status logic

The global status updates automatically.

- Any Red venue makes the global status Red.
- If no venues are Red, any Yellow venue makes the global status Yellow.
- If all venues are Green, the global status is Green.

## Data storage

This version uses browser localStorage.

This means:

- Updates stay in the same browser.
- Updates do not automatically sync across devices.
- Uploaded files are stored in the browser and count toward storage limits.

For live multi-device use, upgrade the storage layer to Firebase.

## Public venue cards

The public venue cards show only:

- Venue name
- Status
- Public note

Venue names display in uppercase. Card content is centered. Card color matches the venue status.


## Latest Lightning Updates

- Added a Manual All Clear button in Active Lightning Alerts.
- The button changes the selected venue to Green.
- It posts a Green lightning all-clear entry to Status History.
- It updates the public venue note.
- When no Red or Yellow lightning alert is active, the public lightning panel stays collapsed behind a yellow lightning bolt badge.
- Visitors may tap the yellow lightning badge to view the current all-clear lightning status.

## Latest Admin Layout Updates

- Admin access opens full screen after a successful login.
- Command Center is organized into tabs: Overview, Lightning, Fields, Venues, and Logs.
- Default venue data has been removed. Add venues from the Venues tab.
- Command Center tournament filter now uses a checkbox dropdown.
- Current Tournaments now uses a checkbox dropdown.
- Clear Public Status History moved to the Logs tab under Operations Timeline.
- Clear Public Status History only removes the public Green, Yellow, and Red status history.

## Blank Default Data

This version uses a new localStorage key so the hotline starts with no venue records by default. Add each venue from the Venues tab.


## Public page branding updates

The public footer includes the Soccer Management Company logo and the footer text: Soccer Management Company - Southeast Weather Hub. The public page also includes app reference cards for My Lightning Tracker & Alerts and MyRadar with this heading: SMC Southeast uses the following weather apps when monitoring weather conditions in addition to weather alerts from the National Weather Service.

## GitHub Pages Fix

This ZIP is root-ready. Upload the files inside the ZIP directly to the repository root.

Your repository should show `index.html`, `style.css`, `script.js`, `README.md`, `.nojekyll`, and the `assets` folder at the top level.

Do not upload the parent folder into the repository. GitHub Pages will not load the site from the expected root URL if `index.html` is nested inside that folder.



Options:

- Light
- Dark

The selected theme is saved in the visitor's browser, so the page keeps the same theme on return visits.

## Firebase update

This version includes optional Firebase Realtime Database sync.

Files added or changed:

- firebase-config.js
- index.html
- script.js
- style.css

Firebase lets the hotline sync updates across multiple devices.

### Firebase setup steps

1. Go to Firebase Console.
2. Create a new project.
3. Add a Web App to the project.
4. Copy the Firebase config values.
5. Open `firebase-config.js`.
6. Replace the placeholder values.
7. Change `enabled: false` to `enabled: true`.
8. In Firebase, create a Realtime Database.
9. Start in test mode for setup.
10. Publish the updated files to GitHub.

### Realtime Database path

The hotline saves data here:

`southeast-weather-hotline/live-data`

### Basic setup rules for testing

Use these only for testing while the page is being set up:

```json
{
  "rules": {
    "southeast-weather-hotline": {
      ".read": true,
      ".write": true
    }
  }
}
```

For live use, restrict write access before sharing the admin password widely.

### How Firebase behaves

- If Firebase is enabled and configured, updates sync across devices.
- If Firebase is not enabled, the page still works with browser localStorage.
- The Command Center shows Firebase Sync status.
- Public users see live updates when Firebase is active.
- Admin updates save locally first, then sync to Firebase.


## Display Theme

The public hotline and command center use a fixed light theme. There is no visitor theme selector.
## Lightning timer overlap fix

- Multiple lightning delay entries for the same venue now act as one active delay window.
- An older expired countdown cannot change a venue to Green while a newer countdown is still active.
- The venue remains Red until the latest active countdown finishes or SMC staff use Manual All Clear.
- A new qualifying lightning check extends the active countdown when its clear time is later than the existing timer.
- Manual All Clear closes all active lightning timers for the selected venue.
- Admin and public countdown displays follow the latest active timer for the venue.

