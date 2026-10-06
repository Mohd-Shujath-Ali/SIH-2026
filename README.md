# Sudarshan Chakra
## AI-Powered Criminal Network Analysis System

> **An evidence-first intelligence platform that converts fragmented investigative records into validated, connected, and reviewable criminal intelligence.**

Sudarshan Chakra is a software prototype developed for **Smart India Hackathon 2026 – SIH26189: AI-Powered Criminal Network Analysis System**, under the **Blockchain & Cybersecurity** theme for the **Ministry of Home Affairs / National Crime Records Bureau (NCRB)**.

The system is built around one core principle:

> **LLM output is not truth. Source evidence determines what can be trusted.**

Instead of sending raw AI output directly into a network graph, Sudarshan Chakra separates **extraction, validation, entity resolution, evidence, and graph construction** so that investigators can review why a relationship exists before relying on it.

---

## 1. The Problem

Criminal investigations generate information from many different sources:

- FIRs and police reports
- Call Detail Records (CDRs)
- Financial and transaction records
- Location information
- Surveillance and intelligence reports
- Criminal-history information
- Other structured and unstructured investigative documents

The challenge is not simply storing this information. The real difficulty is **connecting the information across records**.

The same person may appear under different names or aliases. A relationship may be described indirectly. Information may be incomplete, inconsistent, or buried inside scanned documents. Manual comparison across large volumes of records can take time and may cause useful connections to be missed.

Sudarshan Chakra addresses this problem by turning scattered records into an **evidence-linked intelligence network** that investigators can inspect and correct.

---

## 2. What Sudarshan Chakra Does

At a high level, the platform follows:

```text
RAW EVIDENCE
     ↓
OCR / HTR / PARSING
     ↓
INVESTIGATOR VERIFICATION
     ↓
LLM-1: CANDIDATE EXTRACTION
     ↓
CANDIDATE JSON
     ↓
LLM-2: EVIDENCE VERIFICATION & RESOLUTION
     ↓
VALIDATED INTELLIGENCE
     ↓
ONTOLOGY
     ↓
KNOWLEDGE GRAPH
     ↓
TEMPORAL / NETWORK / GEO-SPATIAL ANALYSIS
     ↓
INVESTIGATOR WORKSPACE
     ↓
GROUND-TRUTH FEEDBACK
     ↺
MODEL IMPROVEMENT
```

The important distinction is:

```text
We do NOT do:

FIR → LLM → Graph

We do:

FIR → Extract → Verify → Resolve → Connect → Investigate
```

---

## 3. Core Features

### Multi-Source Evidence Ingestion

The system is designed to work with different kinds of investigative records rather than depending on a single document format.

Typical inputs include:

- PDF documents
- Scanned FIRs
- Images
- Text records
- CSV / structured records
- CDR-related data
- Financial records
- Location data
- Other investigative material

Source-specific preprocessing is used so that unstructured documents and structured records are handled appropriately.

### Local / Controlled Document Processing

Scanned evidence can pass through a local OCR/HTR processing boundary using a Raspberry Pi-based prototype node.

The purpose is to keep sensitive source material within a controlled environment where possible and reduce unnecessary dependence on third-party document-processing services.

The Raspberry Pi is treated as an **edge ingestion / extraction component**, not as the primary large-model inference machine.

### Investigator Verification Gate

Before AI analysis, extracted document text can be reviewed by the investigator.

The investigator can:

- Compare extracted text with the original document
- Correct OCR mistakes
- Review names, numbers and other critical fields
- Add a verification note
- Approve the document for AI processing

This creates a clear separation between:

```text
Raw Source
   ↓
Extracted Content
   ↓
Human-Verified Content
```

### Two-Stage LLM Intelligence

Sudarshan Chakra uses two logically separate AI stages.

#### LLM-1 — Candidate Intelligence Extraction

The first model extracts:

- People
- Organisations
- Locations
- Vehicles
- Phones / devices
- Financial entities
- Events
- Candidate relationships

The output is stored as structured JSON.

LLM-1 does **not** directly create the final graph.

#### LLM-2 — Evidence Verification & Resolution

The second model receives:

```text
Original / Verified Evidence
+
LLM-1 Candidate JSON
```

It checks whether the proposed relationships are actually supported by the evidence.

Depending on the evidence, a candidate may be:

- Supported
- Partially supported
- Conflicting
- Insufficient
- Rejected

The model can also identify relationships that were missed during the first extraction pass.

---

## 4. Evidence-First Intelligence Model

A relationship in Sudarshan Chakra is treated as an **intelligence claim**, not simply a graph edge.

Conceptually:

```text
ENTITY A
   +
RELATIONSHIP
   +
ENTITY B
   +
TIME
   +
LOCATION
   +
SOURCE / EVIDENCE
   +
CONFIDENCE
   +
VERIFICATION STATUS
```

This allows an investigator to ask:

> **Why does this relationship exist?**

and then trace the relationship back to its supporting evidence.

This also allows the system to preserve uncertainty and conflicting information instead of forcing every candidate into a single unquestioned truth.

---

