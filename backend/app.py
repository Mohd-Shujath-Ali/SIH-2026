import os
import time
import base64
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# -------------------------------------------------------------------------
# Application Configuration & Database Setup
# -------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

DB_PATH = os.environ.get("DATABASE_URL", "sqlite:///criminal_network.db")
engine = create_engine(DB_PATH, connect_args={"check_same_thread": False})
Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# -------------------------------------------------------------------------
# SQLAlchemy Database Models
# -------------------------------------------------------------------------
class CaseModel(Base):
    __tablename__ = "cases"
    id = Column(String(64), primary_key=True, index=True)
    case_number = Column(String(64), unique=True, index=True)
    title = Column(String(256), nullable=False)
    department = Column(String(256), default="NCRB Central Intercept & Intelligence")
    description = Column(Text, default="")
    classification = Column(String(64), default="LAW ENFORCEMENT SENSITIVE")
    lead_investigator = Column(String(128), default="Special Investigator")
    status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

class DocumentModel(Base):
    __tablename__ = "documents"
    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), index=True, nullable=False)
    filename = Column(String(256), nullable=False)
    file_type = Column(String(64), default="OTHER")
    original_size = Column(String(64), default="1.2 MB")
    mime_type = Column(String(128), default="application/pdf")
    upload_date = Column(DateTime, default=datetime.utcnow)
    source_agency = Column(String(256), default="NCRB Ingestion Wing")
    requires_ocr = Column(Boolean, default=True)
    extraction_status = Column(String(32), default="COMPLETED")
    
    # Original file stored alongside raw extracted text
    original_file_path = Column(String(512), nullable=True)
    original_file_content = Column(Text, nullable=True)
    raw_extracted_text = Column(Text, nullable=True)
    
    # Mock RPi metadata
    rpi_device_name = Column(String(128), default="NCRB-RPI-NODE-04 (Raspberry Pi 4 Model B)")
    rpi_device_ip = Column(String(64), default="192.168.1.142:8000")
    ocr_engine = Column(String(128), default="TrOCR-Large-HTR + Tesseract-v5")
    ocr_latency_ms = Column(Integer, default=520)
    confidence_score = Column(Float, default=0.98)
    
    # Investigator Verification Gate
    verification_status = Column(String(32), default="PENDING")
    approved_text = Column(Text, nullable=True)
    verification_notes = Column(Text, nullable=True)
    verified_by = Column(String(128), nullable=True)
    verified_at = Column(DateTime, nullable=True)

Base.metadata.create_all(bind=engine)

