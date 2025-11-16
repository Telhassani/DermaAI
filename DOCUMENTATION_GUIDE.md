# DermAI Documentation Guide

**Purpose**: Navigate all documentation files for testing, implementation, and development

---

## 📚 Document Map

### Testing Documentation

#### [TESTING_MANUAL.md](TESTING_MANUAL.md) - Step-by-Step Testing Guide
**What**: Detailed manual test procedures for all features
**When to use**: During quality assurance and testing phase
**Size**: ~100 pages
**Contains**:
- 92 individual test cases across 7 modules
- Setup requirements and pre-testing checklist
- Expected results with verification points
- UI/UX checks and accessibility tests
- Bug reporting template

**Module Breakdown**:
1. **Module 1: Authentication** (10 tests) - Login, register, session, rate limiting
2. **Module 2: Patient Management** (8 tests) - CRUD, search, statistics
3. **Module 3: Appointment Scheduling** (12 tests) - Calendar, conflicts, recurring
4. **Module 4: Consultations** (6 tests) - Notes, lab results, history
5. **Module 5: Prescriptions** (8 tests) - Creation, interactions, printing
6. **Module 6: Image Analysis** (5 tests) - Upload, gallery, AI analysis
7. **Cross-Cutting Concerns** (33 tests) - Security, performance, accessibility, compliance

#### [TESTING_SCENARIOS.md](TESTING_SCENARIOS.md) - Real-World Workflows
**What**: End-to-end integration testing scenarios
**When to use**: After unit testing, to verify features work together
**Size**: ~80 pages
**Contains**:
- 10 realistic usage scenarios
- Complete patient lifecycle workflows
- Complex multi-step processes
- Edge cases and error scenarios

**Scenario List**:
1. New Patient First Visit (patient creation → consultation → prescription)
2. Follow-up Appointment (review history → medication adjustment)
3. Recurring Treatment Plan (weekly appointments, series management)
4. Complex Drug Interactions (multi-drug prescription with checking)
5. Calendar Conflict Resolution (emergency rescheduling)
6. Patient History Review (complete record navigation)
7. Image Analysis & Diagnosis (upload, AI analysis, documentation)
8. Emergency Rescheduling (batch reschedule multiple appointments)
9. Multi-Doctor Practice (coordination and shared records)
10. Patient Portal (patient self-service features)

#### [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - Progress Tracking
**What**: Editable progress tracking spreadsheet
**When to use**: To track testing progress and record bugs
**Size**: ~40 pages
**Contains**:
- 92 test cases with status tracking (⭕ Pending, 🟨 In Progress, ✅ Passed, ❌ Failed)
- Summary dashboard with metrics
- Time tracking (estimated vs. actual)
- Bug tracking with severity levels
- Known issues documentation
- Test certification sign-off

**How to Use**:
1. Mark tests as 🟨 In Progress when starting
2. Record results as ✅ Passed or ❌ Failed
3. Link to bugs in "Bugs Found" column
4. Track time spent per module
5. Sign off when complete

---

### Implementation Documentation

