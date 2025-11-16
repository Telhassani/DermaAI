# Manual Testing Guide - DermAI Application

**Date**: November 16, 2025
**Version**: 1.0
**Scope**: Comprehensive testing of all DermAI features
**Estimated Time**: 37.5 hours for complete coverage

---

## Table of Contents

1. [Setup Requirements](#setup-requirements)
2. [Pre-Testing Checklist](#pre-testing-checklist)
3. [Module 1: Authentication (2 hours)](#module-1-authentication-2-hours)
4. [Module 2: Patient Management (4 hours)](#module-2-patient-management-4-hours)
5. [Module 3: Appointment Scheduling (6 hours)](#module-3-appointment-scheduling-6-hours)
6. [Module 4: Consultations (3 hours)](#module-4-consultations-3-hours)
7. [Module 5: Prescriptions (3 hours)](#module-5-prescriptions-3-hours)
8. [Module 6: Image Analysis (2 hours)](#module-6-image-analysis-2-hours)
9. [Cross-Cutting Concerns (9.5 hours)](#cross-cutting-concerns-95-hours)
10. [Bug Reporting Template](#bug-reporting-template)

---

## Setup Requirements

### Prerequisites
- All services running: `docker-compose up -d`
- Backend running: `uvicorn app.main:app --reload --port 8000`
- Frontend running: `npm run dev` (http://localhost:3000)
- PostgreSQL database initialized with seed data
- Test user accounts available:
  - **Doctor Account**: doctor@dermai.com / DoctorTest123!
  - **Admin Account**: admin@dermai.com / AdminTest123!
  - **Assistant Account**: assistant@dermai.com / AssistantTest123!

### Browser & Tools
- Modern browser (Chrome/Safari/Firefox) with developer tools open
- Network tab to verify API calls
- Console tab to check for JavaScript errors
- Postman/cURL for API testing (optional)

### Test Environment Verification

Before starting tests, verify:
```bash
# Check backend is running
curl -s http://localhost:8000/docs | grep -q "Swagger" && echo "✓ Backend OK" || echo "✗ Backend Failed"

# Check frontend is running
curl -s http://localhost:3000 | grep -q "DermAI" && echo "✓ Frontend OK" || echo "✗ Frontend Failed"

# Check database
docker exec dermai-postgres psql -U dermai_user -d dermai_db -c "SELECT COUNT(*) FROM users;" | grep -q "[0-9]" && echo "✓ Database OK" || echo "✗ Database Failed"
```

---

## Pre-Testing Checklist

Before executing any tests, complete these preparation steps:

- [ ] All services running (Docker, backend, frontend)
- [ ] Browser console open with no errors
- [ ] Network tab enabled for API monitoring
- [ ] Test database has seed data
- [ ] Test accounts verified via login
- [ ] Read through all test procedures
- [ ] Document any pre-existing bugs
- [ ] Set up tracking spreadsheet for results

---

## Module 1: Authentication (2 hours)

### TEST #1.1: Login with Valid Credentials
**Objective**: Verify that a user can successfully log in with correct credentials
**Pre-requisites**: No active session, browser cookies cleared
**Time**: 10 minutes

**Steps:**
1. Navigate to http://localhost:3000
2. You should see the login page with email and password fields
3. Enter email: `doctor@dermai.com`
4. Enter password: `DoctorTest123!`
5. Click the "Login" or "Sign In" button
6. Observe the page transition

**Expected Results:**
- [ ] Login button is clickable and shows loading state
- [ ] Page redirects to `/dashboard` (or similar protected route)
- [ ] User info displayed in header/sidebar (name: "Dr. Test Doctor")
- [ ] No console errors or warnings
- [ ] Network tab shows successful login request (200 OK)
- [ ] Cookie `access_token` is set with httpOnly flag
- [ ] Session persists on page reload

**Verification Points:**
```javascript
// In browser console, verify auth state:
localStorage.getItem('auth') // Should contain user data
document.cookie // Should show httpOnly cookie set
```

**Notes:**
- Record response time for login request
- Check that password field masks input correctly
- Verify no password appears in network requests

---

### TEST #1.2: Login with Invalid Email
**Objective**: Verify that invalid email is rejected
**Time**: 5 minutes

**Steps:**
1. From login page, enter email: `nonexistent@dermai.com`
2. Enter password: `DoctorTest123!`
3. Click "Login"

**Expected Results:**
- [ ] Error message displayed: "Invalid email or password"
- [ ] Page remains on login route
- [ ] No redirect occurs
- [ ] Form fields are not cleared (UX consideration)
- [ ] No console errors

---

### TEST #1.3: Login with Invalid Password
**Objective**: Verify that incorrect password is rejected
**Time**: 5 minutes

**Steps:**
1. From login page, enter email: `doctor@dermai.com`
2. Enter password: `WrongPassword123!`
3. Click "Login"

**Expected Results:**
- [ ] Error message displayed: "Invalid email or password"
- [ ] Page remains on login route
- [ ] User is not logged in (no cookie set)

---

### TEST #1.4: Register New User
**Objective**: Verify that a new user can register an account
**Time**: 10 minutes

**Steps:**
1. From login page, click "Register" or "Sign Up" link
2. Fill in form:
   - Full Name: `Dr. New Doctor`
   - Email: `newdoctor@test.com` (unique email)
   - Password: `NewDoctor123!`
   - Confirm Password: `NewDoctor123!`
   - Role: Select "Doctor" from dropdown
3. Click "Register"

**Expected Results:**
- [ ] All form fields validate client-side
- [ ] Password requirements shown (min 8 chars, uppercase, number, special char)
- [ ] Confirm password field matches password field
- [ ] Success message shown
- [ ] User is logged in automatically (redirected to dashboard)
- [ ] New user appears in database
- [ ] Network shows successful registration (201 Created)

**Verification Points:**
```bash
# Verify in database
docker exec dermai-postgres psql -U dermai_user -d dermai_db -c \
  "SELECT email, full_name FROM users WHERE email = 'newdoctor@test.com';"
```

---

### TEST #1.5: Register with Duplicate Email
**Objective**: Verify that duplicate email is rejected
**Time**: 5 minutes

**Steps:**
1. From register page, enter:
   - Email: `doctor@dermai.com` (existing user)
   - Password: `NewPassword123!`
   - Other fields as needed
2. Click "Register"

**Expected Results:**
- [ ] Error message shown: "Email already registered" or "Cet email est déjà utilisé"
- [ ] Form is not submitted
- [ ] Email field highlighted with error state
- [ ] User stays on registration page

---

### TEST #1.6: Register with Weak Password
**Objective**: Verify that weak passwords are rejected
**Time**: 5 minutes

**Steps:**
1. From register page, enter:
   - Password: `weakpass` (no uppercase, number, special char)
2. Try to submit

**Expected Results:**
- [ ] Error message shown about password requirements
- [ ] Form validation shows specific missing requirements
- [ ] Submit button disabled until password is valid
- [ ] User can see password strength indicator (if implemented)

---

### TEST #1.7: Logout
**Objective**: Verify that user can successfully log out
**Time**: 5 minutes

**Steps:**
1. Login as doctor@dermai.com
2. Navigate to dashboard
3. Click user menu in header (usually top-right)
4. Click "Logout" or "Sign Out"

**Expected Results:**
- [ ] User is redirected to login page
- [ ] Session cookies are cleared
- [ ] Local storage auth data is cleared
- [ ] Attempting to access `/dashboard` redirects to login
- [ ] Network shows logout request (200 OK)
- [ ] Browser back button doesn't restore session

---

### TEST #1.8: Session Persistence on Reload
**Objective**: Verify that user session persists when page is reloaded
**Time**: 5 minutes

**Steps:**
1. Login as doctor@dermai.com
2. Navigate to `/dashboard`
3. Press F5 or Cmd+R to reload page
4. Verify you're still logged in

**Expected Results:**
- [ ] Page reloads successfully
- [ ] User remains logged in
- [ ] User info still visible in header
- [ ] No redirect to login page
- [ ] No console errors during reload

---

### TEST #1.9: Expired Token Handling
**Objective**: Verify that expired tokens are handled gracefully
**Time**: 10 minutes

**Steps:**
1. Login successfully as doctor@dermai.com
2. Open browser console
3. Manually delete the auth token: `localStorage.removeItem('auth')`
4. Reload page or navigate to dashboard

**Expected Results:**
- [ ] User is redirected to login page
- [ ] Error message shown (optional): "Session expired, please login again"
- [ ] Attempting any API call shows 401 Unauthorized
- [ ] No stuck loading states

---

### TEST #1.10: Rate Limiting on Login
**Objective**: Verify that login is rate-limited to prevent brute force
**Time**: 10 minutes

**Steps:**
1. From login page, attempt 6 failed logins in succession with wrong password
2. Observe what happens on the 6th attempt

**Expected Results:**
- [ ] After 5 failed attempts (configurable), rate limiting triggered
- [ ] 6th attempt returns 429 Too Many Requests or similar
- [ ] Error message shown: "Too many login attempts, please try again later"
- [ ] Can retry after cooldown period (e.g., 5 minutes)
- [ ] Network tab shows 429 status code

---

## Module 2: Patient Management (4 hours)

### TEST #2.1: Create New Patient
**Objective**: Verify that a doctor can create a new patient record
**Time**: 15 minutes

**Steps:**
1. Login as doctor@dermai.com
2. Navigate to Patients section
3. Click "New Patient" or "Add Patient" button
4. Fill in form:
   - First Name: `Jean`
   - Last Name: `Dupont`
   - Date of Birth: `1985-03-15`
   - Gender: `Male`
   - Phone: `0612345678`
   - Email: `jean.dupont@test.com`
   - Identification Type: `CIN`
   - Identification Number: `CIN123456`
5. Click "Save" button

**Expected Results:**
- [ ] Modal/form opens without errors
- [ ] All required fields are clearly marked
- [ ] Date picker allows selection of date
- [ ] Phone field formats correctly (shows +212 or local format)
- [ ] Gender dropdown shows all options
- [ ] Success message shown after save
- [ ] Patient appears in patient list
- [ ] Patient card shows correct information
- [ ] Network tab shows POST /api/v1/patients (201 Created)

**Verification Points:**
```bash
# Verify in database
docker exec dermai-postgres psql -U dermai_user -d dermai_db -c \
  "SELECT first_name, last_name, email FROM patients WHERE email = 'jean.dupont@test.com';"
```

**UI/UX Checks:**
- [ ] Modal is centered on screen
- [ ] Form fields have proper labels and placeholders
- [ ] Submit button shows loading state during save
- [ ] Error message is clear if save fails
- [ ] Modal closes automatically on success

---

### TEST #2.2: View Patient List
**Objective**: Verify that the patient list displays correctly
**Time**: 10 minutes

**Steps:**
1. Login as doctor@dermai.com
2. Navigate to Patients section
3. Observe the patient list
4. Scroll through the list
5. Try searching for a patient

**Expected Results:**
- [ ] Patient list loads with multiple patients
- [ ] Each patient card shows:
  - [ ] Patient name
  - [ ] Date of birth / Age
  - [ ] Identification number
  - [ ] Last appointment date (if available)
  - [ ] Contact phone or email
- [ ] List is paginated (if >10 patients) or scrollable
- [ ] Search field filters patients in real-time
- [ ] Search works on name, email, phone, ID number
- [ ] Sorting options available (name, date added, last appointment)
- [ ] No console errors when scrolling

---

### TEST #2.3: View Patient Details
**Objective**: Verify that patient detail page displays correctly
**Time**: 10 minutes

**Steps:**
1. From patient list, click on any patient card
2. Observe the patient detail page
3. Scroll to see all information

**Expected Results:**
- [ ] Patient detail page loads without errors
- [ ] All patient information is displayed:
  - [ ] Full name
  - [ ] Date of birth / Age calculation
  - [ ] Gender
  - [ ] Contact information (phone, email)
  - [ ] Identification documents
  - [ ] Medical history (if available)
  - [ ] List of appointments
  - [ ] List of consultations
- [ ] Edit button is visible and accessible
- [ ] Delete button is visible (if user has permission)
- [ ] Breadcrumb navigation shows: Patients > Patient Name
- [ ] Page loads quickly (< 2 seconds)

---

### TEST #2.4: Edit Patient Information
**Objective**: Verify that patient information can be updated
**Time**: 15 minutes

**Steps:**
1. From patient detail page, click "Edit" button
2. Modify some information:
   - Change phone number: `0687654321`
   - Change email: `newemail@test.com`
3. Click "Save"
4. Navigate back to patient detail page

**Expected Results:**
- [ ] Edit modal/form opens with current data pre-filled
- [ ] All fields are editable
- [ ] Form validation works same as create form
- [ ] Changes are saved to database
- [ ] Success message shown after save
- [ ] Patient detail page shows updated information
- [ ] Audit log records the update (if implemented)
- [ ] Network shows PATCH /api/v1/patients/:id (200 OK)

---

### TEST #2.5: Delete Patient (Soft Delete)
**Objective**: Verify that patients can be deleted (soft delete)
**Time**: 10 minutes

**Steps:**
1. From patient detail page, click "Delete" button
2. Confirm deletion in modal
3. Try to find the patient in the list

**Expected Results:**
- [ ] Confirmation dialog shown: "Are you sure you want to delete this patient?"
- [ ] Patient is marked as deleted in database (soft delete)
- [ ] Patient no longer appears in active patient list
- [ ] Deleted patient can be viewed if "Show deleted" is enabled (admin feature)
- [ ] Any pending appointments are handled (shown in confirmation)
- [ ] Network shows DELETE /api/v1/patients/:id (200 OK)
- [ ] Redirect to patient list after deletion

**Verification Points:**
```bash
# Verify soft delete in database
docker exec dermai-postgres psql -U dermai_user -d dermai_db -c \
  "SELECT id, first_name, is_deleted, deleted_at FROM patients WHERE id = <patient_id>;"
```

---

### TEST #2.6: Patient Statistics
**Objective**: Verify that patient statistics are calculated correctly
**Time**: 10 minutes

**Steps:**
1. Navigate to patient detail page
2. Look for statistics section (appointments, consultations, etc.)
3. Check that numbers match actual records

**Expected Results:**
- [ ] Statistics section loads correctly
- [ ] Shows accurate counts:
  - [ ] Total appointments
  - [ ] Upcoming appointments
  - [ ] Completed appointments
  - [ ] Total consultations
- [ ] Statistics update when appointments are added/removed
- [ ] No console errors when loading stats

**Known Issues:**
- Currently may show 0 values (needs implementation)

---

### TEST #2.7: Patient Search and Filter
**Objective**: Verify that search and filtering work correctly
**Time**: 10 minutes

**Steps:**
1. From patient list, use search field
2. Type patient name: `Jean` (partial match)
3. Observe results
4. Clear search
5. Try filtering by gender or other criteria (if available)

**Expected Results:**
- [ ] Search filters results in real-time
- [ ] Search is case-insensitive
- [ ] Partial name matching works (e.g., "Jean" finds "Jean Dupont")
- [ ] Search also works on email, phone, ID number
- [ ] Clear search button removes filter
- [ ] Results update without page reload
- [ ] Loading indicator shown during search
- [ ] "No results" message if no matches found

---

### TEST #2.8: Bulk Actions (if implemented)
**Objective**: Verify that bulk actions work on multiple patients
**Time**: 10 minutes

**Steps:**
1. From patient list, select multiple patients (checkboxes)
2. Look for bulk action menu
3. Try bulk export or bulk delete (if available)

**Expected Results:**
- [ ] Checkboxes visible and clickable
- [ ] Bulk action menu appears when patients selected
- [ ] Actions are relevant (export, delete, send message, etc.)
- [ ] Bulk actions are confirmed before execution
- [ ] Success message shown after bulk action
- [ ] Selected patients are updated/deleted

---

## Module 3: Appointment Scheduling (6 hours)

### TEST #3.1: Create Single Appointment
**Objective**: Verify that a single (non-recurring) appointment can be created
**Time**: 15 minutes

**Steps:**
1. Login as doctor@dermai.com
2. Navigate to Appointments or Calendar section
3. Click "New Appointment" or "Schedule Appointment"
4. Fill in form:
   - Select Patient: `Jean Dupont`
   - Date: Tomorrow at 10:00 AM
   - Duration: 1 hour (end time: 11:00 AM)
   - Type: `Consultation`
   - Reason: `Skin checkup`
5. Click "Save"

**Expected Results:**
- [ ] Modal/form opens without errors
- [ ] Patient dropdown is searchable and shows list
- [ ] Date picker allows future dates
- [ ] Time picker allows selection (hour + minutes)
- [ ] Duration auto-calculates end time
- [ ] Appointment type dropdown shows options
- [ ] Success message shown after save
- [ ] Appointment appears in calendar view
- [ ] Network shows POST /api/v1/appointments (201 Created)

**UI/UX Checks:**
- [ ] Modal is centered and properly formatted
- [ ] Form fields have helpful placeholders
- [ ] Time fields use proper formatting (HH:MM)
- [ ] Submit button shows loading state

---

### TEST #3.2: View Calendar - Month View
**Objective**: Verify that calendar month view displays appointments
**Time**: 10 minutes

**Steps:**
1. Navigate to Calendar section
2. Verify you're in "Month" view (toggle if needed)
3. Navigate to current month
4. Look for created appointments

**Expected Results:**
- [ ] Calendar displays full month with all days
- [ ] Appointments are shown as cards/blocks in calendar
- [ ] Appointment shows patient name and time
- [ ] Different appointment types have different colors
- [ ] Can navigate between months with arrows
- [ ] Today's date is highlighted
- [ ] Day names are correct (Mon, Tue, etc.)
- [ ] Weekends may have different styling (optional)
- [ ] No overlapping appointment blocks

---

### TEST #3.3: View Calendar - Week View
**Objective**: Verify that calendar week view displays appointments
**Time**: 10 minutes

**Steps:**
1. From calendar, toggle to "Week" view
2. Navigate to current week
3. Observe appointment display

**Expected Results:**
- [ ] Calendar shows 7 days in a week layout
- [ ] Time slots are visible (hourly)
- [ ] Appointments are shown with proper time spans
- [ ] Can see multiple appointments on same day without overlap
- [ ] Week can be navigated with arrows
- [ ] Current day is highlighted
- [ ] Time zone is correct
- [ ] Scroll to see full day (6 AM - 6 PM range)

---

### TEST #3.4: View Calendar - Day View
**Objective**: Verify that calendar day view displays appointments
**Time**: 10 minutes

**Steps:**
1. From calendar, toggle to "Day" view
2. Select a specific day (one with appointments)
3. Observe time-based layout

**Expected Results:**
- [ ] Calendar shows single day with hourly timeline
- [ ] All appointments for that day are visible
- [ ] Time slots show full hours
- [ ] Can scroll to see different times of day
- [ ] Previous/next day navigation works
- [ ] Date picker allows quick day selection
- [ ] Current time indicator shown (if today)

---

### TEST #3.5: Drag and Drop Rescheduling
**Objective**: Verify that appointments can be rescheduled via drag-and-drop
**Time**: 15 minutes

**Steps:**
1. In calendar view (month, week, or day)
2. Find an appointment
3. Click and drag it to a different time/day
4. Release and confirm rescheduling

**Expected Results:**
- [ ] Appointment is draggable (cursor changes to grab)
- [ ] Dragging shows visual feedback (opacity, hover effect)
- [ ] Can drop on any available time slot
- [ ] Confirmation dialog may appear to confirm time change
- [ ] Appointment updates to new time in database
- [ ] Calendar view updates without full reload
- [ ] Success message shown (or automatic, no dialog)
- [ ] Network shows PATCH /api/v1/appointments/:id
- [ ] Original time no longer shows appointment

**Edge Cases:**
- [ ] Try dragging to conflicting time (should be prevented)
- [ ] Try dragging to past date (should be prevented)
- [ ] Try dragging to same time (should be no-op)

---

### TEST #3.6: Appointment Conflict Detection
**Objective**: Verify that the system detects and prevents scheduling conflicts
**Time**: 15 minutes

**Steps:**
1. Create appointment: Doctor + Patient, Tomorrow 10:00-11:00
2. Try to create another appointment: Same doctor, Tomorrow 10:30-11:30
3. Try to drag an appointment to conflicting slot

**Expected Results:**
- [ ] Conflict detected when trying to create second appointment
- [ ] Error message shown: "This time slot is not available" or similar
- [ ] Suggestions shown for available time slots
- [ ] User can select suggested time or pick different time
- [ ] Conflicting appointment is not created
- [ ] Drag-and-drop to conflict time is prevented
- [ ] Network shows 409 Conflict or 400 Bad Request
- [ ] Calendar visual may highlight conflicts

**Visual Feedback:**
- [ ] Conflicting time slot appears highlighted/disabled
- [ ] Suggestion modal shows next available slots
- [ ] Doctor's busy slots are clearly marked

---

### TEST #3.7: Create Recurring Appointment
**Objective**: Verify that recurring appointments can be created
**Time**: 20 minutes

**Steps:**
1. Click "New Appointment"
2. Fill in:
   - Patient: `Jean Dupont`
   - Start Date: Tomorrow at 10:00 AM
   - Duration: 1 hour
3. Enable "Recurring" or toggle
4. Configure recurrence:
   - Pattern: Every week
   - End Date: 2 months from now
   - Occurs On: Monday, Wednesday, Friday
5. Click "Save"

**Expected Results:**
- [ ] Recurring toggle is visible and functional
- [ ] Recurrence options appear after enabling
- [ ] Can select pattern: Daily, Weekly, Bi-weekly, Monthly
- [ ] Can select specific days (for weekly recurrence)
- [ ] Can set end date or number of occurrences
- [ ] Preview shows all occurrences (e.g., "6 appointments will be created")
- [ ] Confirmation shown: "Create 6 recurring appointments?"
- [ ] All appointments created successfully
- [ ] Each appointment appears in calendar
- [ ] Network shows POST with recurrence_rule in JSON format
- [ ] Database stores recurrence rule

**Verification Points:**
```bash
# Check recurring appointments in database
docker exec dermai-postgres psql -U dermai_user -d dermai_db -c \
  "SELECT id, start_time, recurrence_rule FROM appointments WHERE recurrence_rule IS NOT NULL LIMIT 5;"
```

---

### TEST #3.8: Edit Single Occurrence in Recurring Series
**Objective**: Verify that a single occurrence can be modified without affecting series
**Time**: 15 minutes

**Steps:**
1. Find a recurring appointment series
2. Click on one occurrence
3. Select "Edit this occurrence" (not the series)
4. Change time or patient
5. Save

**Expected Results:**
- [ ] Modal asks whether to edit this event or series
- [ ] Can select "This event only" or "All events"
- [ ] If "This event only", only that occurrence changes
- [ ] Other occurrences remain unchanged
- [ ] Calendar shows the modified occurrence
- [ ] Database shows the series still intact
- [ ] Modified event may show different styling (to indicate override)

---

### TEST #3.9: Delete Recurring Series
**Objective**: Verify that recurring series can be deleted
**Time**: 10 minutes

**Steps:**
1. Find a recurring appointment
2. Click "Delete"
3. Choose "Delete all occurrences"
4. Confirm deletion

**Expected Results:**
- [ ] Delete dialog asks whether to delete single event or series
- [ ] If "All occurrences" selected, all appointments deleted
- [ ] Confirmation shows: "6 appointments will be deleted"
- [ ] All appointments removed from calendar
- [ ] Database shows all appointments deleted (soft delete)
- [ ] Network shows multiple DELETE requests or single bulk delete

---

### TEST #3.10: Appointment Status Updates
**Objective**: Verify that appointment status can be changed
**Time**: 10 minutes

**Steps:**
1. Find an appointment
2. Click on it to open details
3. Change status:
   - SCHEDULED → CONFIRMED
   - SCHEDULED → CANCELLED
   - COMPLETED (for past appointments)

**Expected Results:**
- [ ] Status dropdown shows all valid options
- [ ] Status changes are saved to database
- [ ] Calendar visual updates (color, style)
- [ ] Cancelled appointments may be shown differently
- [ ] Completed appointments locked from editing
- [ ] Network shows PATCH /api/v1/appointments/:id
- [ ] History/audit log recorded (if implemented)

---

### TEST #3.11: Appointment Notifications (if implemented)
**Objective**: Verify that appointment reminders work
**Time**: 10 minutes

**Steps:**
1. Create appointment for tomorrow
2. Look for notification settings
3. Select notification timing: 24 hours before, 1 hour before
4. Wait for notification (or manually trigger for testing)

**Expected Results:**
- [ ] Notification settings available on appointment
- [ ] Can set multiple reminders
- [ ] Notifications sent at correct time
- [ ] Can receive via email/SMS/in-app (depending on settings)
- [ ] Doctor receives notification
- [ ] Patient receives notification (if system sends)

---

### TEST #3.12: Appointment Duration Validation
**Objective**: Verify that appointment duration is validated
**Time**: 5 minutes

**Steps:**
1. Create appointment
2. Try invalid durations: 0 minutes, 30 minutes (if minimum is 1 hour)
3. Try very long duration: 24 hours

**Expected Results:**
- [ ] Minimum duration enforced (e.g., 30 minutes)
- [ ] Maximum duration enforced (e.g., 4 hours)
- [ ] Error message shown if invalid
- [ ] Submit button disabled for invalid duration
- [ ] Sensible defaults suggested

---

## Module 4: Consultations (3 hours)

### TEST #4.1: Create Consultation
**Objective**: Verify that a consultation record can be created
**Time**: 15 minutes

**Steps:**
1. From patient detail or appointment page, click "New Consultation"
2. Or select an appointment and click "Create Consultation"
3. Fill in form:
   - Patient: Auto-filled
   - Appointment: Select from list
   - Date: Auto-filled from appointment
   - Chief Complaint: `Patient reports dry skin on face`
   - Physical Examination: `Red patches visible on cheeks`
   - Diagnosis: `Dermatitis`
   - Treatment Plan: `Prescribe moisturizer and sunscreen`
4. Click "Save"

**Expected Results:**
- [ ] Form opens without errors
- [ ] Patient and appointment fields are pre-filled if accessed from there
- [ ] Rich text editor available for notes (if implemented)
- [ ] Character count shown (if limited)
- [ ] Success message shown after save
- [ ] Consultation appears in patient's consultation list
- [ ] Network shows POST /api/v1/consultations (201 Created)

---

### TEST #4.2: View Consultation List
**Objective**: Verify that consultations are displayed correctly
**Time**: 10 minutes

**Steps:**
1. From patient detail page, scroll to "Consultations" section
2. Observe the list of consultations
3. Click on one consultation to view details

**Expected Results:**
- [ ] List shows all patient consultations
- [ ] Each entry shows:
  - [ ] Date of consultation
  - [ ] Brief summary (first 100 chars of chief complaint)
  - [ ] Doctor's name
  - [ ] Appointment link (if applicable)
- [ ] Sorted by date (newest first)
- [ ] Can click to view full consultation
- [ ] Edit button visible for doctor

---

### TEST #4.3: Edit Consultation
**Objective**: Verify that consultation notes can be edited
**Time**: 10 minutes

**Steps:**
1. Open a consultation
2. Click "Edit"
3. Modify treatment plan: `Add: Use hydrating mask twice weekly`
4. Click "Save"
5. Verify changes are saved

**Expected Results:**
- [ ] Edit button visible and accessible
- [ ] Form opens with all current data pre-filled
- [ ] Can modify all fields
- [ ] Changes saved to database
- [ ] Timestamp updated to show when edited
- [ ] If audit logging enabled, edit recorded with user and timestamp
- [ ] Network shows PATCH /api/v1/consultations/:id

---

### TEST #4.4: Delete Consultation
**Objective**: Verify that consultation can be deleted (soft delete)
**Time**: 10 minutes

**Steps:**
1. Open a consultation
2. Click "Delete"
3. Confirm deletion

**Expected Results:**
- [ ] Confirmation dialog shown
- [ ] Soft delete performed (marked deleted, not removed)
- [ ] Consultation removed from list
- [ ] Can be recovered by admin (if soft delete supported)
- [ ] Network shows DELETE /api/v1/consultations/:id

---

### TEST #4.5: Consultation with Lab Results (if implemented)
**Objective**: Verify that lab results can be attached to consultation
**Time**: 15 minutes

**Steps:**
1. Create or edit consultation
2. Look for "Lab Results" section
3. Upload or attach lab results:
   - Click "Attach Lab Results"
   - Select or drag file
   - Provide lab name and date
4. Click "Save"

**Expected Results:**
- [ ] Lab results can be attached to consultation
- [ ] File is uploaded to server
- [ ] Lab result appears in consultation
- [ ] Can view/download attached file
- [ ] Can remove attachment
- [ ] File type validation (PDF, images)
- [ ] File size limits enforced

---

### TEST #4.6: Consultation History
**Objective**: Verify that consultation history and changes are tracked
**Time**: 10 minutes

**Steps:**
1. Open a consultation that was edited
2. Look for "History" or "Audit Log" section
3. Observe change history

**Expected Results:**
- [ ] Edit history visible (if implemented)
- [ ] Shows who edited and when
- [ ] Can see previous versions (if version history enabled)
- [ ] Cannot edit past edits (only view)
- [ ] Timestamps accurate

---

## Module 5: Prescriptions (3 hours)

### TEST #5.1: Create Prescription
**Objective**: Verify that a prescription can be created
**Time**: 15 minutes

**Steps:**
1. From consultation or patient detail, click "New Prescription"
2. Fill in form:
   - Patient: Auto-filled
   - Doctor: Auto-filled
   - Drug Search: Type `paracet` to find paracetamol
   - Select drug: `Paracetamol 500mg`
   - Dosage: `2 tablets`
   - Frequency: `3 times daily`
   - Duration: `7 days`
   - Instructions: `Take with food`
3. Click "Add Drug" to add more drugs if needed
4. Click "Save Prescription"

**Expected Results:**
- [ ] Form opens without errors
- [ ] Drug search is functional (autocomplete/suggestions)
- [ ] Can select from drug database
- [ ] Dosage and frequency fields are intuitive
- [ ] Duration calculator shows end date
- [ ] Can add multiple drugs to single prescription
- [ ] Success message shown after save
- [ ] Prescription appears in patient's prescription list
- [ ] Network shows POST /api/v1/prescriptions (201 Created)

---

### TEST #5.2: Drug Interaction Check
**Objective**: Verify that drug interactions are detected
**Time**: 15 minutes

**Steps:**
1. Create prescription with Drug A (e.g., Paracetamol)
2. Try to add Drug B that has known interaction (e.g., Aspirin)
3. Observe interaction warning

**Expected Results:**
- [ ] After adding second drug, interaction check performed
- [ ] Warning shown if interaction detected: "⚠️ Possible interaction between Paracetamol and Aspirin"
- [ ] Warning severity shown (Minor, Moderate, Severe)
- [ ] Link to interaction details (if available)
- [ ] Can proceed with warning acknowledged, or remove conflicting drug
- [ ] Interaction marked in prescription
- [ ] Doctor must confirm understanding of interaction

**Known Issues:**
- Drug interaction checking may be basic or not fully implemented yet

---

### TEST #5.3: View Prescription
**Objective**: Verify that prescription displays correctly
**Time**: 10 minutes

**Steps:**
1. From patient detail, click on a prescription
2. Observe the prescription details
3. Check readability for printing

**Expected Results:**
- [ ] Prescription shows all information:
  - [ ] Doctor name and credentials
  - [ ] Patient name and date of birth
  - [ ] Date issued
  - [ ] List of drugs with:
    - [ ] Drug name
    - [ ] Dosage
    - [ ] Frequency
    - [ ] Duration
    - [ ] Special instructions
  - [ ] Refills information (if applicable)
- [ ] Layout is clear and professional
- [ ] Print-friendly styling applied

---

### TEST #5.4: Print Prescription
**Objective**: Verify that prescription can be printed
**Time**: 10 minutes

**Steps:**
1. Open a prescription
2. Click "Print" button
3. In print dialog, observe preview
4. Print to PDF or physical printer

**Expected Results:**
- [ ] Print dialog opens
- [ ] Print preview shows prescription in readable format
- [ ] Header includes doctor info and clinic details (if available)
- [ ] Patient information clearly visible
- [ ] All drugs and dosages visible
- [ ] Page breaks are clean (if multi-page)
- [ ] Signature line visible for doctor (manual signature)
- [ ] PDF can be downloaded
- [ ] Print margins are appropriate
- [ ] No sensitive data hidden in print (except passwords)

**Known Issues:**
- Doctor fields may be incomplete in print output

---

### TEST #5.5: Edit Prescription
**Objective**: Verify that prescription can be edited
**Time**: 10 minutes

**Steps:**
1. Open a prescription not yet dispensed
2. Click "Edit"
3. Modify a drug dosage: `2 tablets → 1 tablet`
4. Click "Save"

**Expected Results:**
- [ ] Edit button visible (only for non-dispensed prescriptions)
- [ ] Form opens with current data
- [ ] Changes are saved
- [ ] Timestamp updated
- [ ] Edit recorded in audit log (if available)
- [ ] Cannot edit if prescription already dispensed/filled

---

### TEST #5.6: Prescription Status Tracking
**Objective**: Verify that prescription status is tracked
**Time**: 10 minutes

**Steps:**
1. Create a prescription
2. Check initial status (should be "Active" or "Pending")
3. Mark as "Dispensed" (if implemented)
4. Mark as "Expired" (if more than 1 year old, if implemented)

**Expected Results:**
- [ ] Prescription shows status badge
- [ ] Status options: Active, Dispensed, Expired, Cancelled
- [ ] Status changes are logged
- [ ] Date fields updated appropriately
- [ ] Visual styling changes with status

---

### TEST #5.7: Refill Request (if implemented)
**Objective**: Verify that patients can request prescription refills
**Time**: 10 minutes

**Steps:**
1. View a completed prescription (mark as dispensed first)
2. Check if "Request Refill" button available
3. Click to request refill
4. Doctor approves or denies

**Expected Results:**
- [ ] Refill button visible for completed prescriptions
- [ ] Refill request sent to doctor
- [ ] Doctor receives notification
- [ ] Doctor can approve/deny refill
- [ ] If approved, new prescription created
- [ ] Patient notified of refill status

---

### TEST #5.8: Prescription History
**Objective**: Verify that patient can see complete prescription history
**Time**: 10 minutes

**Steps:**
1. From patient detail, view all prescriptions
2. Filter by status (active, expired, dispensed)
3. Search by drug name (if implemented)

**Expected Results:**
- [ ] All prescriptions shown in chronological order
- [ ] Can filter by status
- [ ] Can search for specific drugs
- [ ] Can export list (CSV, PDF)
- [ ] Pagination works if >20 prescriptions
- [ ] Quick stats shown (total prescriptions, active, expired)

---

## Module 6: Image Analysis (2 hours)

### TEST #6.1: Upload Image
**Objective**: Verify that images can be uploaded to patient record
**Time**: 15 minutes

**Steps:**
1. From patient detail, click "Upload Image" or "Add Photo"
2. Click file picker and select a JPEG/PNG file
3. Or drag and drop image into drop zone
4. Add metadata:
   - Area: `Face - Left cheek`
   - Description: `Red patch with scaling`
   - Date Taken: Today
5. Click "Upload"

**Expected Results:**
- [ ] File picker or drag-drop zone visible
- [ ] Supported formats shown (JPEG, PNG, WebP)
- [ ] File size limit shown (e.g., 10 MB)
- [ ] Preview of selected image shown
- [ ] Progress bar shown during upload
- [ ] Success message after upload
- [ ] Image appears in patient's image gallery
- [ ] Metadata saved with image
- [ ] Network shows POST /api/v1/images (201 Created)

**UI/UX Checks:**
- [ ] Modal centered and properly sized
- [ ] Drop zone clearly marked
- [ ] Upload button disabled until file selected
- [ ] Error handling for invalid formats

---

### TEST #6.2: View Image Gallery
**Objective**: Verify that image gallery displays correctly
**Time**: 10 minutes

**Steps:**
1. From patient detail, scroll to "Images" section
2. View thumbnails of all uploaded images
3. Click on image to view full size

**Expected Results:**
- [ ] All images shown as thumbnails
- [ ] Thumbnails are properly sized and not stretched
- [ ] Hover effect shows image preview/metadata
- [ ] Click opens full-size image in modal or lightbox
- [ ] Can navigate between images (prev/next buttons)
- [ ] Metadata visible (date, area, description)
- [ ] Close button or escape key closes image view

---

### TEST #6.3: AI Image Analysis
**Objective**: Verify that AI analysis can be performed on image
**Time**: 20 minutes

**Steps:**
1. Upload an image of a skin condition
2. Click "Analyze with AI" button on image
3. Wait for analysis to complete
4. Observe results

**Expected Results:**
- [ ] Analyze button visible on image
- [ ] Clicking triggers API call
- [ ] Loading indicator shown during analysis
- [ ] Analysis results displayed:
  - [ ] Possible conditions identified (with confidence %)
  - [ ] Severity assessment
  - [ ] Recommended actions (see doctor, use sunscreen, etc.)
  - [ ] Related conditions to rule out
- [ ] Analysis can be saved to consultation notes
- [ ] Network shows POST /api/v1/images/:id/analyze
- [ ] No timeout errors (timeout should be 30+ seconds)
- [ ] Results are accurate (test with actual dermatology images)

**Known Issues:**
- AI integration not yet fully implemented
- May need Claude API key configuration

---

### TEST #6.4: Delete Image
**Objective**: Verify that images can be deleted
**Time**: 10 minutes

**Steps:**
1. From image view, click "Delete" button
2. Confirm deletion

**Expected Results:**
- [ ] Confirmation dialog shown
- [ ] Image removed from gallery
- [ ] Thumbnail no longer visible
- [ ] Soft delete performed (can be recovered)
- [ ] Network shows DELETE /api/v1/images/:id
- [ ] Analysis results also deleted (if applicable)

---

### TEST #6.5: Export/Download Image
**Objective**: Verify that images can be exported
**Time**: 5 minutes

**Steps:**
1. From image view, click "Download" button
2. Save file to computer

**Expected Results:**
- [ ] Download button visible
- [ ] Original file downloaded (not thumbnail)
- [ ] File format preserved
- [ ] File name sensible (includes patient ID, date, description)
- [ ] Download successful without corruption

---

## Cross-Cutting Concerns (9.5 hours)

### TEST #7.1: Role-Based Access Control
**Objective**: Verify that different roles have appropriate permissions
**Time**: 1.5 hours

**Setup:** Test with Doctor, Assistant, and Admin accounts

**Tests:**

#### Doctor Account
1. Login as doctor@dermai.com
2. Verify can:
   - [ ] View own patients
   - [ ] Create/edit/delete appointments for own patients
   - [ ] Create consultations
   - [ ] Create prescriptions
   - [ ] View own audit log
3. Verify cannot:
   - [ ] Edit other doctor's patients
   - [ ] Access admin panel
   - [ ] Delete other doctor's appointments
   - [ ] View all users list

#### Assistant Account
1. Login as assistant@test.com
2. Verify can:
   - [ ] View patients (read-only or limited write)
   - [ ] Schedule appointments
   - [ ] View consultations (read-only)
3. Verify cannot:
   - [ ] Create prescriptions
   - [ ] Access admin panel
   - [ ] Delete patients

#### Admin Account
1. Login as admin@test.com
2. Verify can:
   - [ ] Access admin panel
   - [ ] View all users and patients
   - [ ] Manage user accounts
   - [ ] View system statistics
   - [ ] Access audit logs
   - [ ] Configure system settings

**Expected Results:**
- [ ] Each role sees appropriate menu items
- [ ] Unauthorized actions return 403 Forbidden
- [ ] UI hides unavailable actions (don't just disable)
- [ ] Breadcrumbs show appropriate level
- [ ] Error messages clear if accessing denied resource

---

### TEST #7.2: Data Integrity
**Objective**: Verify that data consistency is maintained
**Time**: 1.5 hours

**Tests:**

#### Referential Integrity
1. Create patient, then delete doctor
   - [ ] Patient is not deleted (or reassigned)
   - [ ] Patient can no longer have appointments with deleted doctor
2. Create appointment, then delete patient
   - [ ] Appointment is also deleted (soft delete)
3. Create prescription, then delete consultation
   - [ ] Prescription remains but consultation link lost gracefully

#### Data Validation
1. Try to set appointment end time before start time
   - [ ] Error shown: "End time must be after start time"
2. Try to create patient with invalid date of birth (future date)
   - [ ] Error shown
3. Try to set recurring appointment end date before start date
   - [ ] Error shown

#### Duplicate Prevention
1. Try to create two appointments at exact same time for same doctor
   - [ ] Second one rejected with conflict message
2. Try to register user with duplicate email
   - [ ] Error shown (tested earlier in Module 1)

#### Database Constraints
1. Create several appointments and verify:
   - [ ] All required fields present
   - [ ] No NULL values in NOT NULL columns
   - [ ] Dates are valid
   - [ ] IDs are correct and unique

**Verification Commands:**
```bash
# Check data integrity
docker exec dermai-postgres psql -U dermai_user -d dermai_db -c \
  "SELECT COUNT(*) FROM appointments WHERE start_time > end_time;"
# Should return 0
```

---

### TEST #7.3: Performance and Load
**Objective**: Verify that application performs well under typical load
**Time**: 1.5 hours

**Network Monitoring:**
1. Open DevTools Network tab
2. Test each module and note response times

**Expected Response Times:**
- [ ] Patient list load: < 1 second (< 100 patients)
- [ ] Patient detail: < 1 second
- [ ] Appointment list: < 1 second
- [ ] Create appointment: < 2 seconds
- [ ] Search patients: < 500ms per character
- [ ] Calendar month view: < 1 second
- [ ] Image upload: Varies by size, should show progress

**Load Testing:**
1. Open multiple tabs with dashboard loaded
2. Switch between tabs - verify no slowness
3. Leave page open for 10 minutes - verify session stable
4. Perform rapid operations (click fast, don't wait for responses)
   - [ ] Application handles gracefully (queue requests, don't duplicate)
   - [ ] Loading states prevent double-click issues

**Database Performance:**
```bash
# Check for slow queries
docker exec dermai-postgres psql -U dermai_user -d dermai_db -c \
  "SELECT query, mean_exec_time FROM pg_stat_statements \
   WHERE mean_exec_time > 100 ORDER BY mean_exec_time DESC LIMIT 10;"
```

---

### TEST #7.4: Error Handling and Edge Cases
**Objective**: Verify that application handles errors gracefully
**Time**: 1.5 hours

**Network Errors:**
1. Disconnect WiFi/network while on dashboard
   - [ ] Error message shown (not crash)
   - [ ] Can retry when reconnected
   - [ ] No stuck loading states
2. Slow network (use DevTools throttling):
   - [ ] Timeout errors if API takes too long
   - [ ] User can retry
   - [ ] UI doesn't hang

**Validation Errors:**
1. Required field left blank
   - [ ] Clear error message shown
   - [ ] Form doesn't submit
2. Invalid email format
   - [ ] Client-side validation shows error
   - [ ] If somehow sent to server, 400 Bad Request shown
3. Invalid date (e.g., Feb 30)
   - [ ] Date picker prevents invalid dates
   - [ ] Or server rejects with clear error

**Edge Cases:**
1. Create appointment exactly at midnight
   - [ ] Works correctly
   - [ ] Time zone handling correct
2. Patient with very long name (50+ characters)
   - [ ] Displays without truncation (or with ellipsis and tooltip)
   - [ ] Doesn't break layout
3. Upload very large file (100+ MB)
   - [ ] File size validation error shown
   - [ ] Doesn't crash browser
4. Rapid operations (create, edit, delete same object)
   - [ ] Race conditions handled
   - [ ] Final state is correct

---

### TEST #7.5: Security Testing
**Objective**: Verify that application is secure against common threats
**Time**: 1.5 hours

**XSS Prevention:**
1. Try injecting JavaScript in patient name field: `<script>alert('xss')</script>`
   - [ ] Script not executed
   - [ ] Text displayed literally (with < and > escaped)
   - [ ] No alert popup

2. Try in search field: same script
   - [ ] Not executed in search results
   - [ ] No alert popup

**CSRF Protection:**
1. Verify POST requests include CSRF token (if implemented)
2. Try to submit form from external domain
   - [ ] Request rejected
   - [ ] 403 Forbidden shown

**SQL Injection Prevention:**
1. Try patient search with SQL: `'; DROP TABLE patients; --`
   - [ ] Treated as literal string
   - [ ] No error from database
   - [ ] Table not dropped

**Authentication Security:**
1. Verify tokens are never in URL (only cookies or headers)
2. Check that sensitive data not logged in console
3. Verify httpOnly cookie flag set
   - In DevTools, Application tab → Cookies
   - [ ] `access_token` cookie has HttpOnly flag ✓
   - [ ] `access_token` cookie has Secure flag ✓
   - [ ] `access_token` cookie has SameSite flag ✓
4. Try token in localStorage instead:
   - [ ] Token not stored in localStorage (XSS vulnerability)
   - [ ] Only in httpOnly cookie

**API Security:**
1. Try accessing API without token:
   ```bash
   curl http://localhost:8000/api/v1/patients
   ```
   - [ ] Returns 401 Unauthorized

2. Try with invalid/expired token:
   ```bash
   curl -H "Authorization: Bearer invalid_token" \
     http://localhost:8000/api/v1/patients
   ```
   - [ ] Returns 401 Unauthorized

3. Verify rate limiting on login:
   - [ ] 6 failed logins in row: 429 Too Many Requests on 6th

---

### TEST #7.6: Responsive Design
**Objective**: Verify that application works on different screen sizes
**Time**: 1.5 hours

**Test Breakpoints:**
1. Desktop (1920x1080)
2. Laptop (1366x768)
3. Tablet (768x1024, portrait and landscape)
4. Mobile (375x812, portrait)

**Tests for Each Breakpoint:**

#### Mobile (375px width)
1. Navigate to patient list
   - [ ] List is readable and scrollable
   - [ ] Buttons are touchable (48px height minimum)
   - [ ] Modal fits screen (doesn't require horizontal scroll)
   - [ ] Calendar view adapted for small screen
2. Open patient detail
   - [ ] Information stacks vertically
   - [ ] No overflow or horizontal scrolling
3. View calendar
   - [ ] Month view shows week at a time (or shows single day)
   - [ ] Can navigate between days easily
   - [ ] Appointment cards fit width

#### Tablet (768px width)
1. Layout should be optimized for medium screen
2. Sidebar may collapse to icon-only on landscape
3. Two-column layouts should work

#### Desktop (1920px width)
1. All features visible
2. Sidebar on left, content on right
3. Whitespace appropriate (not too stretched)

**Orientation Changes:**
1. Rotate tablet from portrait to landscape
   - [ ] Layout adapts smoothly
   - [ ] No content lost
   - [ ] Scroll position somewhat preserved

---

### TEST #7.7: Accessibility
**Objective**: Verify that application is usable for people with disabilities
**Time**: 1.5 hours

**Keyboard Navigation:**
1. Tab through all interactive elements
   - [ ] Tab order is logical (left to right, top to bottom)
   - [ ] Can't tab to hidden elements
   - [ ] Focus visible (outline or highlight)
2. Use Enter/Space to activate buttons
   - [ ] Works same as mouse click
3. Use Arrow keys for navigation
   - [ ] Works in dropdowns (up/down to select)
   - [ ] Works in calendar (arrow keys navigate days)
4. Use Escape to close modals
   - [ ] Escape closes open dialogs
   - [ ] Focus returns to previous element

**Screen Reader Testing (VoiceOver on Mac, NVDA on Windows):**
1. Enable screen reader
2. Navigate page
   - [ ] All text is read aloud
   - [ ] Form labels associated with inputs
   - [ ] Images have alt text
   - [ ] Buttons have readable names
   - [ ] Modal announces itself
3. Check for landmarks:
   - [ ] Main content identified
   - [ ] Navigation identified
   - [ ] Sidebar identified

**Color Contrast:**
1. Use browser extension or online tool to check contrast
   - [ ] Text contrast ratio >= 4.5:1 for normal text
   - [ ] Text contrast ratio >= 3:1 for large text (18px+)
   - [ ] This is especially important for status badges

**Form Accessibility:**
1. All input fields have labels
   - [ ] Labels visible (not just placeholder)
2. Error messages associated with fields
   - [ ] Screen reader reads error with field
3. Required fields marked
   - [ ] Asterisk or "required" label visible

---

### TEST #7.8: Browser Compatibility
**Objective**: Verify that application works across browsers
**Time**: 1 hour

**Browsers to Test:**
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

**Tests for Each Browser:**
1. Login and navigate to dashboard
2. Create a patient
3. Schedule an appointment
4. View calendar
5. Check console for errors (F12 → Console tab)
   - [ ] No red error messages
   - [ ] Only warnings or info messages acceptable

**Known Compatibility Issues:**
- [ ] Note any browser-specific bugs here
- [ ] Drag-and-drop may not work on Safari (use pointerdown/pointerup)

---

### TEST #7.9: Internationalization (if implemented)
**Objective**: Verify that application supports multiple languages
**Time**: 1 hour

**Language Settings:**
1. Look for language switcher (usually top-right corner)
2. Switch between available languages:
   - [ ] English
   - [ ] French (Français)
   - [ ] Other languages (if available)

**Translation Coverage:**
1. All UI text translated
   - [ ] Buttons translated
   - [ ] Form labels translated
   - [ ] Error messages translated
   - [ ] Success messages translated
2. Date/time formatting adapted
   - [ ] Dates use locale format (FR: DD/MM/YYYY, EN: MM/DD/YYYY)
   - [ ] Times use locale format
   - [ ] Timezones handled correctly
3. Numbers formatted correctly
   - [ ] Thousands separators (1.000 vs 1,000)
   - [ ] Decimal separators (0,50 vs 0.50)

---

### TEST #7.10: Data Export and Reporting
**Objective**: Verify that data can be exported for analysis
**Time**: 1 hour

**Patient Export:**
1. From patient list, click "Export" or "Download"
2. Choose format: CSV or Excel
3. Download file

**Expected Results:**
- [ ] File downloaded successfully
- [ ] Can open in spreadsheet application
- [ ] All patient data included
- [ ] Dates formatted correctly
- [ ] No personal data exposed (e.g., password hashes)

**Appointment Export:**
1. From calendar, export appointments
2. Choose date range
3. Download as CSV or iCal

**Expected Results:**
- [ ] iCal format can be imported into Outlook, Google Calendar, etc.
- [ ] All appointments included
- [ ] Recurring appointments show all occurrences (or show series)
- [ ] Conflict-free import to external calendar

**Reports (if implemented):**
1. Generate report for doctor's statistics
2. Export as PDF

**Expected Results:**
- [ ] PDF generated successfully
- [ ] Professional formatting
- [ ] All charts/graphs visible
- [ ] Data accurate

---

### TEST #7.11: Audit Logging
**Objective**: Verify that all actions are logged for compliance
**Time**: 1 hour

**Tests:**

#### Action Logging
1. Create, edit, delete patient
2. Check audit log:
   - [ ] Each action recorded with timestamp
   - [ ] User identified (doctor name)
   - [ ] Action type identified (CREATE, UPDATE, DELETE)
   - [ ] Changes recorded (old value → new value)

#### Access Logging
1. Login and navigate to patient details
2. Check if access logged (optional enhancement)

#### HIPAA Compliance
1. Verify soft deletes used (not hard deletes)
2. Verify personal data not in URLs
3. Verify HTTPS used (if deployed to production)

**Audit Log Access:**
```bash
# Check audit logs in database
docker exec dermai-postgres psql -U dermai_user -d dermai_db -c \
  "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```

---

## Bug Reporting Template

Use this template when reporting bugs found during testing:

```markdown
## Bug Report

**Title**: [Brief description of bug]

**Severity**: [ ] Critical | [ ] High | [ ] Medium | [ ] Low

**Date Found**: [Date]

**Environment**:
- Browser: [Chrome/Safari/Firefox/Edge + version]
- OS: [Windows/Mac/Linux + version]
- Screen Size: [Desktop/Tablet/Mobile]

**Module**: [Authentication/Patients/Appointments/Consultations/Prescriptions/Images]

**Steps to Reproduce**:
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior**:
- [What should happen]

**Actual Behavior**:
- [What actually happens]

**Screenshots/Video**:
- [Attach if helpful]

**Console Errors**:
- [Any JavaScript errors from DevTools console]

**Network Errors**:
- [Any failed API calls from DevTools Network tab]

**Database State** (if relevant):
```sql
[SQL queries to verify state]
```

**Additional Context**:
- [Any other relevant information]
```

---

## Testing Checklist Summary

### Module Completion Status
- [ ] Module 1: Authentication (2 hours)
- [ ] Module 2: Patient Management (4 hours)
- [ ] Module 3: Appointment Scheduling (6 hours)
- [ ] Module 4: Consultations (3 hours)
- [ ] Module 5: Prescriptions (3 hours)
- [ ] Module 6: Image Analysis (2 hours)
- [ ] Cross-Cutting Concerns (9.5 hours)

**Total Estimated Time**: 37.5 hours for comprehensive testing

### Known Issues to Address

#### High Priority
1. **Patient Statistics** - Currently shows 0 values
2. **Prescription Print** - Doctor fields may be incomplete
3. **AI Image Analysis** - Integration not fully implemented
4. **Drug Interaction Checking** - Basic implementation only

#### Medium Priority
1. **Lab Results Attachment** - May not be fully implemented
2. **Consultation History** - Audit logging may be incomplete
3. **Rate Limiting** - May need configuration
4. **Soft Delete Recovery** - Admin interface for recovering deleted records

#### Low Priority
1. **Mobile Optimizations** - Some screens may need adjustment
2. **Accessibility** - Some contrast issues may exist
3. **Internationalization** - Language switching may be incomplete

---

## Post-Testing Summary

After completing all tests:

1. **Document Findings**
   - [ ] Number of bugs found
   - [ ] Severity breakdown
   - [ ] Modules with highest issue density
   - [ ] Modules functioning well

2. **Create Issue Tracker**
   - [ ] Create GitHub issues for each bug
   - [ ] Assign priorities
   - [ ] Estimate fix time

3. **Improvement Recommendations**
   - [ ] UX/UI improvements
   - [ ] Performance optimizations
   - [ ] Features to add

4. **Testing Metrics**
   - [ ] % of tests passed
   - [ ] % of features working correctly
   - [ ] Estimated release readiness (0-100%)

---

**End of Manual Testing Guide**

For questions about specific tests, refer to the corresponding test section above.