## 5. Context-Aware Entity Resolution

Matching names alone is not reliable enough for investigative analysis.

Sudarshan Chakra is designed to consider contextual signals such as:

- Time
- Location
- Source
- Event
- Alias / alternate naming
- Related entities

For example:

```text
Same Name
   ≠
Same Person
```

Entity resolution therefore aims to combine multiple signals while preserving ambiguity when the evidence is insufficient.

---

## 6. Knowledge Graph

Only validated intelligence is passed into the ontology and graph-construction stage.

The graph can connect:

```text
People
   ↕
Organisations
   ↕
Locations
   ↕
Vehicles
   ↕
Phones / Devices
   ↕
Events
   ↕
Financial Artifacts
   ↕
Cases
```

The investigator can then explore:

- Cross-case relationships
- Connected entities
- Event relationships
- Temporal patterns
- Geographic relationships
- Network structure
- Evidence behind individual relationships

### Important design principle

> **The LLM is not the database.**

The graph, evidence, provenance, entities, events and relationships remain structured and independently maintained.

---

## 7. Investigator Workflow

The intended investigator workflow is:

```text
SEARCH
  ↓
ENTITY PROFILE
  ↓
ENTITY RESOLUTION
  ↓
NETWORK GRAPH
  ↓
TIMELINE
  ↓
EVIDENCE
  ↓
PATTERN
  ↓
HYPOTHESIS
  ↓
VERIFY / REJECT / INVESTIGATE
```

The AI assists the investigator by surfacing relationships and patterns. It does not make a final determination of guilt or replace investigative or legal judgment.

---

## 8. Investigative Analytics

Once the evidence graph has been created, the platform can support analytical views such as:

### Network Analysis
- Relationship mapping
- Connected-component analysis
- Key-entity identification
- Cross-case network exploration

### Temporal Analysis
- Event timelines
- Time-based relationship analysis
- Sequence and consistency checks
- Temporal evolution of networks

### Geo-Spatial Analysis
- Location-linked relationships
- Movement and proximity context
- Event-location correlation

### Investigative Hypotheses

The system can generate **evidence-grounded investigative hypotheses** from the validated network.

These are intended to help investigators decide:

> **What should I investigate next?**

They are not automatically treated as confirmed facts.

---

## 9. Human-in-the-Loop Feedback

Sudarshan Chakra closes the loop after investigation.

Investigators can record:

- Correct relationships
- False positives
- Missed relationships
- Corrections
- Confirmed outcomes
- Additional evidence

These outcomes can be converted into supervised examples for future model improvement.

```text
MODEL OUTPUT
     ↓
INVESTIGATOR REVIEW
     ↓
GROUND TRUTH
     ↓
TRAINING DATA
     ↓
MODEL IMPROVEMENT
     ↓
BETTER FUTURE EXTRACTION / VERIFICATION
```

The objective is to improve the system from **real investigative outcomes**, rather than treating every model prediction as correct.

---

## 10. Technology Stack

### AI / ML

- **Qwen 3.5**
- LoRA / QLoRA fine-tuning
- QAT where required
- Natural Language Processing
- Entity and relationship extraction
- Evidence verification
- Entity resolution
- Contradiction detection

### Document Processing

- OCR / HTR
- Tesseract
- Text extraction
- Document preprocessing
- Structured-data parsers

### Backend

- Python
- FastAPI
- Uvicorn
- REST APIs
- Data-processing services

### Data & Intelligence Layer

- JSON
- Ontology
- Knowledge graph
- Graph analytics
- Temporal analysis
- Geo-spatial analysis

### Prototype Infrastructure

- Raspberry Pi-based edge OCR / HTR node
- Controlled inference server
- PostgreSQL / structured data storage
- Authentication / authorization
- Encrypted data handling
- Audit / evidence traceability

---

## 11. Model Training

The project uses domain-oriented investigative data to improve the ability of the language models to understand:

- Indian investigative terminology
- FIR-style language
- Entity types
- Relationship descriptions
- Events and investigative actions
- Aliases and contextual references

The current project work includes a collection of FIR / case documents and publicly available material used for model training and testing.

Model fine-tuning is treated as an engineering component of the system — not as proof of accuracy by itself.

### Training philosophy

```text
Domain Data
   ↓
Cleaning / Normalization
   ↓
Task-specific Examples
   ↓
LoRA / QLoRA Fine-tuning
   ↓
Validation
   ↓
Error Analysis
   ↓
Feedback-driven Improvement
```

---

## 12. Security & Privacy Principles

Because the system is intended for sensitive investigative workflows, security is treated as a design requirement rather than a marketing claim.

The architecture considers:

- Controlled deployment
- Local processing where appropriate
- Self-hosted / controlled AI inference
- Authentication
- Role-based access control
- Encryption
- Audit logs
- Evidence traceability
- Controlled storage
- Minimized external exposure of sensitive source data

The system does **not** claim:

- 100% security
- Zero risk
- Zero hallucination
- Perfect entity resolution
- Automatic determination of criminality

---

## 13. Current Prototype

The current prototype demonstrates the main investigative workflow:

```text
Case Creation
     ↓
Document Upload
     ↓
OCR / Text Extraction
     ↓
Investigator Review
     ↓
LLM Candidate Extraction
     ↓
Structured JSON
     ↓
LLM Verification
     ↓
Network Construction
     ↓
Investigator Analysis
     ↓
Feedback
```

The project has been tested with a collection of FIR / case documents containing combinations of:

- People and aliases
- Locations
- Organisations
- Vehicles
- Devices
- Financial artifacts
- Events
- Witnesses
- Investigative actions
- Case metadata

Not every document is expected to contain every entity type.

---

## 14. Research Foundation

The system builds on established work in criminal-network analysis, temporal networks, link prediction and visualization, while extending the workflow with evidence verification and provenance.

Selected references include:

1. **Xu, J.; Chen, H. (2005).**  
   *CrimeNet Explorer: A Framework for Criminal Network Analysis and Visualization.*  
   ACM Transactions on Information Systems.  
   https://doi.org/10.1145/1059981.1059984

2. **Ficara, A.; Fiumara, G.; Catanese, S.; De Meo, P.; Liu, S. (2022).**  
   *The Whole Is Greater than the Sum of the Parts: A Multilayer Approach on Criminal Networks.*  
   Future Internet, 14, 123.  
   https://doi.org/10.3390/fi14050123

3. **Lim et al. (2020).**  
   *Link Prediction in Time-Evolving Criminal Network With Deep Reinforcement Learning Technique.*  
   IEEE Access.  
   https://doi.org/10.1109/ACCESS.2019.2958873

4. **Ferrara, E.; De Meo, P.; Catanese, S.; Fiumara, G. (2014).**  
   *Visualizing Criminal Networks Reconstructed from Mobile Phone Records.*  
   https://arxiv.org/abs/1407.2837

5. **Calderoni, F.; Skillicorn, D. B.; Zheng, Q. (2014).**  
   *Inductive Discovery of Criminal Group Structure Using Spectral Embedding.*  
   https://doi.org/10.11610/isij.3102

6. **Cao, Y.; Zhang, (2026).**  
   *Social network analysis for crime prediction under social computing and deep learning technology.*  
   Scientific Reports.  
   https://doi.org/10.1038/s41598-025-34891-7

The project does not claim that ordinary knowledge graphs, network visualization, centrality analysis or temporal analysis are novel by themselves. The distinctive focus is the **evidence-validation layer before graph construction**, combined with contextual entity resolution and traceable intelligence claims.

---

## 15. What Makes Sudarshan Chakra Different?

### 1. Evidence-First
Every extracted relationship begins as a **candidate claim** rather than an automatic fact.

### 2. Two-Stage Validation
A second model independently checks the first model's output against the underlying evidence.

### 3. Context-Aware Resolution
Entity matching uses time, location, source and event context instead of relying only on names.

### 4. Traceable Intelligence Graph
Relationships retain their evidence, confidence and verification state.

### 5. Human Control
Investigators can confirm, reject, correct, merge, split and annotate intelligence.

---

## 16. What This Project Is Not

Sudarshan Chakra is **not**:

- An FIR chatbot
- A generic RAG application
- A system that automatically declares someone guilty
- A replacement for authorized government crime-data systems
- A claim of perfect AI reasoning
- A black-box graph generated directly by an LLM
- A requirement to use blockchain simply because the hackathon theme mentions blockchain

The system is intended as an **investigative analysis layer** that can complement existing authorized systems and workflows.

---

## 17. Roadmap

### Phase 1 — Prototype
- Core document ingestion
- OCR / HTR
- Investigator verification
- Candidate extraction
- Second-stage verification
- Knowledge graph
- Investigator workspace

### Phase 2 — Validation
- Larger and better-labelled datasets
- Systematic precision / recall evaluation
- Entity-resolution evaluation
- Relationship-verification benchmarking
- Security and performance testing

### Phase 3 — Controlled Pilot
- Controlled district-level deployment
- Integration with authorized data sources
- RBAC and audit hardening
- Operational feedback collection

### Phase 4 — Scale
- State-level deployment
- Additional language support
- Additional authorized data integrations
- Advanced temporal and network analytics

---

## 18. Responsible Use

This project is intended for **authorized investigative and analytical use**.

AI-generated relationships and hypotheses should be treated as decision-support information and must remain subject to human review, source verification, applicable law, and departmental procedures.

A graph connection alone is **not proof of criminal conduct**.

---

## 19. Project Status

**Status:** Working prototype / research project

**Hackathon:** Smart India Hackathon 2026

**Problem Statement:** SIH26189 — AI-Powered Criminal Network Analysis System

**Theme:** Blockchain & Cybersecurity

**Category:** Software

**Team:** Sudharshan Chakra

---

## 20. Core Architecture in One Line

> **Extract → Validate → Resolve → Connect → Investigate**

## Core Trust Principle

> **LLM output is not truth; source evidence determines what can be trusted.**

---

## License

This project is currently a research / hackathon prototype. Licensing and redistribution terms should be defined by the project team before public production use.