# -------------------------------------------------------------------------
# Mock Raspberry Pi Text Extraction Service Logic
# -------------------------------------------------------------------------
def run_mock_rpi_extraction(filename: str, file_type: str, content_or_data: str = None) -> dict:
    """
    Simulates the Raspberry Pi edge device running TrOCR / Tesseract v5 OCR.
    Extracts high-fidelity police intelligence text based on document classification.
    """
    start_time = time.time()
    lower = filename.lower()
    
    extracted = ""
    if content_or_data and len(content_or_data) > 30 and not content_or_data.startswith("data:"):
        extracted = content_or_data
    elif "fir" in lower or file_type == "FIR":
        extracted = (
            "[GOVERNMENT OF INDIA - STATE POLICE CRIME BRANCH / NCRB]\n"
            "FIRST INFORMATION REPORT (Under Section 154 Cr.P.C.)\n"
            "FIR No: CR-784/2026/CB-SPL-CELL | Date: 14/02/2026 23:45 IST\n"
            "Police Station: Special Cell, Cyber & Narcotics Command, Lodhi Colony\n\n"
            "SUSPECTS & ACCUSED PERSONS:\n"
            "1. Vikrant 'Vicky' Sharma (The Broker), Age 39, GK-II, New Delhi. Mobile: +91-98110-44219.\n"
            "2. Kabir Al-Mansoor (The Sheikh), Operating syndicate base from UAE/Dubai. Phone: +971-50-842-1982.\n"
            "3. Sunita 'Rani' Deshmukh, Managing Director, Omex Global Logistics Pvt Ltd, Mumbai.\n"
            "4. Tariq 'Chhotu' Merchant, Courier. Vehicle: Toyota Fortuner DL-3C-AZ-9901.\n\n"
            "INCIDENT & SEIZURES:\n"
            "Covert intercept at IGI Airport Cargo Terminal 3 seized 4.2 kg synthetic contraband,\n"
            "1x Glock-19 9mm pistol (Serial: G19-AUT-78219), Rs 48,50,000 cash, and Hawala ledger VK-90."
        )
    elif "cdr" in lower or file_type == "CDR":
        extracted = (
            "[CALL DETAIL RECORD (CDR) & FORENSIC LOG]\n"
            "Target MSISDN: +91-98110-44219 (Vikrant Sharma) | IMEI: 863920192849102\n"
            "Period: 01/02/2026 to 15/02/2026\n\n"
            "INTERCEPTS:\n"
            "1. 2026-02-10 18:22:10 -> Outgoing to Sunita Deshmukh (+91-98200-51402) - Duration 412s.\n"
            "2. 2026-02-10 20:15:40 -> Incoming VoIP from Kabir Al-Mansoor (+971-50-842-1982) - Duration 184s.\n"
            "3. 2026-02-11 02:40:19 -> SMS to Tariq Merchant: 'Package arrives Gate 6. DL-3C-AZ-9901 standby.'\n"
            "Co-location confirmed at Mahipalpur Safehouse Warehouse #3 on 12/02/2026."
        )
    elif "financial" in lower or file_type == "FINANCIAL":
        extracted = (
            "[FINANCIAL INTELLIGENCE UNIT (FIU-IND) SUSPICIOUS TRANSACTION REPORT]\n"
            "Reference: FIU/STR/2026/09218 | Subject: Omex Global Logistics (Director: Sunita Deshmukh)\n"
            "Account #50200084192011 received Rs 3.25 Crores across 14 split RTGS transfers from shell entities.\n"
            "Layered Rs 1.80 Crores to Crypto OTC wallet 0x71C94... and cash bearer withdrawals by Tariq Merchant.\n"
            "Cross-border remittances to Al-Saeed Trading FZE Dubai (Beneficiary: Kabir Al-Mansoor)."
        )
    else:
        extracted = (
            f"[EXTRACTED INTELLIGENCE - RASPBERRY PI OCR NODE]\n"
            f"Source Document: {filename}\n"
            f"Category: {file_type}\n"
            "Evidence records logged under Operation Syndicate Sentinel."
        )

    latency = int((time.time() - start_time) * 1000) + 480
    
    return {
        "status": "COMPLETED",
        "raw_extracted_text": extracted,
        "metadata": {
            "rpi_device": "NCRB-RPI-NODE-04 (Raspberry Pi 4 Model B 8GB)",
            "device_ip": "192.168.1.142:8000",
            "ocr_engine": "TrOCR-Large-HTR + Tesseract-v5-Devanagari/Latin",
            "latency_ms": latency,
            "confidence_score": 0.98,
            "char_count": len(extracted),
            "word_count": len(extracted.split()),
            "timestamp": datetime.utcnow().isoformat()
        }
    }

# -------------------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "service": "AI-Powered Criminal Network Analysis Backend",
        "framework": "Flask / Python 3.11",
        "mock_rpi_status": "ONLINE",
        "timestamp": datetime.utcnow().isoformat()
    })

@app.route("/api/mock-rpi/extract", methods=["POST"])
def mock_rpi_extract():
    data = request.get_json() or {}
    filename = data.get("filename", "Evidence_Doc.pdf")
    file_type = data.get("fileType", "FIR")
    content = data.get("base64OrContent", "")
    
    result = run_mock_rpi_extraction(filename, file_type, content)
    return jsonify(result)

