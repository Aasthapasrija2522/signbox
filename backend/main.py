from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models


Base.metadata.create_all(bind=engine)

app = FastAPI()


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "SignBox API running"}


@app.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    return db.query(models.Document).all()


@app.get("/documents/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return doc


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