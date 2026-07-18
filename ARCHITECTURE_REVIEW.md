# Germany Study Abroad Platform: Architecture & Prompt Review

This document analyzes your original system design prompt against what we have built so far, highlighting what is already implemented, what is currently missing, and providing a comprehensive, updated prompt for a senior data engineer.

---

## 1. What We Have Built (What is Already There)

We have already established a solid foundation that addresses many of your core requirements.

### Database Schema (Prisma)

- **Student Profile**: Your requested fields (`cgpa`, `budget`, `ieltsScore`, `preferredIntake`, `degree`, `specialization`) are fully implemented in the `Student` model.
- **University Information**: We capture `name`, `type` (Public/Private), `city`, `state`, and `websiteUrl` in the `University` model.
- **Program Information**: The `Course` model captures `name`, `degree`, `durationSemesters`, `creditPoints` (ECTS), and `language`.
- **Intakes & Deadlines**: Handled via boolean flags (`intakeWinter`, `intakeSummer`) and timestamp fields (`applicationDeadlineWinter`, `applicationDeadlineSummer`).
- **Fees**: We track `tuitionFeeEuros` at the course level and `averageRentEuros` at the university level.
- **Curriculum & Admission Details**: We utilize JSON fields (`curriculum`, `admissionRequirements`) for flexible unstructured data storage.

### Scraper Architecture

- **Modular Ingestion Pipeline**: We built a production-grade web scraper using a Base Adapter pattern (`BaseScraper`).
- **Targeted & Generic Scraping**: Implemented specific adapters (e.g., TUM, LMU) alongside a generic fallback scraper.
- **Rate Limiting & Retries**: The scraper respects target websites (2-second delays) and handles failures gracefully to avoid being blocked.
- **Scheduling**: Fully integrated `node-cron` for automated weekly updates.

---

## 2. What is Missing (What Should Be Added)

While the foundation is strong, addressing your specific goal of "ensuring no relevant opportunity is missed" requires adding the following elements to our current architecture:

### Missing Data Fields

- **Detailed Eligibility Criteria**: German admissions are notoriously strict. We need explicit DB fields (or strict JSON schemas) for:
  - `workExperienceMonths` (Int)
  - `greRequired` (Boolean) / `greMinimumScore` (Int)
  - `requiredBackgroundECTS` (JSON - e.g., mapping required credits in Math, CS, etc.)
- **German Bureaucracy Fields**:
  - `requiresUniAssist` (Boolean)
  - `requiresAPS` (Boolean - Critical for Indian/Chinese applicants)
  - `isOpenAdmission` (Boolean - Zulassungsfrei vs. Zulassungsbeschränkt)
- **Application Links**: `applicationPortalUrl` (often different from the `programPageUrl`).

### Missing Architectural Components

- **Change Tracking / Versioning**: Currently, our scraper overwrites existing records. To "track changes in deadlines and requirements", we need an Audit Table or History Log (e.g., `CourseVersionHistory`) to see _when_ a deadline shifted.
- **Completeness Scoring**: We need a script or database trigger that calculates a `dataCompletenessScore` (0-100%) based on how many critical fields are populated, alerting us to manual review needs.
- **Aggregator Integration**: We currently scrape universities directly. We have not yet implemented scrapers for DAAD or MyGermanUniversity as primary aggregation layers.

---

## 3. The Updated, Senior-Level Prompt

If you were to present this project to a Senior Data Engineer or Solutions Architect today, here is the modernized, comprehensive prompt incorporating everything we've learned:

---

**System Context & Goal:**
I am building a comprehensive Germany Study Abroad Platform. The core objective is a deterministic matching engine: a student inputs their profile (CGPA, ECTS breakdown, IELTS/TOEFL, Budget, Intake, Degree), and the system returns 100% accurate program eligibilities. German admissions are highly strict (e.g., missing 1 ECTS in a specific subject means rejection), so data quality is our highest priority.

**Current State:**
We have a Node.js/Express/PostgreSQL (Prisma) backend with a modular scraping architecture (Cheerio, Node-Cron) that scrapes university websites directly via specific adapters (e.g., TUM, LMU) with rate-limiting and retry logic.

**Data Model Requirements:**
For every program, the system must deterministically track:

- **University**: Name, Type (Public/Private/Applied Sciences), City, State.
- **Program**: Name, Degree Type, Duration, ECTS, Language of Instruction, Program URL, Application Portal URL.
- **Intakes**: Winter/Summer availability, specific deadlines (which may vary by applicant nationality).
- **Strict Eligibility**: Minimum GPA (German scale), IELTS/TOEFL thresholds, Work Experience requirements, GRE requirements.
- **Subject-Specific Requirements**: Required ECTS in specific bachelor's background subjects (e.g., 30 ECTS in Mathematics).
- **Bureaucracy**: Uni-Assist requirement, APS certificate requirement, Admission type (Zulassungsfrei/Open vs. NC/Restricted).
- **Financials**: Tuition fees, Semester contributions, Estimated living costs in that specific city.
- **Curriculum**: Modules, Specializations.

**Primary Data Sources:**

- Aggregators (DAAD, MyGermanUniversity)
- Official University Websites (Source of Truth)

**I need you to design the next phase of this production-grade architecture. Please answer the following:**

1. **Ingestion Strategy**: Given we already have specific university adapters, should we pivot to scraping DAAD as a base layer and using our adapters solely for data enrichment/verification?
2. **Handling Strict Eligibility**: How do we model and parse "Subject-Specific Requirements" (e.g., "Requires 20 ECTS in theoretical physics") when universities display this data in highly unstructured PDFs or varying HTML formats?
3. **Change Data Capture (CDC)**: Our current scraper overwrites old data. How should we architect the database to track historical changes in deadlines or admission rules without bloating the database?
4. **Data Quality & Completeness**: How do we implement a pipeline stage that calculates a "completeness score" for a scraped program and flags it for human review if critical matching criteria are missing?
5. **Matching Engine Logic**: Since German universities don't use fuzzy matching (you either meet the criteria or you don't), how should we design the query/matching engine to handle complex conditional logic efficiently at scale?
6. **Scaling**: As we scale to 5,000+ programs and potentially daily scrapes during deadline seasons, how should we evolve our current single-node Node-Cron architecture while keeping costs minimal for a solo founder?

---
