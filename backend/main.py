from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()
@app.get("/")
def read_root():
    return {"message": "SignBox API running"}
fake_documents = [
    {"id": 1, "title": "Freelance Contract.pdf", "status": "Draft"},
    {"id": 2, "title": "NDA Agreement.pdf", "status": "Pending"},
]
@app.get("/documents")
def get_documents():
    return fake_documents
@app.get("/documents/{document_id}")
def get_document(document_id: int):
    for doc in fake_documents:
        if doc["id"] == document_id:
            return doc
    return {"error": "Document not found"}
class DocumentCreate(BaseModel):
    title: str
@app.post("/documents")
def create_document(document: DocumentCreate):
    new_doc = {
        "id": len(fake_documents) + 1,
        "title": document.title,
        "status": "Draft"
    }
    fake_documents.append(new_doc)
    return new_doc