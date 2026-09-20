# SOLVOFIN — AI-Powered Urban Intelligence for Road Safety and Sustainable Mobility

<p align="center">
  <strong>AI-Powered Urban Intelligence Platform for Safer Roads, Smarter Mobility and Sustainable Cities</strong>
</p>

<p align="center">
  <em>Citizen Reports • Government Intelligence • Computer Vision • RAG • Public Transport Safety • Traffic Analytics • AI Decision Support</em>
</p>

---

## 🌍 Overview

**Solvofin** is an AI-powered urban intelligence platform designed to help cities monitor, understand and respond to road safety, infrastructure, public transport and mobility challenges.

The platform brings together information from:

- Citizen-reported road and infrastructure issues
- Authorized government CCTV footage and images
- Public transport and fleet operations
- Traffic and mobility data
- Driver-safety visual signals
- Road and infrastructure inspections

Solvofin uses **Computer Vision, Multimodal AI, Generative AI, Retrieval-Augmented Generation (RAG), AI-powered decision support and controlled AI navigation** to convert raw observations into structured, contextual and actionable information.

The goal is not to replace government authorities or human decision-makers. Instead, Solvofin acts as an **AI-powered decision-support and urban intelligence layer** that helps stakeholders detect issues faster, understand their context and coordinate appropriate action.

---

# 🚨 Problem Statement

Urban areas continuously generate large amounts of information related to:

- Potholes and road defects
- Infrastructure damage
- Traffic incidents
- Unsafe driving
- Public transport safety
- Road congestion
- Environmental and thermal conditions
- Citizen complaints

However, this information is often fragmented across different sources.

Manual monitoring can make it difficult to:

- Detect issues quickly
- Prioritize infrastructure problems
- Monitor large numbers of roads and vehicles
- Analyze CCTV footage continuously
- Connect citizen reports with operational data
- Provide evidence-based recommendations
- Track government responses
- Maintain a complete audit trail

Solvofin addresses this problem by creating a unified AI-powered urban intelligence platform.

---

# 💡 Our Solution

Solvofin connects multiple urban data sources with AI-based analysis.

### Core Workflow

```text
Citizen Reports
      │
      ├──────────────────┐
      │                  │
Government CCTV    Fleet & Traffic Data
      │                  │
      └─────────┬────────┘
                ↓
       AI Computer Vision
                ↓
       Detection & Analysis
                ↓
       Location + Timestamp
                ↓
        Context Enrichment
                ↓
          RAG Evidence
                ↓
          AI Reasoning
                ↓
 Alert / Recommendation / Report
                ↓
 Automated Government Escalation
                ↓
          Human Review
                ↓
       Action / Work Order
                ↓
        Report + Audit Trail
```

---

# 🤖 Artificial Intelligence

Solvofin combines multiple AI capabilities rather than relying on a single chatbot.

## 1. Computer Vision

AI-based visual analysis can identify and analyze:

* Potholes
* Road cracks
* Infrastructure defects
* Vehicles
* Pedestrians
* Traffic incidents
* Lane transitions
* Unsafe/erratic driving patterns
* Smoke-related visual conditions
* Driver-safety visual signals

Visual observations are associated with relevant metadata such as:

* Location
* Timestamp
* Frame information
* Detection information
* Confidence information
* Source information

---

# 🚌 2. Public Transport & Driver Safety

Solvofin includes AI-assisted driver-safety analysis for public transport vehicles.

The system can analyze bus-camera footage for visual signals associated with:

* Drowsiness
* Yawning
* Head pose
* Eye-related fatigue indicators
* PERCLOS-related indicators
* Lane transitions
* Erratic driving patterns

When potentially unsafe driver conditions are detected, the platform can support a **safety alert workflow** so responsible personnel can intervene.

The system is designed as a safety-support mechanism rather than an autonomous vehicle-control system.

---

# 🚗 3. Moving Vehicle ANPR

Solvofin includes an Automatic Number Plate Recognition workflow for moving vehicles.

The system processes vehicle tracks and associates observations with:

* Vehicle class
* Frame index
* Timestamp
* Raw OCR output
* Normalized plate information
* Confidence information

