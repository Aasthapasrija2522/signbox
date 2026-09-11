
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import os

from database import engine, Base, get_db
import models

from auth import hash_password, verify_password
from auth import create_access_token, decode_access_token

from pdf_utils import stamp_signature


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# DIRECTORIES
# =========================================================

SIGNED_DIR = "signed"
UPLOAD_DIR = "uploads"

os.makedirs(SIGNED_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI()


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROOT API
# =========================================================

@app.get("/")
def read_root():
    return {
        "message": "SignBox API running"
    }


# =========================================================
# AUTHENTICATION
# =========================================================

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = int(payload.get("sub"))

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


# =========================================================
# REGISTER
# =========================================================

class UserCreate(BaseModel):
    email: str
    password: str


@app.post("/auth/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = models.User(
        email=user.email,
        hashed_password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "email": new_user.email
    }


# =========================================================
# LOGIN
# =========================================================

class UserLogin(BaseModel):
    email: str
    password: str


@app.post("/auth/login")
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.email == credentials.email
    ).first()

    if not user or not verify_password(
        credentials.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "sub": str(user.id)
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# =========================================================
# CURRENT USER
# =========================================================

@app.get("/auth/me")
def get_me(
    current_user: models.User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email
    }


# =========================================================
# GET CURRENT USER'S DOCUMENTS
# =========================================================

@app.get("/documents")
def get_documents(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id
    ).all()

    return documents


# =========================================================
# UPLOAD DOCUMENT
# =========================================================

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # Give every uploaded file a user-specific filename
    # so different users cannot overwrite files having
    # the same original filename.
    safe_filename = f"{current_user.id}_{file.filename}"

    file_path = os.path.join(
        UPLOAD_DIR,
        safe_filename
    )

    contents = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    new_doc = models.Document(
        title=file.filename,
        file_path=file_path,
        owner_id=current_user.id
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    print("====================================")
    print("DOCUMENT UPLOADED")
    print("DOCUMENT ID:", new_doc.id)
    print("FILE:", file.filename)
    print("OWNER:", current_user.id)
    print("====================================")

    return {
        "message": "Document uploaded successfully",
        "document": new_doc
    }


# =========================================================
# CREATE DOCUMENT
# =========================================================

class DocumentCreate(BaseModel):
    title: str
    file_path: str


@app.post("/documents")
def create_document(
    document: DocumentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_doc = models.Document(
        title=document.title,
        file_path=document.file_path,
        owner_id=current_user.id
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return new_doc


# =========================================================
# GET SINGLE DOCUMENT
# =========================================================

@app.get("/documents/{document_id}")
def get_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return doc


# =========================================================
# GET DOCUMENT PDF
# =========================================================

@app.get("/documents/{document_id}/file")
def get_document_file(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return FileResponse(
        doc.file_path,
        media_type="application/pdf"
    )


# =========================================================
# CREATE SIGNING REQUEST
# =========================================================

class SigningRequestCreate(BaseModel):
    signer_email: str


@app.post("/documents/{document_id}/signing-request")
def create_signing_request(
    document_id: int,
    request_data: SigningRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    print("====================================")
    print("DOCUMENT OWNER:", doc.owner_id)
    print("CURRENT USER:", current_user.id)
    print("====================================")

    new_request = models.SigningRequest(
        document_id=document_id,
        signer_email=request_data.signer_email
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    doc.status = "Pending"

    db.commit()

    print("SIGNING REQUEST CREATED:", new_request.id)
    print("SIGNING TOKEN:", new_request.token)

    return {
        "signing_request_id": new_request.id,
        "signing_link": (
            f"http://localhost:5173/sign/{new_request.token}"
        )
    }


# =========================================================
# GET SIGNING INFORMATION
# =========================================================

@app.get("/sign/{token}")
def get_signing_info(
    token: str,
    db: Session = Depends(get_db)
):

    signing_request = db.query(
        models.SigningRequest
    ).filter(
        models.SigningRequest.token == token
    ).first()

    if not signing_request:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired signing link"
        )

    document = db.query(
        models.Document
    ).filter(
        models.Document.id == signing_request.document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if signing_request.status == "Pending":
        signing_request.status = "Viewed"
        db.commit()

    print(
        "SIGNING REQUEST STATUS:",
        signing_request.status
    )

    return {
        "document_title": document.title,
        "status": signing_request.status,
        "signer_email": signing_request.signer_email
    }


# =========================================================
# GET SIGNING PDF
# =========================================================

@app.get("/sign/{token}/file")
def get_signing_file(
    token: str,
    db: Session = Depends(get_db)
):

    signing_request = db.query(
        models.SigningRequest
    ).filter(
        models.SigningRequest.token == token
    ).first()

    if not signing_request:
        raise HTTPException(
            status_code=404,
            detail="Invalid signing link"
        )

    document = db.query(
        models.Document
    ).filter(
        models.Document.id == signing_request.document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return FileResponse(
        document.file_path,
        media_type="application/pdf"
    )


# =========================================================
# SUBMIT SIGNATURE
# =========================================================

class SignatureSubmit(BaseModel):
    image_data: str


@app.post("/sign/{token}")
def submit_signature(
    token: str,
    signature: SignatureSubmit,
    db: Session = Depends(get_db)
):

    signing_request = db.query(
        models.SigningRequest
    ).filter(
        models.SigningRequest.token == token
    ).first()

    if not signing_request:
        raise HTTPException(
            status_code=404,
            detail="Invalid signing link"
        )

    document = db.query(
        models.Document
    ).filter(
        models.Document.id == signing_request.document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if signing_request.status == "Signed":
        raise HTTPException(
            status_code=400,
            detail="Document already signed"
        )

    if not signature.image_data:
        raise HTTPException(
            status_code=400,
            detail="Signature is required"
        )

    print("====================================")
    print("SIGNATURE RECEIVED")
    print("SIGNING REQUEST:", signing_request.id)
    print("DOCUMENT:", document.id)
    print("DOCUMENT OWNER:", document.owner_id)
    print("====================================")

    new_signature = models.Signature(
        signing_request_id=signing_request.id,
        image_data=signature.image_data
    )

    db.add(new_signature)
    db.flush()

    # =====================================================
    # TEMPORARY TEST POSITION
    # Signature placed on page 1 at bottom-left
    # =====================================================

    signed_output_path = (
        f"{SIGNED_DIR}/signed_{document.id}.pdf"
    )

    stamp_signature(
        original_pdf_path=document.file_path,
        image_data=new_signature.image_data,
        page_number=1,
        x=50,
        y=50,
        output_path=signed_output_path
    )

    document.signed_file_path = signed_output_path

    signing_request.status = "Signed"
    document.status = "Signed"

    db.commit()

    print("SIGNED PDF CREATED:", signed_output_path)
    print("DOCUMENT STATUS: Signed")
    print("SIGNING REQUEST STATUS: Signed")

    return {
        "message": "Document signed successfully",
        "status": "Signed"
    }


# =========================================================
# DOWNLOAD SIGNED PDF
# =========================================================

@app.get("/documents/{document_id}/signed-file")
def get_signed_file(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.owner_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if not doc.signed_file_path:
        raise HTTPException(
            status_code=400,
            detail="Document has not been signed yet"
        )

    if not os.path.exists(doc.signed_file_path):
        raise HTTPException(
            status_code=404,
            detail="Signed PDF file not found"
        )

    return FileResponse(
        doc.signed_file_path,
        media_type="application/pdf",
        filename=f"{doc.title}_signed.pdf"
    )

