# SOLVOFIN — 1M1B FINAL SUBMISSION SPECIFICATION & VERIFIED DOCUMENTATION

**Project Title**: SOLVOFIN — AI-Powered Mobile Urban Intelligence Platform for Safer and Sustainable Public Transport  
**Program**: 1M1B – IBM SkillsBuild – AI for Sustainability Virtual Internship  
**Academic Institution**: ANITS (Anil Neerukonda Institute of Technology & Sciences), B.Tech CSE  
**Developer**: Panangipalli Shanmukha GuruDath  
**Evaluation Target**: UN Sustainable Development Goal 11 (Sustainable Cities and Communities — Target 11.2)  
**Document Status**: Final Submission Wording Alignment (Production Verified)

---

## 1. Database Architecture & Storage Specification

### Approved Submission Wording:
> **"34 JSON document collections exportable without loss from Solvofin's file-backed database repository."**

### Precise Architectural Definition:
- **Persistence Layer**: Lightweight, portable, file-backed JSON repository (`/data/solvofin_db.json`) wrapped in an in-memory caching and debounced write-through engine (`server/db.ts`).
- **No Relational SQL Database**: Solvofin does **not** employ a relational SQL database engine (such as PostgreSQL, MySQL, MariaDB, or SQLite).
- **Inter-Entity Relationships**: Cross-entity references (e.g., between `media`, `vehicles`, `road_defects`, `license_plates`, and `work_orders`) are maintained through indexed foreign keys and linked JSON document collections, not relational SQL tables or database schemas.
- **Export Integrity**: Full database state is exportable as a unified JSON snapshot via `/api/export/json` or as specialized municipal audit tables in CSV format via `/api/export/csv/:tableName`.

---

## 2. Artificial Intelligence Performance & Evaluation Specification

### Approved Submission Wording:
> **"Solvofin includes benchmark-oriented evaluation specifications for future validation; empirical model performance has not been established on a reproducible field-test dataset."**

### Clarification of Architectural Benchmark Targets:
- Solvofin includes benchmark-oriented evaluation specifications for future validation; empirical model performance has not been established on a reproducible field-test dataset.
- Statistical performance numbers are not claimed as empirical, field-tested, or live-measured project results for this academic prototype submission.
- The prototype prioritizes transparent dual-stage computer vision inference, explicit missing-context identification, and deterministic fallback handling over unvalidated statistical claims.

---

## 3. Sustainability & Environmental Metrics Specification

### Approved Submission Wording:
> **"Solvofin provides operational indicators that may support future assessment of fuel and environmental efficiency; real-world environmental impact has not been empirically measured in this prototype."**

### Actual Operational Indicators Measured by Solvofin:
- **Physical Road Distress**: Defect counts, categorized distress taxonomy (potholes, longitudinal/alligator cracks), bounding box coordinates, and volumetric asphalt patch tonnage estimations.
- **Urban Mobility & Transit Delay**: Corridor bottleneck queue lengths (meters), estimated transit delay minutes, traffic flow volume vs. capacity, and public transit bus headway times.
- **Micro-Climate Surface Thermal Context**: Pavement surface temperatures along surveyed transit routes, infrared thermal gradient zones, and identified monsoon waterlogging ponding locations.
- **Municipal Execution Lifecycle**: Active work orders queued, dispatched to field divisions, in-progress, and resolved under municipal service level agreements (SLAs).

### Unmeasured Environmental & Epidemiological Outcomes:
- **Vehicular Carbon (CO₂) Emissions**: Not empirically measured (vehicles lack direct tailpipe exhaust meters or OBD-II tailpipe gas sensors).
- **Net Fuel Savings**: Not empirically measured (fleet buses currently lack connected real-time fuel-flow telemetry).
- **Causal Collision Reductions**: Not empirically measured (requires multi-year longitudinal municipal crash registry data before and after deployment).
- **Pavement Lifespan Extension**: Not empirically measured (requires multi-season destructive core-drill sampling and compressive modulus testing).

---

## 4. UN Sustainable Development Goals (SDG) Alignment

### Approved Alignment Scope:
- **Target SDG**: UN Sustainable Development Goal 11 — *Sustainable Cities and Communities*.
- **Specific Target**: Target 11.2 — *"Provide access to safe, affordable, accessible and sustainable transport systems for all, notably expanding public transport."*
- **Operational Implementation**:
  - Proactive detection of structural road hazards on public transit bus corridors.
  - Driver vigilance support through non-punitive fatigue advisories.
  - Public bus passenger compartment accessibility and physical asset condition logging.

### Disclaimers & Regulatory Boundaries:
- **No Official Endorsement**: Solvofin is an academic research prototype. It is **not** certified, endorsed, or officially validated by the United Nations or UN-Habitat.
- **No Statutory Certification**: Solvofin recommendations do **not** constitute statutory municipal certification, building code approvals, or statutory road safety clearances.
- **No Autonomous Enforcement**: The platform does **not** make autonomous legal or enforcement decisions. All recommendations are subject to human-in-the-loop engineering review.