#### [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Complete Project Status
**What**: Comprehensive status report on development and roadmap
**When to use**: For project planning, investor updates, team coordination
**Size**: ~100 pages
**Contains**:
- Phase 1: Foundation & Testing status (✅ complete)
- Phase 2: Performance optimization (N+1 queries identified)
- Phase 3: Advanced features (AI, caching) - to do
- Current codebase status (what works, what doesn't)
- Known issues and limitations
- Detailed roadmap with timelines
- Technology stack summary
- Team resource breakdown
- Success metrics and deployment checklist

**Key Sections**:
- Executive summary (quick overview)
- Completed work with statistics
- Identified N+1 query problems (5 critical issues)
- Remediation plan (Phase 2A: quick wins, Phase 2B: optimization)
- Advanced features roadmap
- Deployment readiness assessment
- Production checklist

---

### Project Documentation

#### [CLAUDE.md](CLAUDE.md) - Project Guidelines & Architecture
**What**: Developer guidelines and architectural documentation
**When to use**: When developing new features or understanding project structure
**Contains**:
- Quick start commands for frontend and backend
- Architecture overview
- Important architectural patterns
- Development guidelines
- Common tasks (adding API endpoints, components)
- Database migration instructions
- Key project details and compliance notes
- Recent project history

#### [README.md](README.md) - Project Overview (if exists)
**What**: High-level project overview
**When to use**: Getting started with the project
**Contains**:
- Project description
- Features overview
- Installation instructions
- Usage guide
- Contribution guidelines

---

## 🎯 Quick Start Guide

### For QA/Testers
1. Read [TESTING_MANUAL.md](TESTING_MANUAL.md) sections relevant to your module
2. Use [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) to track progress
3. Execute tests following procedures in TESTING_MANUAL.md
4. Record results in TESTING_CHECKLIST.md
5. Follow bug reporting template when issues found
6. Reference [TESTING_SCENARIOS.md](TESTING_SCENARIOS.md) for integration testing

### For Developers (Backend)
1. Review [CLAUDE.md](CLAUDE.md) for architecture and patterns
2. Check [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for roadmap
3. Reference performance issues and N+1 fixes needed
4. Follow development guidelines in CLAUDE.md
5. Run tests using pytest from backend directory
6. Update IMPLEMENTATION_STATUS.md when completing tasks

### For Developers (Frontend)
1. Review [CLAUDE.md](CLAUDE.md) for frontend architecture
2. Check component structure and state management patterns
3. Follow development guidelines for React/TypeScript
4. Run tests using `npm run test`
5. Use Storybook for component development
6. Verify responsive design across breakpoints

### For Project Managers
1. Review [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for overall status
2. Check roadmap section for timelines
3. Reference team resource breakdown for allocation
4. Use success metrics for progress tracking
5. Monitor deployment checklist for production readiness

### For DevOps/Infrastructure
1. Review deployment section in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
2. Check technology stack in CLAUDE.md
3. Review production checklist
4. Prepare monitoring and backup systems
5. Configure secrets management for API keys

---

## 📊 Document Overview Table

| Document | Purpose | Size | Audience | Update Frequency |
|----------|---------|------|----------|------------------|
| TESTING_MANUAL.md | Step-by-step test procedures | 100 pages | QA/Testers | After new features |
| TESTING_SCENARIOS.md | End-to-end workflows | 80 pages | QA/Testers | After UI changes |
| TESTING_CHECKLIST.md | Progress tracking | 40 pages | QA/Testers | Real-time (during testing) |
| IMPLEMENTATION_STATUS.md | Project status & roadmap | 100 pages | Developers/PMs | Weekly |
| CLAUDE.md | Architecture & guidelines | 30 pages | Developers | As needed |
| DOCUMENTATION_GUIDE.md | This guide | 10 pages | Everyone | Monthly |

---

## 🔍 Finding Information

### By Task

**I need to test...**
→ See [TESTING_MANUAL.md](TESTING_MANUAL.md) for your module (Module 1-7)

**I need to understand...**
- Project structure → [CLAUDE.md](CLAUDE.md) "Architecture Overview"
- What's been done → [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) "Phase 1: Foundation & Testing"
- What needs fixing → [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) "Phase 2: Performance Optimization"

**I need to implement...**
- Authentication → See [CLAUDE.md](CLAUDE.md) "Important Architectural Patterns"
- API endpoints → See [CLAUDE.md](CLAUDE.md) "Adding a New API Endpoint"
- Frontend component → See [CLAUDE.md](CLAUDE.md) "Adding a New Frontend Component"

**I need to fix bugs related to...**
- N+1 queries → [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) "Phase 2: Performance Optimization"
- Authentication → [TESTING_MANUAL.md](TESTING_MANUAL.md) "Module 1: Authentication"
- Appointments → [TESTING_MANUAL.md](TESTING_MANUAL.md) "Module 3: Appointment Scheduling"

**I need to test scenario...**
→ See [TESTING_SCENARIOS.md](TESTING_SCENARIOS.md) "Scenario [1-10]"

### By Role

**QA/Tester**
1. Start: [TESTING_MANUAL.md](TESTING_MANUAL.md) → Setup Requirements
2. Track: [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) → Update status
3. Reference: [TESTING_SCENARIOS.md](TESTING_SCENARIOS.md) → For workflows
4. Report: Use bug template from TESTING_MANUAL.md

**Backend Developer**
1. Understand: [CLAUDE.md](CLAUDE.md) → Architecture Overview
2. Check: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) → What to work on
3. Follow: [CLAUDE.md](CLAUDE.md) → Development Guidelines
4. Test: Run pytest from backend directory

**Frontend Developer**
1. Understand: [CLAUDE.md](CLAUDE.md) → Frontend Architecture
2. Check: Component patterns and best practices in CLAUDE.md
3. Test: Run tests with `npm run test`
4. Verify: [TESTING_MANUAL.md](TESTING_MANUAL.md) Module 6-7 for UI/UX

**Project Manager**
1. Status: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) → Executive Summary
2. Timeline: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) → Roadmap
3. Resources: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) → Team & Resources
4. Metrics: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) → Success Metrics

---

## 🚀 Using Documentation During Different Phases