The system uses readability thresholds to distinguish between:

* Readable
* Uncertain
* Not readable

No synthetic plate characters are generated when the system cannot reliably read a plate.

### Important Safety Boundary

ANPR is treated as an **observation and identification aid**, not autonomous enforcement.

Final enforcement actions require appropriate human supervisory review.

---

# 🛣️ 4. Road & Infrastructure Intelligence

Solvofin can analyze citizen reports and visual inputs for infrastructure-related problems.

Examples include:

* Potholes
* Road cracks
* Damaged infrastructure
* Drainage/waterlogging-related observations
* Road-condition problems
* Other visible road defects

The system can associate detected issues with their location and provide evidence for government teams to review.

---

# 📷 5. Citizen → AI → Government Automation

Citizens can report issues by providing information such as:

* Issue description
* Photograph
* Location

The submitted evidence can then move through the Solvofin AI workflow.

```text
Citizen Report
      ↓
Original Evidence Preserved
      ↓
AI Analysis
      ↓
Issue Classification
      ↓
Location & Context
      ↓
Government Workflow
      ↓
Human Review
      ↓
Action / Work Order
```

A key design principle is **original evidence preservation**.

The original citizen image is retained separately from AI-generated annotations.

The system records information such as:

* Original file
* Filename
* MIME type
* File size
* Timestamp
* SHA-256 hash

This allows the original evidence to remain distinguishable from AI-generated visual outputs.

---

# 📹 6. Government CCTV Intelligence

Authorized government CCTV images and video can be provided to Solvofin for automated AI analysis.

The system can analyze visual information for:

* Road defects
* Traffic incidents
* Vehicles
* Pedestrians
* Infrastructure conditions
* Smoke-related visual observations
* Mobility-related events

The resulting observations can be presented to government users for review and further action.

Solvofin does **not** claim unrestricted autonomous access to government CCTV systems.

---

# 🚦 7. Traffic & Urban Mobility Analytics

Solvofin provides tools for understanding urban mobility patterns.

The platform can support analysis of:

* Traffic bottlenecks
* Mobility corridors
* Route delays
* Vehicle movement
* Origin-Destination patterns
* Traffic incidents
* Road network conditions
* GIS-based mobility information

This information can help urban stakeholders understand where mobility problems are occurring and investigate potential causes.

---

# 🧠 8. Retrieval-Augmented Generation (RAG)

Solvofin includes a **Retrieval-Augmented Generation (RAG)** knowledge system.

Instead of relying only on a general-purpose AI model, the system retrieves relevant information from a curated knowledge base before generating contextual responses.

The knowledge base contains technical and reference documents related to:

1. IRC:82-2015 — Code of Practice for Maintenance of Bituminous Roads
2. MoRTH Guidelines for Identification & Rectification of Accident Black Spots
3. Commercial Motor Vehicle Driver Fatigue & Drowsiness Mitigation Standard
4. UNECE Regulation No. 107 — Public Service Vehicles
5. UN SDG 11 Target 11.2 Framework
6. IRC:SP:20 — Road Drainage and Waterlogging Mitigation
7. National Urban Transport Policy Guidelines
8. AIS-140 ITS Requirements for Public Transport Vehicles
9. IRC:SP:84-2019 — Four Laning Manual

### RAG Workflow

```text
User Query / AI Detection
          ↓
      Query Analysis
          ↓
   Semantic Retrieval
          ↓
Relevant Knowledge
          ↓
   Evidence Context
          ↓
     AI Reasoning
          ↓
  Contextual Response
```

This allows Solvofin to provide responses supported by relevant reference material instead of generating unsupported recommendations.

---

# 🤖 9. AI Copilot

Solvofin includes an AI Copilot designed to help users interact with urban intelligence data using natural language.

The Copilot can combine:

* Live operational information
* AI detections
* Infrastructure information
* Incident information
* Driver-safety information
* Traffic information
* RAG knowledge

Example queries:

```text
Which road areas have recent infrastructure issues?

What driver-safety incidents were detected recently?

Which locations have repeated road defects?

What technical guidance is relevant to this road issue?
```

