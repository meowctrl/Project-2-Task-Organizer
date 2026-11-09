import re
from datetime import date, datetime, timezone
from functools import wraps

from flask import Blueprint, current_app, g, jsonify, request, session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.security import check_password_hash, generate_password_hash

from .models import ProductivityReport, Task, TaskList, User, db

api = Blueprint("api", __name__, url_prefix="/api")
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user_id = session.get("user_id")
        user = db.session.get(User, user_id) if user_id else None
        if user is None:
            session.clear()
            return jsonify(error="Please sign in to continue."), 401
        g.current_user = user
        return view(*args, **kwargs)

    return wrapped


def valid_title(value):
    return isinstance(value, str) and 1 <= len(value.strip()) <= 120


def parse_due_date(value):
    if value in (None, ""):
        return None
    if not isinstance(value, str):
        raise ValueError("Enter a valid due date.")
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as error:
        raise ValueError("Enter a valid due date.") from error
    if parsed.isoformat() != value:
        raise ValueError("Enter a valid due date.")
    return parsed


def owned_list(list_id, user_id):
    return TaskList.query.filter_by(id=list_id, user_id=user_id).first()


def owned_task(task_id, user_id):
    return Task.query.filter_by(id=task_id, user_id=user_id).first()


@api.errorhandler(IntegrityError)
def handle_integrity_error(error):
    db.session.rollback()
    return jsonify(error="That value conflicts with an existing record."), 409


@api.errorhandler(SQLAlchemyError)
def handle_database_error(error):
    db.session.rollback()
    current_app.logger.exception("Database request failed", exc_info=error)
    return jsonify(error="The database request could not be completed."), 500


@api.get("/auth/me")
def get_current_user():
    user = db.session.get(User, session.get("user_id"))
    if user is None:
        session.clear()
    return jsonify(user=user.public_dict() if user else None)


@api.post("/auth/signup")
def signup():
    data = body()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    name = name.strip() if isinstance(name, str) else ""
    email = email.strip().lower() if isinstance(email, str) else ""
    password = password if isinstance(password, str) else ""

    if not 2 <= len(name) <= 50:
        return jsonify(error="Name must be between 2 and 50 characters."), 400
    if not EMAIL_PATTERN.match(email):
        return jsonify(error="Enter a valid email address."), 400
    if len(password) < 8:
        return jsonify(error="Password must be at least 8 characters."), 400
    if User.query.filter_by(email=email).first():
        return jsonify(error="An account with this email already exists."), 409

    user = User(name=name, email=email, password_hash=generate_password_hash(password))
    inbox = TaskList(user=user, name="Inbox", color="#78947e")
    personal = TaskList(user=user, name="Personal", color="#d38b72")
    db.session.add_all([user, inbox, personal])
    db.session.flush()
    db.session.add(Task(
        user=user,
        task_list=inbox,
        title="Welcome to your new space",
        note="Add a task or make another list to get started.",
    ))
    db.session.commit()
    session.clear()
    session["user_id"] = user.id
    return jsonify(user=user.public_dict()), 201


@api.post("/auth/login")
def login():
    data = body()
    email = data.get("email")
    password = data.get("password")
    email = email.strip().lower() if isinstance(email, str) else ""
    password = password if isinstance(password, str) else ""
    user = User.query.filter_by(email=email).first()
    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify(error="Email or password is incorrect."), 401
    session.clear()
    session["user_id"] = user.id
    return jsonify(user=user.public_dict())


@api.post("/auth/logout")
def logout():
    session.clear()
    return jsonify(ok=True)


@api.get("/lists")
@login_required
def get_lists():
    lists = TaskList.query.filter_by(user_id=g.current_user.id).order_by(TaskList.created_at).all()
    return jsonify(lists=[item.to_dict() for item in lists])


