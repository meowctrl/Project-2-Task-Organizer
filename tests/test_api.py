import unittest

from sqlalchemy import inspect

from server.app import create_app
from server.models import ProductivityReport, db


class OrganizerApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            "TESTING": True,
            "SECRET_KEY": "test-secret",
            "SQLALCHEMY_DATABASE_URI": "sqlite://",
        })
        self.context = self.app.app_context()
        self.context.push()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def signup(self, email="alex@example.test"):
        return self.client.post("/api/auth/signup", json={
            "name": "Alex Morgan",
            "email": email,
            "password": "long-password-123",
        })

    def test_database_has_user_list_and_task_tables(self):
        self.assertTrue({"users", "task_lists", "tasks", "productivity_reports"}.issubset(inspect(db.engine).get_table_names()))

    def test_generated_report_is_persisted_and_readable(self):
        self.assertEqual(self.signup().status_code, 201)
        generated = self.client.post("/api/reports")
        self.assertEqual(generated.status_code, 201)
        report = generated.json["report"]
        report_id = report["id"]
        self.assertEqual(report["response"]["totalTasks"], 1)
        self.assertEqual(report["response"]["openTasks"], 1)

        stored = db.session.get(ProductivityReport, report_id)
        self.assertIsNotNone(stored)
        self.assertEqual(stored.response, report["response"])
        self.assertEqual(self.client.get("/api/reports").json["reports"][0]["id"], report_id)

    def test_task_and_list_crud_validation_and_cascade(self):
        self.assertEqual(self.signup().status_code, 201)
        lists = self.client.get("/api/lists").json["lists"]
        inbox_id = lists[0]["id"]
        personal_id = lists[1]["id"]

        duplicate = self.client.post("/api/lists", json={"name": "inbox"})
        self.assertEqual(duplicate.status_code, 409)

        project = self.client.post("/api/lists", json={"name": "Projects"})
        self.assertEqual(project.status_code, 201)
        project_id = project.json["list"]["id"]
        renamed = self.client.patch(f"/api/lists/{project_id}", json={"name": "Planning"})
        self.assertEqual(renamed.status_code, 200)
        self.assertEqual(renamed.json["list"]["name"], "Planning")
        task_response = self.client.post("/api/tasks", json={
            "title": "Prepare a draft",
            "listId": project_id,
            "dueDate": "2026-11-12",
        })
        self.assertEqual(task_response.status_code, 201)
        task_id = task_response.json["task"]["id"]

        invalid_date = self.client.post("/api/tasks", json={
            "title": "Invalid date",
            "listId": inbox_id,
            "dueDate": "2026-02-31",
        })
        self.assertEqual(invalid_date.status_code, 400)

        disposable_task = self.client.post("/api/tasks", json={
            "title": "Delete this task",
            "listId": inbox_id,
        }).json["task"]["id"]
        self.assertEqual(self.client.delete(f"/api/tasks/{disposable_task}").status_code, 200)
        self.assertEqual(self.client.delete(f"/api/tasks/{disposable_task}").status_code, 404)

        updated = self.client.patch(f"/api/tasks/{task_id}", json={
            "completed": True,
            "note": "Ready for review",
        })
        self.assertEqual(updated.status_code, 200)
        self.assertTrue(updated.json["task"]["completed"])
        self.assertEqual(updated.json["task"]["note"], "Ready for review")

        self.assertEqual(self.client.delete(f"/api/lists/{project_id}").status_code, 200)
        remaining_tasks = self.client.get("/api/tasks").json["tasks"]
        self.assertNotIn(task_id, {task["id"] for task in remaining_tasks})
        self.assertEqual(len(remaining_tasks), 1)
        self.assertEqual(self.client.delete(f"/api/lists/{personal_id}").status_code, 200)
        self.assertEqual(self.client.delete(f"/api/lists/{inbox_id}").status_code, 400)

    def test_sessions_and_resource_ownership(self):
        self.assertEqual(self.client.get("/api/lists").status_code, 401)
        self.signup()
        task_id = self.client.get("/api/tasks").json["tasks"][0]["id"]

        self.assertEqual(self.client.post("/api/auth/logout").status_code, 200)
        login = self.client.post("/api/auth/login", json={
            "email": "alex@example.test",
            "password": "long-password-123",
        })
        self.assertEqual(login.status_code, 200)
        self.assertEqual(self.client.post("/api/auth/logout").status_code, 200)
        self.signup("sam@example.test")
        self.assertEqual(self.client.get("/api/tasks").json["tasks"][0]["title"], "Welcome to your new space")
        self.assertEqual(self.client.patch(f"/api/tasks/{task_id}", json={"completed": True}).status_code, 404)

    def test_configured_origin_can_use_cookie_credentials(self):
        response = self.client.options("/api/tasks", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        })
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173")
        self.assertEqual(response.headers.get("Access-Control-Allow-Credentials"), "true")


if __name__ == "__main__":
    unittest.main()