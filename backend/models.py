from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from database import Base
import secrets


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)

    # NEW
    signed_file_path = Column(String, nullable=True)

    status = Column(String, default="Draft")
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class SigningRequest(Base):
    __tablename__ = "signing_requests"

    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    signer_email = Column(String, nullable=False)

    token = Column(
        String,
        unique=True,
        nullable=False,
        default=lambda: secrets.token_urlsafe(32)
    )

    status = Column(String, default="Pending")

    signature_page = Column(Integer, default=1)
    signature_x = Column(Integer, default=100)
    signature_y = Column(Integer, default=50)

    created_at = Column(DateTime, default=datetime.utcnow)


class Signature(Base):
    __tablename__ = "signatures"

    id = Column(Integer, primary_key=True)
    signing_request_id = Column(
        Integer,
        ForeignKey("signing_requests.id"),
        nullable=False
    )
    image_data = Column(String, nullable=False)
    signed_at = Column(DateTime, default=datetime.utcnow)