---

## 5. Document RAG Authoritative Source Specification

### Approved Standard Citation:
> **"IRC:82-2015 Code of Practice for Maintenance of Bituminous Roads"**  
> *Published by: Indian Roads Congress (IRC), New Delhi, 2015.*

### Knowledge Base Composition:
- The vectorized Document RAG knowledge base contains exactly **9 authoritative reference documents** (`/data/solvofin_rag_kb.json`):
  1. `IRC:82-2015`: Code of Practice for Maintenance of Bituminous Roads (Indian Roads Congress)
  2. `MoRTH-BS-2019`: Guidelines for Identification & Rectification of Accident Black Spots
  3. `CIRT-DFS-v2`: Commercial Motor Vehicle Driver Fatigue & Drowsiness Mitigation Standard
  4. `UNECE Reg. 107`: Uniform Provisions Concerning Public Service Vehicles (Buses)
  5. `UN-SDG-11-2022`: Sustainable Cities and Communities - Target 11.2 Framework
  6. `IRC:SP:20`: Rural & Urban Connector Road Drainage and Waterlogging Mitigation Manual
  7. `NUTP-2020`: National Urban Transport Policy Guidelines on Traffic Bottlenecks & Corridors
  8. `AIS-140-Rev1`: Intelligent Transportation Systems Requirements for Public Transport Vehicles
  9. `IRC:SP:84-2019`: Manual of Specifications and Standards for Four Laning of Highways
- **Non-Existent Standard Clarification**: Solvofin does **not** index or reference `IRC:82-2023`. All maintenance and distress triage guidelines cite `IRC:82-2015`.

---

## 6. Real-Time & Video ANPR Specification

### Approved Functional Scope & Governance:
- **Observation Aid**: ANPR (Automatic Number Plate Recognition) in Solvofin functions strictly as an **observation and identification aid**, not an autonomous enforcement decision engine.
- **No Autonomous Challans or Penalties**: Solvofin does **not** automatically issue traffic challans, fines, or penalty notices. Plate records provide evidentiary telemetry for human enforcement review.
- **Preservation of Optical Text**: The capture pipeline (`POST /api/anpr/capture`) records both raw unverified optical output (`raw_ocr_text`) and cleaned alphanumeric strings (`normalized_plate`).
- **Uncertainty & Blur Handling**: Characters are **never** fabricated or guessed. Records with confidence `< 0.65` or severe motion blur are cataloged as `NOT_READABLE` (`"Plate not reliably readable"`), and records below operational threshold are cataloged as `UNCERTAIN` (`"Plate text uncertain"`).
- **Role-Based Protection**: Full ANPR registries and real-time plate capture are restricted to authorized Municipal and Government personnel (`x-user-role: GOVERNMENT`); Citizen roles are strictly blocked.

---

## 7. Citizen Evidence Preservation & Escalation Specification

### Chain-of-Custody Guarantees:
- **Raw Byte Preservation**: Images uploaded via `POST /api/citizen/upload-photo` are committed directly to `/storage/uploads/` without lossy re-encoding or resizing.
- **Cryptographic Hash**: A SHA-256 cryptographic digest is calculated directly from incoming raw bytes and stored with the submission record.
- **Metadata Integrity**: Exact original filename, MIME type, byte size, and upload timestamp are permanently bound to the grievance.
- **Asset Separation**: The unaltered original citizen photograph is maintained as an independent asset (`original_photo`). AI computer vision annotations and bounding boxes are rendered as separate overlay assets (`annotated_photo_url`).
- **Government Display**: The Municipal Review Portal (`CitizenReviewView.tsx`) presents the unaltered citizen evidence alongside full cryptographic metadata.
- **Explicit Failure State**: If an evidence file is missing from disk, the portal displays an explicit error message (*"Asset cannot be loaded from storage. No substitute image displayed."*), preventing silent substitution or fallback to unverified images.

---

## 8. Export Suite & Source-Code Security Specification

### Verified System Exports:
- **Municipal Inspection PDFs**: High-resolution, multi-page Record of Evidence of Transit (RoEOT) inspection dossiers with embedded chain-of-custody hashes and technical RAG appendices.
- **Work Order CSV Tables**: Structured tabular exports for civil engineering divisions detailing defect dimensions, material estimates, and contractor priority scores.
- **Full Database JSON Snapshot**: Complete, loss-free data dumps (`/api/export/json`) representing all 34 linked JSON collections.
- **Source-Code ZIP Download Removal**: The complete website source-code ZIP download has been permanently decommissioned from frontend interfaces and server routes (`/api/export/zip` returns `HTTP 404`), upholding enterprise container security standards.