### Phase 1: Manual Testing (Now)
**Primary Documents**:
- [TESTING_MANUAL.md](TESTING_MANUAL.md) - Execute tests
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - Record results
- [TESTING_SCENARIOS.md](TESTING_SCENARIOS.md) - Run integration tests

**Process**:
1. Setup test environment (see TESTING_MANUAL.md Pre-Testing Checklist)
2. Execute Module 1-3 tests (authentication, patients, appointments)
3. Record pass/fail in TESTING_CHECKLIST.md
4. Document bugs with template from TESTING_MANUAL.md
5. Run scenarios from TESTING_SCENARIOS.md
6. Report findings to development team

### Phase 2: Performance Optimization
**Primary Documents**:
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) "Phase 2" - Implementation details
- [CLAUDE.md](CLAUDE.md) "Architecture" - Understanding current code
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - Verify fixes don't break tests

**Process**:
1. Review N+1 issues in IMPLEMENTATION_STATUS.md
2. Implement fixes for Phase 2A (quick wins)
3. Run TESTING_MANUAL.md Module 3-5 tests to verify
4. Update TESTING_CHECKLIST.md with results
5. Proceed to Phase 2B (service layer optimization)

### Phase 3: Advanced Features
**Primary Documents**:
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) "Phase 3" - Feature specs
- [CLAUDE.md](CLAUDE.md) - Architecture guidance
- [TESTING_MANUAL.md](TESTING_MANUAL.md) Module 6 - AI/image testing

**Process**:
1. Review feature requirements in IMPLEMENTATION_STATUS.md
2. Implement according to CLAUDE.md patterns
3. Test with TESTING_MANUAL.md Module 6 procedures
4. Verify with TESTING_SCENARIOS.md scenarios 7
5. Update TESTING_CHECKLIST.md with results

---

## 📝 Maintenance & Updates

### When to Update Which Documents

| Document | Update When | Who | Frequency |
|----------|------------|-----|-----------|
| TESTING_MANUAL.md | New features added | QA Lead | Monthly |
| TESTING_CHECKLIST.md | Running tests | Testers | Daily (during testing) |
| TESTING_SCENARIOS.md | UI significantly changes | QA Lead | Quarterly |
| IMPLEMENTATION_STATUS.md | Completing major phases | PM/Tech Lead | Weekly |
| CLAUDE.md | Architecture changes | Tech Lead | As needed |

### Updating TESTING_CHECKLIST.md During Testing

**Before Each Test**:
- Mark as 🟨 In Progress
- Note start time

**After Each Test**:
- Mark as ✅ Passed or ❌ Failed
- Add notes or bug ID
- Update time spent

**Weekly Summary**:
- Calculate completion percentage
- Update dashboard metrics
- Report status to team

---

## ⚠️ Important Notes

1. **Keep TESTING_CHECKLIST.md Updated**: This is your single source of truth for test progress
2. **Document Bugs Consistently**: Use the template in TESTING_MANUAL.md for all bug reports
3. **Don't Modify Test Procedures**: If a procedure needs updating, coordinate with QA lead
4. **Reference by Section**: When discussing tests, use module/test numbers (e.g., "Module 1, Test 1.3")
5. **Preserve Commit History**: All documentation is in git; check history if you need previous versions

---

## 🔗 Related Repositories/Links

- **Frontend**: `/frontend` - Next.js application
- **Backend**: `/backend` - FastAPI application
- **Database**: PostgreSQL (local: localhost:5432)
- **Cache**: Redis (local: localhost:6379)
- **API Docs**: http://localhost:8000/docs (when backend running)
- **Frontend Dev**: http://localhost:3000 (when frontend running)

---

## 📞 Getting Help

### If you're stuck on...

**A Test**
→ Check TESTING_MANUAL.md for detailed procedure, look at related scenarios in TESTING_SCENARIOS.md

**Development Issues**
→ Check IMPLEMENTATION_STATUS.md "Known Issues & Limitations" or "Phase 2" sections

**Architecture Questions**
→ Refer to CLAUDE.md "Architecture Overview" and "Important Architectural Patterns"

**Project Status**
→ Review IMPLEMENTATION_STATUS.md for current status, timeline, and roadmap

---

## 📄 Document Statistics

- **Total Documentation**: ~500 pages
- **Test Cases**: 92 individual tests
- **Scenarios**: 10 end-to-end workflows
- **Code Examples**: 50+ snippets
- **Diagrams/Tables**: 100+

---

**Last Updated**: November 16, 2025
**Maintained By**: Claude Code
**Status**: Active
**Next Review**: After Phase 1 Testing Complete
