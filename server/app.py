import os
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from .api import api
from .models import db


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    production = os.environ.get("APP_ENV") == "production"
    secret_key = os.environ.get("SECRET_KEY")
    if production and not secret_key:
        raise RuntimeError("Set SECRET_KEY before starting the API in production.")

    same_site = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
    secure_cookie = production or os.environ.get("SESSION_COOKIE_SECURE") == "1"
    if same_site.lower() == "none" and not secure_cookie:
        raise RuntimeError("SameSite=None requires secure cookies and HTTPS.")

    app.config.from_mapping(
        SECRET_KEY=secret_key or "local-development-secret-change-before-deploying",
        SQLALCHEMY_DATABASE_URI=os.environ.get("DATABASE_URL", "sqlite:///daymark.sqlite3"),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        MAX_CONTENT_LENGTH=32 * 1024,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE=same_site,
        SESSION_COOKIE_SECURE=secure_cookie,
    )
    if test_config:
        app.config.update(test_config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    origins = [
        origin.strip()
        for origin in os.environ.get("CLIENT_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)
    db.init_app(app)
    app.register_blueprint(api)

    @app.errorhandler(404)
    def handle_not_found(error):
        if request.path.startswith("/api/"):
            return jsonify(error="Endpoint not found."), 404
        return error

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        if isinstance(error, HTTPException):
            return error
        app.logger.exception("Unhandled API error", exc_info=error)
        return jsonify(error="Something went wrong. Please try again."), 500

    with app.app_context():
        db.create_all()

    return app