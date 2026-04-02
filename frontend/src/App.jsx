import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5000";

function formatDateInput(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem("role") || "student");
  const [courseFilter, setCourseFilter] = useState("SW2");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Form crear tarea
  const [courseCode, setCourseCode] = useState("SW2");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDateInput(d);
  });
  const [published, setPublished] = useState(false);

  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);

  const headers = useMemo(() => ({ "X-Role": role }), [role]);

  async function loadTasks() {
    setLoading(true);
    setMsg("");
    try {
      const url = courseFilter
        ? `${API_BASE}/api/tasks?course=${encodeURIComponent(courseFilter)}`
        : `${API_BASE}/api/tasks`;

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al cargar tareas");
      setTasks(data);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, courseFilter]);

  async function createTask(e) {
    e.preventDefault();
    setMsg("");
    try {
      const payload = {
        course_code: courseCode.trim(),
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate,
        published,
        created_by: "profe1",
      };

      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear la tarea");

      setTitle("");
      setDescription("");
      setPublished(false);
      setMsg("✅ Tarea creada correctamente");
      await loadTasks();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  async function publishTask(taskId) {
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}/publish`, {
        method: "PATCH",
        headers,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo publicar");

      setMsg(`✅ ${data.message}`);
      await loadTasks();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  // Estilos (blanco + azul, suave)
  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg, #F5FAFF 0%, #FFFFFF 55%)",
      display: "grid",
      placeItems: "center",
      padding: 24,
      color: "#0F172A",
      fontFamily:
        'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial',
    },
    card: {
      width: "min(920px, 100%)",
      background: "#FFFFFF",
      border: "1px solid #D9E8FF",
      borderRadius: 16,
      padding: 20,
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 14,
    },
    title: { margin: 0, fontSize: 22, color: "#0B3B8A" },
    subtitle: { margin: "6px 0 0", color: "#33577A", fontSize: 14 },
    controls: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "center",
      padding: 12,
      border: "1px solid #E6F0FF",
      borderRadius: 12,
      background: "#F7FBFF",
    },
    label: { display: "grid", gap: 6, fontSize: 13, color: "#1F2A44" },
    input: {
      height: 36,
      padding: "0 10px",
      borderRadius: 10,
      border: "1px solid #CFE2FF",
      outline: "none",
      background: "#FFFFFF",
      minWidth: 160,
    },
    textarea: {
      padding: 10,
      borderRadius: 10,
      border: "1px solid #CFE2FF",
      outline: "none",
      background: "#FFFFFF",
      resize: "vertical",
    },
    btnPrimary: {
      height: 38,
      padding: "0 14px",
      borderRadius: 10,
      border: "1px solid #2F6FED",
      background: "#2F6FED",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 600,
    },
    btnSoft: {
      height: 38,
      padding: "0 14px",
      borderRadius: 10,
      border: "1px solid #BFD7FF",
      background: "#EAF2FF",
      color: "#0B3B8A",
      cursor: "pointer",
      fontWeight: 600,
    },
    btnSuccess: {
      height: 34,
      padding: "0 12px",
      borderRadius: 10,
      border: "1px solid #95C5FF",
      background: "#DDEBFF",
      color: "#0B3B8A",
      cursor: "pointer",
      fontWeight: 600,
    },
    msg: {
      marginTop: 12,
      padding: 12,
      background: "#F2F7FF",
      border: "1px solid #D9E8FF",
      borderRadius: 12,
      color: "#123A6F",
    },
    sectionTitle: { margin: "18px 0 10px", color: "#0B3B8A" },
    grid: { display: "grid", gap: 12 },
    taskCard: {
      border: "1px solid #E6F0FF",
      borderRadius: 14,
      padding: 14,
      background: "#FFFFFF",
    },
    taskTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      marginBottom: 6,
    },
    taskTitle: { margin: 0, fontSize: 16, color: "#0F2D57" },
    pill: (isPublished) => ({
      fontSize: 12,
      padding: "5px 10px",
      borderRadius: 999,
      border: "1px solid #D9E8FF",
      background: isPublished ? "#E9F6FF" : "#FFF7E6",
      color: isPublished ? "#0B3B8A" : "#8A5A00",
      fontWeight: 700,
    }),
    meta: { fontSize: 13, color: "#3A5878" },
    desc: { margin: "8px 0 0", color: "#1F2A44", lineHeight: 1.4 },
    footerNote: { marginTop: 18, fontSize: 12, color: "#5A738F" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Gestión de Tareas</h1>
            <p style={styles.subtitle}>
              Módulo web:creación y publicación de tareas (Frontend React + API Flask)
            </p>
          </div>

          <button onClick={loadTasks} style={styles.btnSoft} disabled={loading}>
            {loading ? "Cargando..." : "Recargar"}
          </button>
        </div>

        <div style={styles.controls}>
          <label style={styles.label}>
            <span>Rol</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
              <option value="student">student</option>
              <option value="teacher">teacher</option>
            </select>
          </label>

          <label style={styles.label}>
            <span>Curso (filtro)</span>
            <input
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              placeholder="Ej: SW2"
              style={styles.input}
            />
          </label>
        </div>

        {msg && <div style={styles.msg}>{msg}</div>}

        {role === "teacher" && (
          <div style={{ marginTop: 18, padding: 14, border: "1px solid #E6F0FF", borderRadius: 14, background: "#F9FCFF" }}>
            <h2 style={{ ...styles.sectionTitle, marginTop: 0 }}>Crear tarea</h2>

            <form onSubmit={createTask} style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={styles.label}>
                  <span>Curso</span>
                  <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} style={styles.input} />
                </label>

                <label style={styles.label}>
                  <span>Fecha límite</span>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={styles.input} />
                </label>
              </div>

              <label style={styles.label}>
                <span>Título</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Min 5 caracteres"
                  style={{ ...styles.input, minWidth: "100%" }}
                />
              </label>

              <label style={styles.label}>
                <span>Descripción</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Min 10 caracteres"
                  rows={3}
                  style={styles.textarea}
                />
              </label>

              <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "#1F2A44" }}>
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                <span>Publicar de una vez</span>
              </label>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="submit" style={styles.btnPrimary}>
                  Crear tarea
                </button>
                <button
                  type="button"
                  style={styles.btnSoft}
                  onClick={() => {
                    setTitle("");
                    setDescription("");
                    setPublished(false);
                    setMsg("");
                  }}
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        )}

        <h2 style={styles.sectionTitle}>Tareas</h2>

        {tasks.length === 0 ? (
          <p style={styles.meta}>No hay tareas para mostrar.</p>
        ) : (
          <div style={styles.grid}>
            {tasks.map((t) => (
              <div key={t.id} style={styles.taskCard}>
                <div style={styles.taskTop}>
                  <h3 style={styles.taskTitle}>{t.title}</h3>
                  <span style={styles.pill(t.published)}>{t.published ? "Publicada" : "Borrador"}</span>
                </div>

                <div style={styles.meta}>Fecha límite: {t.due_date}</div>
                <p style={styles.desc}>{t.description}</p>

                {role === "teacher" && !t.published && (
                  <div style={{ marginTop: 10 }}>
                    <button style={styles.btnSuccess} onClick={() => publishTask(t.id)}>
                      Publicar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={styles.footerNote}>
          Se usa el header <code>X-Role</code> para simular permisos (teacher/student).
        </div>
      </div>
    </div>
  );
}
