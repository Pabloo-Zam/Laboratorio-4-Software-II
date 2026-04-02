"""Modulo para creacion y publicacion de tareas en 
un sistema de gestion de tareas universitarias pruebas"""
from __future__ import annotations

from datetime import date, datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS

from db import get_conn, init_db

app = Flask(__name__)
CORS(app)

init_db()


def get_role() -> str:
    """
    Rol simple por header para el laboratorio:
    X-Role: teacher | student
    """
    return (request.headers.get("X-Role") or "student").strip().lower()


def parse_date_yyyy_mm_dd(value: str) -> date | None:
    """Convierte un string YYYY-MM-DD en un objeto date."""
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def task_row_to_dict(row) -> dict:
    """Transforma una fila de SQLite en un diccionario de Python."""
    return {
        "id": row["id"],
        "course_code": row["course_code"],
        "title": row["title"],
        "description": row["description"],
        "due_date": row["due_date"],
        "published": bool(row["published"]),
        "created_by": row["created_by"],
        "created_at": row["created_at"],
    }

@app.get("/api/health")
def health():
    """Verifica el estado de disponibilidad del servidor."""
    return jsonify({"status": "ok"}), 200


@app.get("/api/tasks")
def list_tasks():
    """
    - teacher: ve todo (publicadas y borradores)
    - student: ve solo publicadas
    Opcional: filtrar por ?course=SW2
    """
    role = get_role()
    course = (request.args.get("course") or "").strip()

    conn = get_conn()
    cur = conn.cursor()

    if role == "teacher":
        if course:
            rows = cur.execute(
                "SELECT * FROM tasks WHERE course_code=? ORDER BY id DESC",
                (course,),
            ).fetchall()
        else:
            rows = cur.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
    else:
        if course:
            rows = cur.execute(
                """
                SELECT * FROM tasks
                WHERE published=1 AND course_code=?
                ORDER BY id DESC
                """,
                (course,),
            ).fetchall()
        else:
            rows = cur.execute(
                "SELECT * FROM tasks WHERE published=1 ORDER BY id DESC"
            ).fetchall()

    conn.close()

    return jsonify([task_row_to_dict(r) for r in rows]), 200


@app.get("/api/tasks/<int:task_id>")
def get_task(task_id: int):
    """
    Obtiene una tarea por id.
    - teacher: puede ver cualquier tarea
    - student: solo publicadas
    """
    role = get_role()

    conn = get_conn()
    cur = conn.cursor()

    row = cur.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Tarea no encontrada"}), 404

    if role != "teacher" and not bool(row["published"]):
        return jsonify({"error": "No autorizado para ver esta tarea"}), 403

    return jsonify(task_row_to_dict(row)), 200


@app.post("/api/tasks")
def create_task():
    """
    Crea una tarea (solo teacher).
    Body JSON:
    course_code, title, description, due_date (YYYY-MM-DD),
    published (bool opcional), created_by (opcional)
    """
    role = get_role()
    if role != "teacher":
        return jsonify({"error": "Solo un catedrático puede crear tareas"}), 403

    body = request.get_json(silent=True) or {}

    course_code = (body.get("course_code") or "").strip()
    title = (body.get("title") or "").strip()
    description = (body.get("description") or "").strip()
    due_date_str = (body.get("due_date") or "").strip()
    published = 1 if bool(body.get("published")) else 0
    created_by = (body.get("created_by") or "teacher").strip()

    error_msg = None

    if not (course_code := (body.get("course_code") or "").strip()):
        error_msg = "course_code es obligatorio"
    elif len(title := (body.get("title") or "").strip()) < 5:
        error_msg = "title debe tener al menos 5 caracteres"
    elif len(description := (body.get("description") or "").strip()) < 10:
        error_msg = "description debe tener al menos 10 caracteres"

    if error_msg:
        return jsonify({"error": error_msg}), 400

    due = parse_date_yyyy_mm_dd(due_date_str)
    if not due:
        return jsonify({"error": "due_date inválida (usa YYYY-MM-DD)"}), 400
    if due < date.today():
        return jsonify({"error": "due_date no puede ser en el pasado"}), 400

    conn = get_conn()
    cur = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()
    cur.execute(
        """
        INSERT INTO tasks(course_code, title, description, 
        due_date, published, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (course_code, title, description, due_date_str, published, created_by, now),
    )
    conn.commit()
    task_id = cur.lastrowid
    conn.close()

    return jsonify({"id": task_id, "message": "Tarea creada"}), 201


@app.patch("/api/tasks/<int:task_id>/publish")
def publish_task(task_id: int):
    """
    Publica una tarea (solo teacher).
    """
    role = get_role()
    if role != "teacher":
        return jsonify({"error": "Solo un catedrático puede publicar tareas"}), 403

    conn = get_conn()
    cur = conn.cursor()

    row = cur.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Tarea no encontrada"}), 404

    if bool(row["published"]):
        conn.close()
        return jsonify({"error": "La tarea ya estaba publicada"}), 409

    cur.execute("UPDATE tasks SET published=1 WHERE id=?", (task_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Tarea publicada"}), 200


@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id: int):
    """
    Eliminar una tarea (solo teacher).
    Esto agrega un caso real de mantenimiento y manejo de estados.
    """
    role = get_role()
    if role != "teacher":
        return jsonify({"error": "Solo un catedrático puede eliminar tareas"}), 403

    conn = get_conn()
    cur = conn.cursor()

    row = cur.execute("SELECT id FROM tasks WHERE id=?", (task_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Tarea no encontrada"}), 404

    cur.execute("DELETE FROM tasks WHERE id=?", (task_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Tarea eliminada"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)
