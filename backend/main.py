from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import engine, Base, get_db
import models
from auth import hash_password, verify_password
from auth import create_access_token, decode_access_token


Base.metadata.create_all(bind=engine)

app = FastAPI()


# =========================
# CORS CONFIGURATION
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# ROOT API
# =========================

@app.get("/")
def read_root():
    return {"message": "SignBox API running"}


# =========================
# DOCUMENT APIs
# =========================

@app.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    return db.query(models.Document).all()


@app.get("/documents/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return doc


# TODO: restrict access — owner via JWT, signer via signing token (Day 16)

@app.get("/documents/{document_id}/file")
def get_document_file(
    document_id: int,
    db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id
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


class DocumentCreate(BaseModel):
    title: str
    file_path: str
    owner_id: int


@app.post("/documents")
def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db)
):
    new_doc = models.Document(
        title=document.title,
        file_path=document.file_path,
        owner_id=document.owner_id
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return new_doc


# =========================
# AUTH APIs
# =========================

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


# =========================
# AUTHENTICATION
# =========================

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


@app.get("/auth/me")
def get_me(
    current_user: models.User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email
    }