import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import '../index.css';

const LABEL = { todo: 'To do', 'in-progress': 'In progress', done: 'Done' };
const NEXT = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };
const EMPTY = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' };
const TABS = [
  ['all', 'All'],
  ['todo', 'To do'],
  ['in-progress', 'In progress'],
  ['done', 'Done'],
  ['overdue', 'Overdue'],
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ---------- date helpers (all dates are plain YYYY-MM-DD strings) ---------- */
const pad = (n) => String(n).padStart(2, '0');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const addDays = (s, n) => new Date(Date.parse(s) + n * 86400000).toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 86400000);
const dueOf = (t) => (t.dueDate ? t.dueDate.slice(0, 10) : null);
const shortDate = (s) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
const weekdayShort = (s) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' });

function deadline(t, today) {
  const due = dueOf(t);
  if (!due) return { text: 'No deadline', late: false };
  if (t.status === 'done') return { text: `Was due ${shortDate(due)}`, late: false };
  const d = dayDiff(due, today);
  if (d < 0) return { text: `Overdue by ${-d} day${d === -1 ? '' : 's'}`, late: true };
  if (d === 0) return { text: 'Due today', late: false };
  if (d === 1) return { text: 'Due tomorrow', late: false };
  return { text: `Due ${shortDate(due)}`, late: false };
}

/* ---------- small visual components ---------- */
function Donut({ todo, progress, done }) {
  const total = todo + progress + done;
  const R = 54;
  const C = 2 * Math.PI * R;
  const segments = [
    [done, '#ff5f84'],
    [progress, '#ffb3c3'],
    [todo, '#4a3a41'],
  ];
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="bx-donut-svg" role="img" aria-label={`${done} done, ${progress} in progress, ${todo} to do`}>
      <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
      {total > 0 &&
        segments.map(([n, color], i) => {
          const len = (n / total) * C;
          const el =
            n > 0 ? (
              <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={color} strokeWidth="14"
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
            ) : null;
          offset += len;
          return el;
        })}
    </svg>
  );
}

function WeekBars({ days }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="bx-bars" role="img" aria-label="Open tasks due on each of the next 7 days">
      {days.map((d) => (
        <div key={d.date} className={`bx-bar ${d.today ? 'is-today' : ''}`}>
          <span className="bx-bar-val">{d.count}</span>
          <div className="bx-bar-track">
            <div className="bx-bar-fill" style={{ height: `${d.count ? (d.count / max) * 100 : 0}%` }} />
          </div>
          <span className="bx-bar-day">{d.today ? 'Today' : d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Calendar({ marks, today, selected, onSelect }) {
  const [offset, setOffset] = useState(0);
  const [ty, tm] = today.split('-').map(Number);
  const first = new Date(Date.UTC(ty, tm - 1 + offset, 1));
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth();
  const lead = (first.getUTCDay() + 6) % 7; // week starts on Monday
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const title = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <>
      <div className="bx-card-head">
        <h2>{title}</h2>
        <div className="bx-cal-nav">
          <button type="button" aria-label="Previous month" onClick={() => setOffset(offset - 1)}>‹</button>
          <button type="button" aria-label="Next month" onClick={() => setOffset(offset + 1)}>›</button>
        </div>
      </div>
      <div className="bx-cal">
        {WEEKDAYS.map((w) => <span key={w} className="bx-cal-wd">{w[0]}</span>)}
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const date = `${year}-${pad(month + 1)}-${pad(day)}`;
          const mark = marks[date];
          const cls = [
            'bx-day',
            date === today && 'is-today',
            mark && (mark.late ? 'is-late' : 'has-task'),
            date === selected && 'is-selected',
          ].filter(Boolean).join(' ');
          return (
            <button key={date} type="button" className={cls}
              aria-pressed={date === selected}
              aria-label={`${shortDate(date)}${mark ? `, ${mark.count} open task${mark.count > 1 ? 's' : ''}` : ''}`}
              onClick={() => onSelect(date === selected ? null : date)}>
              {day}
            </button>
          );
        })}
      </div>
      <p className="bx-cal-hint">Dots mark deadlines. Click a day to filter your tasks.</p>
    </>
  );
}

const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" />
  </svg>
);