@app.route("/api/cases", methods=["GET"])
def get_cases():
    db = SessionLocal()
    try:
        cases = db.query(CaseModel).all()
        return jsonify([{
            "id": c.id,
            "caseNumber": c.case_number,
            "title": c.title,
            "department": c.department,
            "description": c.description,
            "classification": c.classification,
            "leadInvestigator": c.lead_investigator,
            "status": c.status,
            "dateOpened": c.created_at.strftime("%Y-%m-%d")
        } for c in cases])
    finally:
        db.close()

@app.route("/api/cases/<case_id>/documents/upload", methods=["POST"])
def upload_document(case_id):
    data = request.get_json() or {}
    filename = data.get("filename")
    if not filename:
        return jsonify({"error": "Filename is required"}), 400

    file_type = data.get("fileType", "FIR")
    source_agency = data.get("sourceAgency", "NCRB Direct Ingest")
    original_size = data.get("originalSize", "1.4 MB")
    mime_type = data.get("mimeType", "application/pdf")
    raw_content = data.get("rawContent", "")
    file_data_url = data.get("fileDataUrl", "")

    # Invoke Mock Raspberry Pi Text Extraction Service
    extraction = run_mock_rpi_extraction(filename, file_type, raw_content or file_data_url)

    db = SessionLocal()
    try:
        doc_id = f"doc-{int(time.time() * 1000)}"
        new_doc = DocumentModel(
            id=doc_id,
            case_id=case_id,
            filename=filename,
            file_type=file_type,
            original_size=original_size,
            mime_type=mime_type,
            source_agency=source_agency,
            requires_ocr=True,
            extraction_status="COMPLETED",
            original_file_content=raw_content or file_data_url or None,
            raw_extracted_text=extraction["raw_extracted_text"],
            rpi_device_name=extraction["metadata"]["rpi_device"],
            rpi_device_ip=extraction["metadata"]["device_ip"],
            ocr_engine=extraction["metadata"]["ocr_engine"],
            ocr_latency_ms=extraction["metadata"]["latency_ms"],
            confidence_score=extraction["metadata"]["confidence_score"],
            verification_status="PENDING" # Gate for investigator review
        )
        db.add(new_doc)
        db.commit()

        return jsonify({
            "id": new_doc.id,
            "caseId": new_doc.case_id,
            "filename": new_doc.filename,
            "fileType": new_doc.file_type,
            "originalSize": new_doc.original_size,
            "sourceAgency": new_doc.source_agency,
            "extractionStatus": new_doc.extraction_status,
            "rawExtractedText": new_doc.raw_extracted_text,
            "ocrMetadata": {
                "rpiDevice": new_doc.rpi_device_name,
                "rpiDeviceIp": new_doc.rpi_device_ip,
                "engine": new_doc.ocr_engine,
                "latencyMs": new_doc.ocr_latency_ms,
                "confidenceScore": new_doc.confidence_score,
                "charCount": len(new_doc.raw_extracted_text or "")
            },
            "verificationStatus": new_doc.verification_status
        }), 201
    finally:
        db.close()

@app.route("/api/cases/<case_id>/documents/<doc_id>/verify", methods=["POST"])
def verify_document(case_id, doc_id):
    data = request.get_json() or {}
    status = data.get("status", "APPROVED")
    approved_text = data.get("approvedText", "")
    notes = data.get("notes", "")
    verified_by = data.get("verifiedBy", "Duty Officer")

    db = SessionLocal()
    try:
        doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id, DocumentModel.case_id == case_id).first()
        if not doc:
            return jsonify({"error": "Document not found"}), 404

        doc.verification_status = status
        doc.approved_text = approved_text if status == "APPROVED" else None
        doc.verification_notes = notes
        doc.verified_by = verified_by
        doc.verified_at = datetime.utcnow()
        db.commit()

        return jsonify({
            "id": doc.id,
            "verificationStatus": doc.verification_status,
            "approvedText": doc.approved_text,
            "verificationNotes": doc.verification_notes,
            "verifiedBy": doc.verified_by,
            "verifiedAt": doc.verified_at.isoformat()
        })
    finally:
        db.close()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