The system combines available operational information with relevant evidence from the knowledge base.

---

# 🧭 10. AI Navigator

Solvofin includes a controlled AI navigation layer.

The AI Navigator can route read-only queries to approved data operations such as:

```text
search_infrastructure
search_incidents
search_driver_safety
search_work_orders
search_traffic
search_heatwave
search_sdg_context
search_audit_history
```

The system is intentionally restricted from performing unsafe mutations such as:

```text
DELETE data
MODIFY records
Execute SQL
Execute shell commands
Create unauthorized work orders
Change review decisions
Punish a driver
```

This provides a controlled environment for AI-assisted information access.

---

# 🏛️ 11. Government Decision Support

Solvofin converts AI observations into structured decision-support information.

AI-generated outputs can contain:

* What happened
* Where it happened
* When it happened
* Relevant context
* Supporting evidence
* Potential risk considerations
* Recommended next steps
* Information gaps

The system is designed to **assist government decision-making**, not replace it.

---

# 👤 12. Human-in-the-Loop AI

Important decisions remain under human supervision.

Government users can:

* Accept an AI recommendation
* Modify an AI recommendation
* Reject an AI recommendation

The original AI recommendation is preserved.

Actions and review history are recorded in an audit trail.

```text
AI Recommendation
       ↓
Government Review
   ↙     ↓      ↘
Accept  Modify  Reject
       ↓
   Audit Trail
```

This creates a clear separation between:

**AI-generated recommendation**

and

**Human-authorized decision**

---

# 📊 13. AI Reports

Solvofin can generate structured reports for:

* Infrastructure
* Road safety
* Traffic
* Incidents
* Driver safety
* Urban mobility
* AI observations

Reports can include:

* Detected observations
* Evidence
* Location
* Timestamp
* AI reasoning
* RAG references
* Recommendations
* Review information
* Audit information

Supported export formats include:

* PDF
* CSV
* JSON

---

# 🔐 14. Responsible AI

Responsible AI is a core part of Solvofin.

### Human Oversight

Important decisions remain under human review.

### Transparency

AI-generated recommendations are distinguishable from human decisions.

### Evidence Preservation

Original citizen evidence is preserved separately from AI annotations.

### Traceability

AI outputs and important user actions can be tracked through audit information.

### Privacy

The system is designed around authorized data access and controlled workflows.

### Safety

AI detections are treated as decision-support information rather than automatically enforced conclusions.

### Limitations

The platform communicates uncertainty and does not invent information when evidence is insufficient.

---

# 🌱 Sustainability & SDGs

Solvofin primarily supports:

## SDG 11 — Sustainable Cities and Communities

Particularly:

### Target 11.2

Supporting safer, more accessible and sustainable urban transport systems.

### SDG 3 — Good Health and Well-Being

Supporting:

* Road safety
* Driver safety
* Accident-risk awareness
* Safer public transportation

### SDG 9 — Industry, Innovation and Infrastructure

Supporting:

* AI-powered infrastructure monitoring
* Intelligent mobility systems
* Digital infrastructure management
* Technology-driven urban planning

### SDG 13 — Climate Action

Solvofin provides operational indicators related to mobility, traffic and infrastructure that can support future sustainability analysis.

**Important:** Real-world reductions in carbon emissions, fuel consumption or accidents have not yet been empirically measured in this prototype.

---

# 🎯 Target Users

* Citizens & Commuters
* Government Authorities
* Municipal Administrators
* Public Transport Authorities
* Fleet Managers
* Drivers & Transport Operators
* Road & Infrastructure Maintenance Teams
* Traffic Management Teams
* Urban Planners
* Mobility Analysts
* Government Decision-Makers
* Supervisors

---

# ⚙️ Key Features

