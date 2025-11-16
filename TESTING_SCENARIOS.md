# End-to-End Testing Scenarios - DermAI Application

**Date**: November 16, 2025
**Version**: 1.0
**Purpose**: Realistic workflow scenarios to test integrated functionality

---

## Table of Contents

1. [Scenario 1: New Patient First Visit](#scenario-1-new-patient-first-visit)
2. [Scenario 2: Follow-up Appointment](#scenario-2-follow-up-appointment)
3. [Scenario 3: Recurring Treatment Plan](#scenario-3-recurring-treatment-plan)
4. [Scenario 4: Complex Drug Interaction Handling](#scenario-4-complex-drug-interaction-handling)
5. [Scenario 5: Calendar Conflict Resolution](#scenario-5-calendar-conflict-resolution)
6. [Scenario 6: Patient History Review](#scenario-6-patient-history-review)
7. [Scenario 7: Image Analysis and Diagnosis](#scenario-7-image-analysis-and-diagnosis)
8. [Scenario 8: Emergency Rescheduling](#scenario-8-emergency-rescheduling)
9. [Scenario 9: Multi-Doctor Practice](#scenario-9-multi-doctor-practice)
10. [Scenario 10: Patient Portal Usage](#scenario-10-patient-portal-usage)

---

## Scenario 1: New Patient First Visit

**Real-World Context**: A dermatologist (Dr. Dupont) schedules and sees a new patient who comes in for a skin complaint.

**Estimated Duration**: 30 minutes
**Doctors Involved**: 1 (Doctor account)
**Patients Involved**: 1 new patient

### Step 1: Create New Patient Record

**Prerequisite**: Logged in as doctor@dermai.com

**Actions**:
1. Click "Patients" in sidebar
2. Click "New Patient" button
3. Fill in patient information:
   - First Name: `Sophie`
   - Last Name: `Bernard`
   - Date of Birth: `1992-07-22`
   - Gender: `Female`
   - Phone: `0612345678`
   - Email: `sophie.bernard@email.com`
   - ID Type: `CIN`
   - ID Number: `BE123456`
4. Click "Save Patient"
5. **Verify**: Patient appears in patient list, can click to view details

### Step 2: Schedule Appointment for Patient

**Actions**:
1. From patient detail page, click "Schedule Appointment"
2. Fill appointment form:
   - Date/Time: Tomorrow at 2:00 PM
   - Duration: 1 hour
   - Type: `Consultation`
   - Reason: `Red rash on arms, itchy, appeared 3 days ago`
3. Click "Save Appointment"
4. **Verify**: Appointment appears in calendar

### Step 3: Create Consultation Notes

**Actions**:
1. On appointment day, click the appointment in calendar
2. Click "Create Consultation"
3. Fill in consultation form:
   - Chief Complaint: `Red, itchy rash on both arms for 3 days. Worse in the evening.`
   - Physical Examination: `Erythematous plaques on forearms and elbows. Some scaling. Mild edema. No fever.`
   - Assessment: `Likely allergic contact dermatitis or atopic dermatitis`
   - Plan: `Prescribed topical steroid cream, recommended patch testing, advised on moisturizing regimen`
4. Click "Save Consultation"
5. **Verify**: Consultation appears in patient's consultation list

### Step 4: Prescribe Medication

**Actions**:
1. From patient detail, click "New Prescription"
2. Search and add first drug:
   - Search: `fluocinonide`
   - Select: `Fluocinonide 0.05% Cream`
   - Dosage: `Apply thin layer`
   - Frequency: `Twice daily`
   - Duration: `2 weeks`
   - Instructions: `Apply to affected areas. Avoid face unless directed.`
3. Click "Add Drug"
4. Search and add second drug:
   - Search: `cetirizine`
   - Select: `Cetirizine 10mg Tablet`
   - Dosage: `1 tablet`
   - Frequency: `Once daily at night`
   - Duration: `2 weeks`
5. **System Check**: Drug interaction checker should verify no interactions
6. Click "Save Prescription"
7. **Verify**: Prescription appears in patient record with both drugs listed

### Step 5: Print and Provide Prescription

**Actions**:
1. From patient record, find the prescription
2. Click "Print" button
3. Review printout (or preview in PDF)
4. **Verify**: Prescription is professional, readable, includes:
   - Doctor's name and credentials
   - Patient name and DOB
   - Date issued
   - All drugs with dosages and frequencies
   - Signature line for doctor's signature

### Step 6: Follow-up and Schedule Next Visit

**Actions**:
1. In consultation notes, note: "Follow-up in 2 weeks to assess treatment response"
2. Click "Schedule Follow-up Appointment"
3. Schedule for 2 weeks later (consultation/follow-up type)
4. **Verify**: Follow-up appointment appears in calendar

**Testing Checklist**:
- [ ] Patient created with all information
- [ ] Appointment created and visible in calendar
- [ ] Consultation notes saved correctly
- [ ] No console errors during process
- [ ] Drug interaction checking working
- [ ] Prescription formatted correctly for printing
- [ ] Patient info visible in multiple places (consistency)
- [ ] Appointment reminders set (if feature exists)
- [ ] Audit log records all actions
- [ ] Response times acceptable (<2 seconds per action)

---

## Scenario 2: Follow-up Appointment

**Real-World Context**: Patient returns for follow-up, treatment needs adjustment.

**Estimated Duration**: 20 minutes
**Prerequisite**: Scenario 1 completed, 2 weeks have passed

### Step 1: View Upcoming Appointment

**Actions**:
1. In calendar, navigate to appointment date
2. Click follow-up appointment with Sophie Bernard
3. **Verify**: Patient info, previous consultation, and previous prescription visible

### Step 2: Create Follow-up Consultation

**Actions**:
1. Click "Create Consultation"
2. Fill form:
   - Chief Complaint: `Return visit for dermatitis follow-up. Rash improved 80% with steroid cream. Some itching remains.`
   - Physical Examination: `Erythema and scaling significantly reduced. Small patches remain on elbows. No new lesions.`
   - Assessment: `Allergic contact dermatitis responding well to treatment`
   - Plan: `Continue fluocinonide cream for 1 more week. Switch cetirizine to as-needed. Patient advised on trigger avoidance.`
3. Save Consultation
4. **Verify**: New consultation saved alongside previous one

### Step 3: Update Prescription

**Actions**:
1. Previous prescription visible in medication list
2. Click "New Prescription"
3. Modify treatment:
   - Remove: Cetirizine daily
   - Update: Fluocinonide cream (reduce frequency from 2x to 1x daily) - Actually, create new prescription with updated dosing
   - Add: Hydrocortisone 1% cream for occasional use
4. Note: "Use hydrocortisone for breakthrough itching only"
5. Save new prescription
6. **Verify**: Patient now has two prescriptions (old one visible in history)

### Step 4: Schedule Next Follow-up

**Actions**:
1. Schedule follow-up for 4 weeks
2. Note: "Only if symptoms return"
3. **Verify**: Optional/conditional appointment visible

**Testing Checklist**:
- [ ] Previous consultation visible for reference
- [ ] Previous prescription visible
- [ ] New consultation created independently
- [ ] Multiple prescriptions tracked correctly
- [ ] Audit shows complete history
- [ ] No data loss or corruption from editing patient record
- [ ] Dates calculate correctly (2 weeks, 4 weeks)

---

## Scenario 3: Recurring Treatment Plan

**Real-World Context**: Patient needs regular treatments (e.g., acne injections, phototherapy sessions) scheduled in advance.

**Estimated Duration**: 25 minutes

### Step 1: Create New Patient Requiring Recurring Treatment

**Actions**:
1. Create new patient:
   - Name: `Marc Laurent`
   - Complaint: Will be cystic acne
2. Click "Schedule Appointment"

### Step 2: Schedule Recurring Appointments

**Actions**:
1. Create first appointment:
   - Date: Friday 10:00 AM (next Friday)
   - Type: `Treatment - Acne Injection`
   - Duration: 30 minutes
2. Enable "Recurring"
3. Configure recurrence:
   - Frequency: Every week
   - Days: Friday only
   - Start: Next Friday
   - End: 8 weeks from now (8 treatments)
4. Click "Save"
5. **Verify**: System shows "8 appointments will be created"
6. Confirm creation
7. **Verify**: All 8 appointments appear in calendar on Fridays

### Step 3: Create Consultation for Initial Appointment

**Actions**:
1. Click first appointment in the series
2. Create consultation:
   - Chief Complaint: `Severe cystic acne, numerous nodules on face and chest`
   - Assessment: `Moderate to severe nodulocystic acne`
   - Plan: `Weekly steroid injection into lesions. 8 sessions planned. Concurrent oral antibiotics.`
3. Save

### Step 4: Prescribe Concurrent Medication

**Actions**:
1. Create prescription:
   - Drug: Doxycycline 100mg
   - Dosage: 1 capsule
   - Frequency: Twice daily
   - Duration: 8 weeks (to match treatment course)
   - Note: "Take with full glass of water, don't lie down after taking"

### Step 5: Modify Series Mid-Course

**Actions**:
1. After 3 weeks (simulated), patient needs to reschedule Session 4
2. Click Session 4 appointment
3. Drag to different time (same day, different hour) or different day
4. **Verify**: Only that occurrence moves, others remain Friday at 10:00 AM

### Step 6: Update Plan After Session 3

**Actions**:
1. Click Session 3 appointment
2. Create consultation:
   - Notes: `Good response to injections. Lesions reducing in size and redness. Continue current plan.`
3. Save (this is a different consultation than the initial one)

**Testing Checklist**:
- [ ] Recurring appointments created correctly (8 in calendar)
- [ ] Recurrence rule stored in database
- [ ] Modification to one occurrence doesn't affect others
- [ ] Multiple consultations per patient tracked correctly
- [ ] Prescription duration aligns with treatment duration
- [ ] Calendar view shows no gaps or duplicates
- [ ] Can view series overview (all 8 appointments)
- [ ] Series can be canceled entirely or individually
- [ ] Audit log shows recurrence creation and modifications

---

## Scenario 4: Complex Drug Interaction Handling

**Real-World Context**: Patient on multiple medications for comorbidities; doctor must check interactions when adding new prescription.

**Estimated Duration**: 30 minutes

### Step 1: Create Complex Patient History

**Actions**:
1. Create new patient:
   - Name: `Robert Durand`
   - Age: 68
   - Reason for visit: Fungal infection on nails
2. Note in chart: "Patient on multiple medications for hypertension and diabetes"

### Step 2: Add Current Medications (Non-DermAI)

**Actions**:
1. In patient record, find "Current Medications" or "Medical History" section
2. Manually add existing medications (if system allows):
   - Lisinopril 20mg once daily (for hypertension)
   - Metformin 1000mg twice daily (for diabetes)
   - Aspirin 81mg once daily (for cardiac health)
3. **Verify**: Medications saved to patient record

### Step 3: Create Appointment for Fungal Infection

**Actions**:
1. Schedule appointment: "Onychomycosis treatment"
2. Create consultation documenting fungal infection on toenails

### Step 4: Attempt to Prescribe Terbinafine

**Actions**:
1. Click "New Prescription"
2. Search: `terbinafine`
3. Select: `Terbinafine 250mg Tablet`
4. Fill in dosage and frequency
5. Add drug to prescription
6. **Expected**: Drug interaction checker runs
7. **System Alert**: "⚠️ Possible interaction detected: Terbinafine may reduce effectiveness of Lisinopril. Monitor blood pressure."
8. Continue to save with warning acknowledged
9. **Verify**: Prescription saved, interaction noted

### Step 5: Refine Drug Selection Based on Interaction

**Actions**:
1. Create different prescription instead:
2. Search: `terbinafine topical`
3. Select: `Terbinafine 1% Cream`
4. Fill details
5. **Expected**: No systemic drug interactions (topical only)
6. Save
7. **Verify**: This prescription has no interaction warnings

### Step 6: Verify Both Prescriptions

**Actions**:
1. Patient now has two prescriptions for same condition
2. View patient medication summary
3. **Verify**: Shows both systemic (terbinafine tablet) and topical options

**Testing Checklist**:
- [ ] Drug interaction database is functional
- [ ] Interaction warnings are accurate
- [ ] Interaction severity clearly indicated
- [ ] Doctor can proceed with acknowledged risks
- [ ] Topical drugs don't trigger systemic interactions
- [ ] Multiple prescriptions tracked separately
- [ ] Current medications considered in checks
- [ ] Error messages are clear and actionable
- [ ] Link to interaction details available (if implemented)

---

## Scenario 5: Calendar Conflict Resolution

**Real-World Context**: Doctor has overbooked and needs to resolve conflicting appointments.

**Estimated Duration**: 30 minutes

### Step 1: Create Potential Conflict Scenario

**Actions**:
1. Create two appointments at overlapping times:
   - Appointment A: Doctor Jane, Patient A, 2:00 - 3:00 PM (existing)
   - Appointment B: Same doctor, Patient B, 2:30 - 3:30 PM (attempting to create)
2. **Verify**: System detects conflict and shows error

### Step 2: View Conflict in Calendar

**Actions**:
1. In calendar view, both appointments visible (may overlap or show conflict indicator)
2. Click on conflicting appointment
3. **Verify**: Dialog shows conflict warning

### Step 3: Get Suggested Alternatives

**Actions**:
1. Dialog offers: "This time slot is not available. Suggested times:"
   - 1:00 PM - 2:00 PM (before first appointment)
   - 3:00 PM - 4:00 PM (after first appointment)
   - Next available: 2:00 PM Tomorrow
2. **Verify**: Suggestions are actually free
3. Click "2:00 PM Tomorrow"
4. **Verify**: Appointment moved to new time automatically

### Step 4: Reschedule Using Drag-and-Drop

**Actions**:
1. Create another potential conflict manually
2. In week view, try to drag Appointment to conflicting slot
3. **Expected**: Drag target highlights as unavailable (red/disabled)
4. Release - appointment doesn't move
5. Drag to available slot
6. **Verify**: Appointment moves successfully

### Step 5: Doctor-Initiated Rescheduling

**Actions**:
1. Doctor realizes need to reschedule Patient A
2. Click Patient A appointment
3. Click "Reschedule"
4. System shows "Patient will be notified of time change" (if notifications enabled)
5. Choose new time: 1:00 PM same day
6. Confirm
7. **Verify**: All three appointments now non-conflicting

**Testing Checklist**:
- [ ] Conflicts detected during appointment creation
- [ ] Error messages are clear
- [ ] Suggestions are accurate and available
- [ ] Drag-and-drop respects conflict rules
- [ ] Unavailable slots are clearly marked
- [ ] Patient notifications sent (if implemented)
- [ ] Appointment status updated correctly
- [ ] Audit log shows reschedule reason (if captured)
- [ ] No race conditions if multiple doctors modify calendar

---

## Scenario 6: Patient History Review

**Real-World Context**: New assistant reviews patient's complete history before appointment.

**Estimated Duration**: 20 minutes

### Step 1: Access Patient Detail Page

**Prerequisite**: Logged in as assistant@test.com
**Actions**:
1. Navigate to Patients
2. Search for patient: `Sophie Bernard` (from Scenario 1)
3. Click to open patient detail
4. **Verify**: Page loads quickly with all information

### Step 2: Review Appointment History

**Actions**:
1. Scroll to "Appointments" section
2. **Verify**: Shows:
   - Past appointments (completed, canceled)
   - Upcoming appointments
   - Appointment types and reasons
   - Doctor who performed appointments
3. Click on a past appointment
4. **Verify**: Shows appointment details and linked consultation

### Step 3: Review Consultation Notes

**Actions**:
1. Scroll to "Consultations" section
2. **Verify**: Chronological list of all consultations
3. Click first consultation (from initial visit)
4. **Verify**: Shows:
   - Chief complaint
   - Physical exam findings
   - Assessment
   - Treatment plan
   - Date and doctor
5. Go back and click most recent consultation
6. **Verify**: Can see progression of condition

### Step 4: Review Prescriptions

**Actions**:
1. Scroll to "Medications/Prescriptions" section
2. **Verify**: Shows:
   - Active prescriptions
   - Expired/completed prescriptions
   - Drug names, dosages, frequencies
   - Dates prescribed
   - Doctor who prescribed
3. Can filter by:
   - [ ] Active only
   - [ ] By date range
   - [ ] By drug name
4. Click on prescription
5. **Verify**: Can view full prescription details

### Step 5: View Medical Timeline

**Actions**:
1. Look for "Timeline" or "History" view (if implemented)
2. **Verify**: Shows chronological view of:
   - Appointments
   - Consultations
   - Prescriptions
   - Any images or tests
3. Events color-coded by type

### Step 6: Prepare for Upcoming Appointment

**Actions**:
1. Note shows upcoming appointment: "Follow-up appointment - 2 weeks"
2. Review previous consultation to understand context
3. Review what prescriptions were given
4. **Verify**: All information available to prepare for appointment

**Testing Checklist**:
- [ ] All patient information accessible from detail page
- [ ] No missing consultations or appointments
- [ ] Dates are consistent and accurate
- [ ] Filtering and search work correctly
- [ ] Timeline view shows correct chronology
- [ ] Assistant can view but not necessarily edit (depending on role)
- [ ] No console errors when navigating
- [ ] Page load time acceptable even with much history
- [ ] Images/files referenced but not loaded until clicked (for performance)

---

## Scenario 7: Image Analysis and Diagnosis

**Real-World Context**: Doctor uploads patient photos for AI analysis to help with diagnosis.

**Estimated Duration**: 30 minutes

### Step 1: Create Patient with Skin Condition

**Actions**:
1. Create patient: `Marc Petit`, complains of "changing mole on back"

### Step 2: Upload Images

**Actions**:
1. From patient detail, click "Upload Image"
2. Select image file (dermoscopy or photo of lesion)
3. Fill metadata:
   - Body Area: `Back, left side, 3cm above waistline`
   - Description: `Brown mole with irregular borders, diameter 8mm`
   - Date Taken: Today
   - Notes: `Patient reports mole has changed in past 3 months`
4. Upload
5. **Verify**: Image appears in gallery with thumbnail
6. Upload 2-3 more photos (different angles if possible)

### Step 3: Review Images in Gallery

**Actions**:
1. Scroll to Images section
2. View all uploaded images as thumbnails
3. Click image to view full size
4. **Verify**: Full-size image loads clearly
5. Metadata visible (date, location, notes)
6. Can navigate between images (prev/next)

### Step 4: Perform AI Analysis

**Actions**:
1. While viewing image, click "Analyze with AI" button
2. System sends to Claude API for analysis
3. Loading indicator appears
4. **Verify**: Request completes within timeout (30 seconds)
5. Results displayed:
   - Preliminary observations
   - Possible diagnoses (with confidence levels)
   - Recommended actions
   - Features to rule out
6. **Verify**: Results make clinical sense for the condition

### Step 5: Document Findings

**Actions**:
1. Create consultation with AI findings:
   - Chief Complaint: Patient's description
   - AI Analysis Results: [Paste from analysis]
   - Clinical Assessment: Doctor's own assessment
   - Plan: Based on AI suggestions and clinical judgment
2. **Verify**: Both doctor opinion and AI analysis saved

### Step 6: Compare with Previous Images

**Actions**:
1. If patient has previous images (from different visit)
2. Place side-by-side for comparison (if feature exists)
3. **Verify**: Changes in appearance documented
4. Include comparison in consultation notes

**Testing Checklist**:
- [ ] Image upload successful for various file formats
- [ ] File size validation working
- [ ] Image preview shown before upload
- [ ] Metadata saved with images
- [ ] Gallery loads all images
- [ ] Full-size view readable and responsive
- [ ] AI analysis completes without timeout
- [ ] AI results are relevant to the image
- [ ] Confidence levels are reasonable
- [ ] Can save analysis with consultation
- [ ] Images don't interfere with appointment/consultation creation
- [ ] Image history maintained (can see all past uploads)

---

## Scenario 8: Emergency Rescheduling

**Real-World Context**: Doctor gets emergency call and must reschedule afternoon appointments.

**Estimated Duration**: 20 minutes

### Step 1: Identify Appointments to Move

**Actions**:
1. In calendar, view today's schedule
2. Identify afternoon appointments (e.g., 2:00 PM, 3:00 PM, 4:00 PM)
3. Total: 3 appointments with different patients

### Step 2: Batch View Alternative Slots

**Actions**:
1. Click "Reschedule Appointments"
2. System shows list of appointments to move
3. Provides available time slots
4. Can select new times for each appointment

### Step 3: Reschedule First Appointment

**Actions**:
1. Click first appointment
2. View available slots:
   - Tomorrow: 9:00 AM, 10:00 AM, 11:00 AM, 2:00 PM, 3:00 PM
   - Day after: Multiple slots
3. Select: "Tomorrow 10:00 AM"
4. Note: "Rescheduled due to emergency"
5. Confirm
6. **Verify**: Appointment moves, patient notification queued

### Step 4: Reschedule Second Appointment

**Actions**:
1. Same process for second appointment
2. Select: "Tomorrow 11:00 AM"
3. Confirm

### Step 5: Reschedule Third Appointment

**Actions**:
1. Third appointment needs to go to Day After Tomorrow
2. Select: "Day After Tomorrow 2:00 PM"
3. Confirm

### Step 6: Verify New Schedule

**Actions**:
1. View calendar
2. **Verify**:
   - Today's afternoon now free
   - Tomorrow has new appointments
   - Day After Tomorrow has new appointment
   - No conflicts in new schedule
3. View notification queue (if implemented)
4. **Verify**: 3 patient notifications queued with new times

**Testing Checklist**:
- [ ] All affected appointments identified correctly
- [ ] Available slots calculation accurate
- [ ] No conflicts in rescheduled times
- [ ] Batch rescheduling faster than individual rescheduling
- [ ] Patient notifications include new appointment time
- [ ] Audit log shows rescheduling reason
- [ ] Doctor notes preserved or moved with appointment
- [ ] Can undo rescheduling (if feature exists)
- [ ] No race conditions with concurrent changes

---

## Scenario 9: Multi-Doctor Practice

**Real-World Context**: Medical practice has multiple doctors; assistant books appointments with specific doctor or any available doctor.

**Estimated Duration**: 40 minutes

### Step 1: Setup Multi-Doctor Environment

**Prerequisite**: System has multiple doctors:
- Dr. Dupont (doctor@dermai.com)
- Dr. Laurent (optional second doctor account)

**Actions**:
1. Create patient: `Anne Martin`
2. Note: "Can be seen by any dermatologist"

### Step 2: Book with Specific Doctor

**Actions**:
1. Schedule appointment
2. Doctor field shows dropdown with all doctors
3. Select: `Dr. Dupont`
4. Schedule: Thursday 10:00 AM
5. **Verify**: Checks Dr. Dupont's availability only
6. Appointment created

### Step 3: Book with Any Available Doctor

**Actions**:
1. Create another patient: `Claire Moreau`
2. Schedule appointment
3. Select Doctor: "Any Available" or "Next Available"
4. Choose time: Thursday 2:00 PM
5. **Verify**: System searches all doctors' calendars
6. Finds available doctor (e.g., Dr. Laurent)
7. Appointment created with available doctor

### Step 4: View Shared Calendar

**Actions**:
1. In calendar, toggle "All Doctors" or "Team View"
2. **Verify**: Shows appointments for all doctors
3. Different colors for each doctor
4. Can filter to single doctor

### Step 5: Consultation and Prescription

**Actions**:
1. Dr. Dupont sees first patient (Anne with appointment)
2. Creates consultation
3. Creates prescription
4. **Verify**: Dr. Dupont shows as prescriber

5. Dr. Laurent sees second patient (Claire)
6. Creates consultation
7. Creates prescription
8. **Verify**: Dr. Laurent shows as prescriber

### Step 6: Patient Can See Own Records Regardless of Doctor

**Actions**:
1. Patient (or assistant viewing patient record) sees:
   - Both consultations
   - Both prescriptions
   - All appointments
2. **Verify**: Multi-doctor history visible

### Step 7: Coordination and Notes

**Actions**:
1. Dr. Dupont views patient record with multiple consultations
2. Adds note: "Patient should continue with Dr. Laurent for continuity"
3. **Verify**: Note visible to all doctors

**Testing Checklist**:
- [ ] Doctor selection works correctly
- [ ] Availability checking considers right doctor
- [ ] Calendar shows multiple doctors' schedules
- [ ] Filtering by doctor works
- [ ] Color coding clear for multiple doctors
- [ ] Patient records show all doctors' notes/prescriptions
- [ ] Prescriber attribution correct
- [ ] Inter-doctor communication possible
- [ ] No cross-contamination of data between doctors
- [ ] Audit log shows which doctor performed action

---

## Scenario 10: Patient Portal Usage (if implemented)

**Real-World Context**: Patient logs in to view their own records and request services.

**Estimated Duration**: 20 minutes

### Step 1: Patient Registration and Login

**Actions**:
1. Patient receives link to patient portal
2. Click to register (if self-registration enabled)
3. Enter:
   - Email: patient's email
   - Password: Create password
4. **Verify**: Patient account created
5. Login with credentials

### Step 2: View Own Medical Record

**Actions**:
1. Dashboard shows:
   - Upcoming appointments
   - Recent consultations
   - Current prescriptions
   - Recent images/tests
2. **Verify**: Only their own data visible

### Step 3: Request Appointment

**Actions**:
1. Click "Request Appointment"
2. Fill form:
   - Reason: "Follow-up for rash"
   - Preferred Dates: Select 3 dates/times
   - Doctor: "Any available" or specific doctor
3. Submit
4. **Verify**: Request sent to doctor

### Step 4: Doctor Reviews Request

**Actions**:
1. Doctor logs in, sees "Appointment Requests" section
2. Views patient's request
3. Confirms availability for one of requested times
4. Approves appointment
5. **Verify**: Patient notified via email

### Step 5: Patient Confirms Appointment

**Actions**:
1. Patient sees appointment on calendar
2. Can view appointment details
3. Can request reschedule if needed
4. **Verify**: Rescheduling request sent to doctor

### Step 6: Download Records

**Actions**:
1. Patient clicks "Download My Records"
2. System generates PDF or ZIP with:
   - All consultations
   - All prescriptions
   - All appointment history
   - Demographics
3. **Verify**: File downloads successfully
4. File is readable and complete

### Step 7: Message Communication (if implemented)

**Actions**:
1. Patient sends message to doctor: "Can I get refill of my cream?"
2. Doctor sees message, approves refill
3. New prescription created and visible to patient
4. **Verify**: Both directions of communication work

**Testing Checklist**:
- [ ] Patient can register/login securely
- [ ] Only own records visible in portal
- [ ] Appointment request feature works
- [ ] Doctor receives requests
- [ ] Automatic notifications sent
- [ ] Download records feature generates proper file
- [ ] Messaging between patient and doctor works
- [ ] Sensitive information protected (passwords not shown)
- [ ] Patient logout works
- [ ] Session timeout implemented
- [ ] Mobile responsiveness for patient portal
- [ ] Patient cannot access other patients' data

---

## Cross-Scenario Testing Notes

### Common Issues to Watch For:

1. **Data Consistency**: Information created in one scenario should persist through others
2. **Timestamp Accuracy**: All operations should have correct timestamps
3. **Audit Trail**: Every action should be logged with user and timestamp
4. **Concurrent Access**: If two doctors access same patient, no data loss
5. **State Management**: Frontend state should sync with backend database
6. **Performance**: Operations should complete without significant delay
7. **Error Recovery**: If action fails, should be reversible or clearly communicated

### Performance Baselines to Establish:

- Page load times (target: < 2 seconds)
- API response times (target: < 1 second)
- Image upload (target: < 5 seconds for 1MB file)
- AI analysis (target: < 30 seconds)
- Calendar rendering (target: < 2 seconds for 50+ appointments)
- Search results (target: < 500ms)

### Integration Points to Verify:

- Frontend-Backend API communication
- Database transactions and rollback
- External services (Claude API for AI analysis)
- Notification system (email/SMS if implemented)
- File storage (images, downloads)
- Session and authentication tokens

---

## Bug/Issue Documentation Template

For each scenario, if issues found:

```markdown
### Issue Found During [Scenario Name]

**Severity**: [Critical/High/Medium/Low]

**Steps to Reproduce**:
[From scenario, specific steps that caused issue]

**Expected Behavior**:
[What should have happened]

**Actual Behavior**:
[What actually happened]

**System State**:
- Database records affected: [List]
- Network calls made: [List]
- Errors in console: [If any]

**Screenshots**:
[Attach if helpful]

**Impact**:
[Does this break the feature?]
```

---

## Scenario Completion Checklist

After testing each scenario:

- [ ] All steps completed successfully
- [ ] Data persisted correctly
- [ ] No unexpected errors
- [ ] Performance acceptable
- [ ] User experience smooth
- [ ] All features working as designed
- [ ] UI/UX appropriate for use case
- [ ] Audit trail complete
- [ ] No security issues observed

---

**End of End-to-End Testing Scenarios**

These scenarios should be tested in order where possible, as each builds on previous data. However, they can also be run independently with fresh data.