@api.post("/lists")
@login_required
def create_list():
    data = body()
    name = data.get("name")
    name = name.strip() if isinstance(name, str) else ""
    if not 1 <= len(name) <= 32:
        return jsonify(error="List name must be between 1 and 32 characters."), 400
    if any(item.name.casefold() == name.casefold() for item in g.current_user.lists):
        return jsonify(error="A list with that name already exists."), 409

    item = TaskList(
        user_id=g.current_user.id,
        name=name,
        color=data.get("color") if isinstance(data.get("color"), str) else "#78947e",
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(list=item.to_dict()), 201


@api.patch("/lists/<string:list_id>")
@login_required
def rename_list(list_id):
    item = owned_list(list_id, g.current_user.id)
    if item is None:
        return jsonify(error="List not found."), 404
    data = body()
    name = data.get("name")
    name = name.strip() if isinstance(name, str) else ""
    if not 1 <= len(name) <= 32:
        return jsonify(error="List name must be between 1 and 32 characters."), 400
    if any(other.id != item.id and other.name.casefold() == name.casefold() for other in g.current_user.lists):
        return jsonify(error="A list with that name already exists."), 409
    item.name = name
    db.session.commit()
    return jsonify(list=item.to_dict())


@api.delete("/lists/<string:list_id>")
@login_required
def delete_list(list_id):
    item = owned_list(list_id, g.current_user.id)
    if item is None:
        return jsonify(error="List not found."), 404
    if len(g.current_user.lists) == 1:
        return jsonify(error="Keep at least one list in your space."), 400
    db.session.delete(item)
    db.session.commit()
    return jsonify(ok=True)


@api.get("/tasks")
@login_required
def get_tasks():
    query = Task.query.filter_by(user_id=g.current_user.id)
    list_id = request.args.get("listId")
    if list_id:
        query = query.filter_by(list_id=list_id)
    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify(tasks=[task.to_dict() for task in tasks])


@api.post("/tasks")
@login_required
def create_task():
    data = body()
    title = data.get("title")
    if not valid_title(title):
        return jsonify(error="Task title must be between 1 and 120 characters."), 400
    note = data.get("note", "")
    if not isinstance(note, str) or len(note.strip()) > 500:
        return jsonify(error="Task notes must be 500 characters or fewer."), 400
    try:
        due_date = parse_due_date(data.get("dueDate"))
    except ValueError as error:
        return jsonify(error=str(error)), 400
    item = owned_list(data.get("listId"), g.current_user.id)
    if item is None:
        return jsonify(error="Choose a valid list for this task."), 400

    task = Task(
        user_id=g.current_user.id,
        task_list=item,
        title=title.strip(),
        note=note.strip(),
        due_date=due_date,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task=task.to_dict()), 201


@api.patch("/tasks/<string:task_id>")
@login_required
def update_task(task_id):
    task = owned_task(task_id, g.current_user.id)
    if task is None:
        return jsonify(error="Task not found."), 404
    data = body()

    if "title" in data:
        if not valid_title(data["title"]):
            return jsonify(error="Task title must be between 1 and 120 characters."), 400
        task.title = data["title"].strip()
    if "note" in data:
        if not isinstance(data["note"], str) or len(data["note"].strip()) > 500:
            return jsonify(error="Task notes must be 500 characters or fewer."), 400
        task.note = data["note"].strip()
    if "dueDate" in data:
        try:
            task.due_date = parse_due_date(data["dueDate"])
        except ValueError as error:
            return jsonify(error=str(error)), 400
    if "completed" in data:
        if not isinstance(data["completed"], bool):
            return jsonify(error="Completed must be true or false."), 400
        task.completed = data["completed"]
    if "listId" in data:
        item = owned_list(data["listId"], g.current_user.id)
        if item is None:
            return jsonify(error="Choose a valid list for this task."), 400
        task.task_list = item

    db.session.commit()
    return jsonify(task=task.to_dict())


@api.delete("/tasks/<string:task_id>")
@login_required
def delete_task(task_id):
    task = owned_task(task_id, g.current_user.id)
    if task is None:
        return jsonify(error="Task not found."), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify(ok=True)


@api.get("/reports")
@login_required
def get_reports():
    reports = ProductivityReport.query.filter_by(user_id=g.current_user.id).order_by(ProductivityReport.created_at.desc()).all()
    return jsonify(reports=[report.to_dict() for report in reports])


@api.post("/reports")
@login_required
def create_report():
    tasks = Task.query.filter_by(user_id=g.current_user.id).all()
    today = date.today()
    response = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalTasks": len(tasks),
        "completedTasks": sum(task.completed for task in tasks),
        "openTasks": sum(not task.completed for task in tasks),
        "dueToday": sum(not task.completed and task.due_date == today for task in tasks),
        "lists": [
            {
                "id": item.id,
                "name": item.name,
                "openTasks": sum(not task.completed for task in item.tasks),
            }
            for item in g.current_user.lists
        ],
    }
    report = ProductivityReport(
        user_id=g.current_user.id,
        title=f"Daily recap {today.isoformat()}",
        response=response,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report=report.to_dict()), 201