| Feature                 | Description                                        |
| ----------------------- | -------------------------------------------------- |
| 🏙️ Urban Intelligence  | Unified platform for urban safety and mobility     |
| 📷 Citizen Reporting    | Report road and infrastructure problems            |
| 🤖 Computer Vision      | Detect road, traffic and infrastructure conditions |
| 📹 CCTV Intelligence    | Analyze authorized government visual inputs        |
| 🚌 Driver Safety        | AI-assisted public transport driver monitoring     |
| 🚗 ANPR                 | Moving-vehicle number plate observation            |
| 🚦 Traffic Analytics    | Analyze congestion and mobility patterns           |
| 🗺️ GIS                 | Location-aware urban intelligence                  |
| 🧠 RAG                  | Evidence-grounded AI responses                     |
| 🤖 AI Copilot           | Natural-language interaction with operational data |
| 🧭 AI Navigator         | Controlled read-only AI data navigation            |
| 📊 Decision Support     | AI-generated insights and recommendations          |
| 🏛️ Government Workflow | Citizen-to-government escalation                   |
| 📝 Work Orders          | Track infrastructure action workflows              |
| 👤 Human Review         | Accept / Modify / Reject AI recommendations        |
| 📋 Audit Trail          | Track decisions and AI-generated outputs           |
| 📄 Reports              | PDF / CSV / JSON reporting                         |
| 🔐 Responsible AI       | Human oversight and evidence traceability          |

---

# 🏗️ System Architecture

```text
                         SOLVOFIN
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
     Citizens          Government CCTV      Fleet / Traffic
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
                    Data Processing Layer
                            ↓
                  AI / Computer Vision Layer
                            ↓
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   Road Detection      Traffic Analysis    Driver Safety
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
                     Context Layer
                            ↓
                    RAG Knowledge Base
                            ↓
                 AI Reasoning / Copilot
                            ↓
                  Decision Support Layer
                            ↓
                 Government Workflows
                            ↓
                   Human Review Layer
                            ↓
                    Action / Work Order
                            ↓
                  Reports + Audit Trail
```

---

# 🧪 Design Thinking Approach

## 1. Empathize

Understand challenges faced by:

* Citizens
* Government authorities
* Drivers
* Fleet managers
* Infrastructure teams
* Urban planners

## 2. Define

Identify problems around:

* Road safety
* Infrastructure monitoring
* Public transport safety
* Traffic management
* Fragmented urban data

## 3. Ideate

Explore AI-based solutions using:

* Computer Vision
* RAG
* Generative AI
* GIS
* Intelligent automation
* Decision support

## 4. Prototype

Develop the Solvofin working prototype and integrate the major AI workflows.

## 5. Test & Refine

Continuously test workflows, identify limitations and improve the system while maintaining human oversight.

---

# 🛠️ Technology Stack

## Frontend

* React
* TypeScript
* Vite
* HTML
* CSS
* GIS / Map-based interfaces

## Backend

* Node.js
* Express
* TypeScript
* File-backed JSON data storage

## AI & ML

* Computer Vision
* Multimodal AI
* Generative AI
* Retrieval-Augmented Generation
* Semantic Search
* Natural Language Processing
* MediaPipe
* AI-powered Decision Support

## AI Interaction

* Google Gemini
* AI Copilot
* AI Navigator
* RAG Knowledge Retrieval

## Development & Productivity

* Git
* GitHub
* VS Code
* IBM Bob
* IBM SkillsBuild

---

# 📁 Project Structure

