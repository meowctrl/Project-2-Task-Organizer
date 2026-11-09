from datetime import date, datetime, timezone
from uuid import uuid4

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import UniqueConstraint

db = SQLAlchemy()


def new_id():
    return str(uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=new_id)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    lists = db.relationship("TaskList", back_populates="user", cascade="all, delete-orphan")
    tasks = db.relationship("Task", back_populates="user", cascade="all, delete-orphan")
    reports = db.relationship("ProductivityReport", back_populates="user", cascade="all, delete-orphan")

    def public_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email}


class TaskList(db.Model):
    __tablename__ = "task_lists"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_task_lists_user_name"),)

    id = db.Column(db.String(36), primary_key=True, default=new_id)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(32, collation="NOCASE"), nullable=False)
    color = db.Column(db.String(7), nullable=False, default="#78947e")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    user = db.relationship("User", back_populates="lists")
    tasks = db.relationship("Task", back_populates="task_list", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "name": self.name,
            "color": self.color,
            "createdAt": self.created_at.isoformat(),
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.String(36), primary_key=True, default=new_id)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    list_id = db.Column(db.String(36), db.ForeignKey("task_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    note = db.Column(db.String(500), nullable=False, default="")
    due_date = db.Column(db.Date, nullable=True)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    user = db.relationship("User", back_populates="tasks")
    task_list = db.relationship("TaskList", back_populates="tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "listId": self.list_id,
            "title": self.title,
            "note": self.note,
            "dueDate": self.due_date.isoformat() if isinstance(self.due_date, date) else "",
            "completed": self.completed,
            "createdAt": self.created_at.isoformat(),
        }


class ProductivityReport(db.Model):
    __tablename__ = "productivity_reports"

    id = db.Column(db.String(36), primary_key=True, default=new_id)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(80), nullable=False)
    response = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    user = db.relationship("User", back_populates="reports")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "title": self.title,
            "response": self.response,
            "createdAt": self.created_at.isoformat(),
        }