/* ---------- page ---------- */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [day, setDay] = useState(null);
  const [modal, setModal] = useState(null); // null | { id: string | null }
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const today = todayStr();
  const isLate = (t) => t.status !== 'done' && dueOf(t) && dueOf(t) < today;

  const load = async () => {
    try {
      setError('');
      const res = await api('/tasks');
      setTasks(res.tasks || res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => e.key === 'Escape' && setModal(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const counts = useMemo(() => {
    const c = {
      all: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter(isLate).length,
    };
    c.open = c.all - c.done;
    c.pct = c.all ? Math.round((c.done / c.all) * 100) : 0;
    c.dueToday = tasks.filter((t) => t.status !== 'done' && dueOf(t) === today).length;
    c.newThisWeek = tasks.filter((t) => t.createdAt && dayDiff(t.createdAt.slice(0, 10), today) > -7).length;
    return c;
  }, [tasks, today]);

  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(today, i);
        return {
          date,
          label: weekdayShort(date),
          today: i === 0,
          count: tasks.filter((t) => t.status !== 'done' && dueOf(t) === date).length,
        };
      }),
    [tasks, today]
  );
  const weekTotal = week.reduce((sum, d) => sum + d.count, 0);

  const marks = useMemo(() => {
    const m = {};
    tasks.forEach((t) => {
      const due = dueOf(t);
      if (!due || t.status === 'done') return;
      m[due] = m[due] || { count: 0, late: due < today };
      m[due].count += 1;
    });
    return m;
  }, [tasks, today]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        const inTab = tab === 'all' ? true : tab === 'overdue' ? isLate(t) : t.status === tab;
        if (!inTab) return false;
        if (priority && t.priority !== priority) return false;
        if (day && dueOf(t) !== day) return false;
        return !q || `${t.title} ${t.description || ''}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (dueOf(a) || '9999').localeCompare(dueOf(b) || '9999'));
  }, [tasks, tab, search, priority, day, today]);

  const openNew = () => { setForm(EMPTY); setFormError(''); setModal({ id: null }); };
  const openEdit = (t) => {
    setForm({
      title: t.title,
      description: t.description || '',
      priority: t.priority,
      status: t.status,
      dueDate: dueOf(t) || '',
    });
    setFormError('');
    setModal({ id: t._id });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const body = { ...form, dueDate: form.dueDate || null };
    try {
      if (modal.id) await api(`/tasks/${modal.id}`, { method: 'PUT', body });
      else await api('/tasks', { method: 'POST', body });
      setModal(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cycle = async (t) => {
    const status = NEXT[t.status];
    setTasks((prev) => prev.map((x) => (x._id === t._id ? { ...x, status } : x)));
    try {
      await api(`/tasks/${t._id}`, {
        method: 'PUT',
        body: { title: t.title, description: t.description, priority: t.priority, dueDate: t.dueDate, status },
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.title}"? This cannot be undone.`)) return;
    try {
      await api(`/tasks/${t._id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const name = user?.name || 'there';
  const firstName = name.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="bx">
      <header className="bx-top">
        <div className="brand"><span className="brand-icon">✓</span>Taskwine</div>

        <nav className="bx-pills" aria-label="Task views">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={tab === key}
              className={`bx-pill ${key === 'overdue' && counts.overdue ? 'is-late' : ''}`}
              onClick={() => setTab(key)}>
              {label}<small>{counts[key]}</small>
            </button>
          ))}
        </nav>

        <div className="bx-actions">
          <button type="button" className="bx-btn" onClick={openNew}>+ New task</button>
          <span className="bx-avatar" title={name} aria-hidden="true">{name[0]?.toUpperCase()}</span>
          <button type="button" className="bx-btn-ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="bx-hello">
        <h1>{greeting}, {firstName}</h1>
        <p>
          {counts.overdue
            ? `${counts.overdue} overdue and ${counts.dueToday} due today. Start with the red ones.`
            : counts.dueToday
              ? `${counts.dueToday} due today. Nothing overdue.`
              : `${counts.open} open tasks. Nothing due today.`}
        </p>
      </section>

      {error && (
        <div className="bx-error" role="alert">
          <span>{error}</span>
          <button type="button" className="bx-btn-ghost" onClick={load}>Try again</button>
        </div>
      )}

      <div className="bx-grid">
        <article className="bx-card bx-stat">
          <div className="bx-stat-top"><span>Total tasks</span><em className="bx-chip">{counts.newThisWeek} new this week</em></div>
          <strong className="bx-num">{counts.all}</strong>
        </article>
        <article className="bx-card bx-stat">
          <div className="bx-stat-top"><span>Still open</span><em className="bx-chip">{counts.dueToday} due today</em></div>
          <strong className="bx-num">{counts.open}</strong>
        </article>
        <article className="bx-card bx-stat">
          <div className="bx-stat-top"><span>Completed</span><em className="bx-chip">{counts.pct}% done</em></div>
          <strong className="bx-num">{counts.done}</strong>
        </article>
        <article className="bx-card bx-stat">
          <div className="bx-stat-top">
            <span>Overdue</span>
            <em className={`bx-chip ${counts.overdue ? 'is-late' : ''}`}>{counts.overdue ? 'Needs attention' : 'All clear'}</em>
          </div>
          <strong className={`bx-num ${counts.overdue ? 'is-late' : ''}`}>{counts.overdue}</strong>
        </article>

        <article className="bx-card bx-week">
          <div className="bx-card-head">
            <h2>Next 7 days</h2>
            <span className="bx-sub">{weekTotal} open task{weekTotal === 1 ? '' : 's'} due</span>
          </div>
          <WeekBars days={week} />
        </article>

        <article className="bx-card bx-ring">
          <div className="bx-card-head"><h2>Progress</h2></div>
          <div className="bx-donut">
            <Donut todo={counts.todo} progress={counts['in-progress']} done={counts.done} />
            <div className="bx-donut-center"><strong>{counts.pct}<small>%</small></strong><span>complete</span></div>
          </div>
          <ul className="bx-legend">
            <li><i style={{ background: '#ff5f84' }} />Done<b>{counts.done}</b></li>
            <li><i style={{ background: '#ffb3c3' }} />In progress<b>{counts['in-progress']}</b></li>
            <li><i style={{ background: '#4a3a41' }} />To do<b>{counts.todo}</b></li>
          </ul>
        </article>

        <article className="bx-card bx-calendar">
          <Calendar marks={marks} today={today} selected={day} onSelect={setDay} />
        </article>

        <section className="bx-card bx-tasks" aria-label="Tasks">
          <div className="bx-card-head bx-tasks-head">
            <div>
              <h2>{TABS.find(([k]) => k === tab)[1]} tasks</h2>
              <span className="bx-sub">
                Showing {visible.length} of {counts.all}. Click the circle to move a task forward.
              </span>
            </div>
            {day && (
              <button type="button" className="bx-chip-btn" onClick={() => setDay(null)}>
                Due {shortDate(day)} ✕
              </button>
            )}
          </div>

          <div className="bx-controls">
            <input className="bx-input" type="search" placeholder="Search tasks" aria-label="Search tasks"
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="bx-input bx-select" aria-label="Filter by priority" value={priority}
              onChange={(e) => setPriority(e.target.value)}>
              <option value="">Any priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {loading ? (
            <p className="bx-empty">Loading your tasks…</p>
          ) : visible.length === 0 ? (
            <div className="bx-empty">
              <h3>{tasks.length === 0 ? 'No tasks yet' : 'Nothing matches these filters'}</h3>
              <p>{tasks.length === 0 ? 'Add your first task and give it a deadline.' : 'Try another view, a different day, or clear the search.'}</p>
              {tasks.length === 0 && <button type="button" className="bx-btn" onClick={openNew}>Add a task</button>}
            </div>
          ) : (
            <ul className="bx-list">
              {visible.map((t) => {
                const d = deadline(t, today);
                return (
                  <li key={t._id} className={`bx-row ${t.status === 'done' ? 'is-done' : ''}`}>
                    <button type="button" className={`bx-check ${t.status}`}
                      aria-label={`${LABEL[t.status]}. Mark as ${LABEL[NEXT[t.status]]}`}
                      title={`Mark as ${LABEL[NEXT[t.status]]}`} onClick={() => cycle(t)}>
                      {t.status === 'done' && '✓'}
                    </button>
                    <div className="bx-row-body">
                      <p className="bx-row-title">{t.title}</p>
                      {t.description && <p className="bx-row-desc">{t.description}</p>}
                      <div className="bx-meta">
                        <span className={`bx-prio bx-prio-${t.priority}`}>{t.priority}</span>
                        <span className="bx-status">{LABEL[t.status]}</span>
                        <span className={`bx-due ${d.late ? 'is-late' : ''}`}>{d.text}</span>
                      </div>
                    </div>
                    <div className="bx-row-actions">
                      <button type="button" className="bx-icon" aria-label={`Edit ${t.title}`} onClick={() => openEdit(t)}><PencilIcon /></button>
                      <button type="button" className="bx-icon is-danger" aria-label={`Delete ${t.title}`} onClick={() => remove(t)}><TrashIcon /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {modal && (
        <div className="bx-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="bx-modal" role="dialog" aria-modal="true" aria-labelledby="bx-modal-title">
            <h2 id="bx-modal-title">{modal.id ? 'Edit task' : 'New task'}</h2>
            {formError && <div className="bx-error" role="alert">{formError}</div>}

            <form className="bx-form" onSubmit={save}>
              <label htmlFor="t-title">Title</label>
              <input id="t-title" className="bx-input" required maxLength={120} autoFocus
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

              <label htmlFor="t-desc">Description</label>
              <textarea id="t-desc" className="bx-input" maxLength={1000}
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

              <div className="bx-form-row">
                <div>
                  <label htmlFor="t-priority">Priority</label>
                  <select id="t-priority" className="bx-input bx-select" value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="t-status">Status</label>
                  <select id="t-status" className="bx-input bx-select" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <label htmlFor="t-due">Deadline</label>
              <input id="t-due" className="bx-input" type="date" value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />

              <div className="bx-modal-actions">
                <button type="button" className="bx-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button className="bx-btn" disabled={saving}>{saving ? 'Saving…' : modal.id ? 'Save changes' : 'Add task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}