```text
SOLVOFIN-New/
│
├── .bob/
│   ├── rules-agent/
│   ├── rules-ask/
│   └── rules-plan/
│
├── data/
│   ├── solvofin_db.json
│   └── solvofin_rag_kb.json
│
├── Documentation/
│   └── Solvofin_Project_Documentation.pdf
│
├── public/
│
├── server/
│   ├── src/
│   └── storage/
│
├── src/
│
├── App.tsx
├── main.tsx
├── server.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Git

## Clone the Repository

```bash
git clone https://github.com/SHANMUKHAGURUDATH/SOLVOFIN-New.git
cd SOLVOFIN-New
```

## Install Dependencies

```bash
npm install
```

## Environment Variables

Create your local environment file based on:

```text
.env.example
```

Add the required API keys and configuration values locally.

**Never commit private API keys or secrets to GitHub.**

## Run in Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

## Start Production Server

```bash
npm start
```

## TypeScript Validation

```bash
npm run lint
```

---

# 📈 Current Prototype Status

Solvofin is developed as a working prototype demonstrating integrated urban AI workflows.

The prototype focuses on demonstrating:

* AI-assisted urban monitoring
* Computer vision workflows
* Citizen reporting
* Government workflows
* Public transport safety
* Traffic intelligence
* RAG-based evidence retrieval
* AI decision support
* Human-in-the-loop review
* Reporting
* Auditability

The project does not claim that prototype observations represent measured city-wide performance.

Real-world field validation is required before making claims about:

* Accident reduction
* Fuel savings
* Carbon reduction
* Operational cost reduction
* City-wide safety improvement

---

# 🔮 Future Scope

## 🌐 Large-Scale Deployment

Deploying Solvofin across multiple cities and transport networks.

## 📡 Real-Time Data Integration

Integration with approved real-time:

* CCTV streams
* Public transport systems
* Traffic sensors
* GPS feeds
* Government databases

## 🧠 Advanced AI Models

Further improvement of:

* Road defect detection
* Driver fatigue detection
* Traffic prediction
* Incident understanding
* Multimodal reasoning

## 📱 Citizen Mobile Application

Dedicated mobile applications for:

* Issue reporting
* Location sharing
* Status tracking
* Government communication

## 📊 Predictive Urban Intelligence

Future models could help predict:

* Traffic bottlenecks
* Infrastructure deterioration
* High-risk road locations
* Repeated incident zones

## 🌱 Sustainability Measurement

Future field deployments could measure:

* Fuel efficiency
* Travel-time improvements
* Emission indicators
* Infrastructure maintenance efficiency
* Safety outcomes

---

# ⚠️ Limitations

Solvofin is an AI-assisted prototype and has important limitations.

* AI detections may contain false positives or false negatives.
* Visual analysis depends on image/video quality.
* ANPR performance depends on plate visibility and image quality.
* Driver-safety indicators should not be interpreted as medical diagnoses.
* AI recommendations require human review.
* Authorized access is required for government data sources.
* RAG responses depend on the quality and coverage of the knowledge base.
* Real-world environmental and safety impacts have not yet been empirically measured.

---

# 🛡️ Responsible Use

Solvofin should be deployed with appropriate:

* Data-access controls
* Privacy protections
* Human supervision
* Audit mechanisms
* Government authorization
* Security controls
* Model validation
* Operational testing

AI-generated information should be treated as **decision-support information**, not as an unquestionable final decision.

---

# 👨‍💻 Developer

## Panangipalli Shanmukha GuruDath

**Founder & Lead Developer — Solvofin**

B.Tech — Computer Science & Engineering
Anil Neerukonda Institute of Technology & Sciences (ANITS)

### Profiles

GitHub:
[https://github.com/SHANMUKHAGURUDATH](https://github.com/SHANMUKHAGURUDATH)

LinkedIn:
[https://www.linkedin.com/in/panangipalli-shanmukha-gurudath-939b20364](https://www.linkedin.com/in/panangipalli-shanmukha-gurudath-939b20364)

---

# 📚 Project Documentation

Detailed implementation documentation is available at:

```text
Documentation/Solvofin_Project_Documentation.pdf
```

The documentation covers:

* System architecture
* AI workflows
* RAG system
* Responsible AI
* Data flow
* Implementation details
* Project design
* Human-in-the-loop workflows

---

# 🏆 Project Vision

> **"From urban data to intelligent action — making cities safer, smarter and more sustainable."**

Solvofin aims to demonstrate how AI can connect citizens, government authorities, public transport and urban infrastructure into a unified intelligence system.

The long-term vision is to move from fragmented urban information toward **evidence-based, human-supervised and AI-assisted urban decision-making**.

---

# 🌍 SDG Alignment

### Primary SDG

**SDG 11 — Sustainable Cities and Communities**

### Supporting SDGs

* **SDG 3 — Good Health and Well-Being**
* **SDG 9 — Industry, Innovation and Infrastructure**
* **SDG 13 — Climate Action**

---

# 📜 License

This project is currently maintained as an academic, internship and prototype project.

Please contact the project author before commercial redistribution or reuse of substantial portions of the implementation.
