'use client';

import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const demoBoards = [
  {
    id: 'demo-board-1',
    name: 'Domna EPC Pipeline',
    description: 'Track assessments from allocation through QA and submission.',
    groups: [
      {
        id: 'demo-group-1',
        name: 'Assigned',
        className: 'assigned',
        tasks: [
          {
            id: 'demo-task-1',
            group_id: 'demo-group-1',
            title: '117 Alderney Street - Tabeeb',
            status: 'Assigned',
            priority: 'High',
            assessor: 'Tabeeb',
            due_date: '2026-03-20',
            qa_status: 'Pending',
            magicplan_status: 'No',
            issues: ['Ventilation'],
            notes: 'Awaiting upload of full folder information.',
            comments: [{ id: 'demo-comment-1', author: 'Seb', text: 'Check folder completeness before QA.' }],
          },
          {
            id: 'demo-task-2',
            group_id: 'demo-group-1',
            title: '23 Digby Road - Horace',
            status: 'Assigned',
            priority: 'Medium',
            assessor: 'Horace',
            due_date: '2026-03-21',
            qa_status: 'Pending',
            magicplan_status: 'No',
            issues: ['Heating', 'Wall Types'],
            notes: 'Previous correction issue noted. Needs double-check before resubmission.',
            comments: [{ id: 'demo-comment-2', author: 'Manager', text: 'Ensure full condition report is aligned with photo evidence.' }],
          },
        ],
      },
      {
        id: 'demo-group-2',
        name: 'Survey Done',
        className: 'survey',
        tasks: [
          {
            id: 'demo-task-3',
            group_id: 'demo-group-2',
            title: '36a London Road - Horace',
            status: 'Survey Done',
            priority: 'High',
            assessor: 'Horace',
            due_date: '2026-03-19',
            qa_status: 'In Review',
            magicplan_status: 'Yes',
            issues: ['Room in Roof', 'Ventilation', 'MagicPlan'],
            notes: 'Survey complete. Inputs require technical validation.',
            comments: [{ id: 'demo-comment-3', author: 'QA', text: 'Verify room-in-roof classification and ventilation strategy.' }],
          },
        ],
      },
      {
        id: 'demo-group-3',
        name: 'QA',
        className: 'qa',
        tasks: [
          {
            id: 'demo-task-4',
            group_id: 'demo-group-3',
            title: '1 Llys Drew SE16 3EY',
            status: 'QA',
            priority: 'High',
            assessor: 'Lewis',
            due_date: '2026-03-19',
            qa_status: 'Needs Correction',
            magicplan_status: 'Yes',
            issues: ['Ventilation', 'Door Undercut', 'Trickle Vents'],
            notes: 'Cross-check floor plan PDF against condition report merge.',
            comments: [{ id: 'demo-comment-4', author: 'Seb', text: 'Merged PDF nearly working. Floor plan extraction still incomplete.' }],
          },
        ],
      },
      {
        id: 'demo-group-4',
        name: 'Submitted',
        className: 'submitted',
        tasks: [
          {
            id: 'demo-task-5',
            group_id: 'demo-group-4',
            title: 'Sample Completed Job',
            status: 'Submitted',
            priority: 'Low',
            assessor: 'Allan',
            due_date: '2026-03-18',
            qa_status: 'Passed',
            magicplan_status: 'Yes',
            issues: [],
            notes: 'Ready for archive.',
            comments: [],
          },
        ],
      },
    ],
  },
  {
    id: 'demo-board-2',
    name: 'Assessor Performance',
    description: 'Manager overview of quality, recurring issues, and support needs.',
    groups: [
      {
        id: 'demo-group-5',
        name: 'Needs Support',
        className: 'support',
        tasks: [
          {
            id: 'demo-task-6',
            group_id: 'demo-group-5',
            title: 'Horace - Performance Review',
            status: 'Review',
            priority: 'High',
            assessor: 'Horace',
            due_date: '2026-03-22',
            qa_status: 'Open',
            magicplan_status: 'Mixed',
            issues: ['Main Heating', 'Ventilation', 'Room in Roof', 'Wall Types', 'MagicPlan'],
            notes: 'Would benefit from structured support on classification and QA close-out discipline.',
            comments: [{ id: 'demo-comment-5', author: 'Manager', text: 'Recurring audit issues require targeted coaching.' }],
          },
        ],
      },
      {
        id: 'demo-group-6',
        name: 'Stable',
        className: 'stable',
        tasks: [
          {
            id: 'demo-task-7',
            group_id: 'demo-group-6',
            title: 'Lewis - Performance Review',
            status: 'Review',
            priority: 'Medium',
            assessor: 'Lewis',
            due_date: '2026-03-25',
            qa_status: 'Open',
            magicplan_status: 'Yes',
            issues: ['Minor QA Queries'],
            notes: 'Generally strong consistency. Small technical queries only.',
            comments: [],
          },
        ],
      },
    ],
  },
];

function statusClass(value) {
  return {
    Assigned: 'statusAssigned',
    'Survey Done': 'statusSurveyDone',
    QA: 'statusQA',
    Submitted: 'statusSubmitted',
    Review: 'statusReview',
  }[value] || '';
}

function priorityClass(value) {
  return {
    High: 'priorityHigh',
    Medium: 'priorityMedium',
    Low: 'priorityLow',
  }[value] || '';
}

function formatDate(dateValue) {
  if (!dateValue) return 'No date';
  return dateValue;
}

export default function HomePage() {
  const [boards, setBoards] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [commentsByTask, setCommentsByTask] = useState({});
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskGroupId, setNewTaskGroupId] = useState('');
  const [search, setSearch] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [usingDemoMode, setUsingDemoMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorText('');

    if (!isSupabaseConfigured || !supabase) {
      loadDemoData();
      return;
    }

    try {
      const [{ data: boardRows, error: boardError }, { data: groupRows, error: groupError }, { data: taskRows, error: taskError }, { data: commentRows, error: commentError }] = await Promise.all([
        supabase.from('boards').select('*').order('position', { ascending: true }).order('name', { ascending: true }),
        supabase.from('groups').select('*').order('position', { ascending: true }).order('name', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
      ]);

      if (boardError || groupError || taskError || commentError) {
        throw new Error(boardError?.message || groupError?.message || taskError?.message || commentError?.message || 'Failed to load data.');
      }

      if (!boardRows?.length) {
        loadDemoData();
        return;
      }

      const commentMap = {};
      for (const comment of commentRows || []) {
        if (!commentMap[comment.task_id]) commentMap[comment.task_id] = [];
        commentMap[comment.task_id].push(comment);
      }

      setBoards(boardRows || []);
      setGroups(groupRows || []);
      setTasks(taskRows || []);
      setCommentsByTask(commentMap);
      setSelectedBoardId((boardRows || [])[0]?.id || null);
      setUsingDemoMode(false);
    } catch (error) {
      setErrorText(error.message || 'Unable to load Supabase data. Showing demo data instead.');
      loadDemoData();
      return;
    }

    setLoading(false);
  }

  function loadDemoData() {
    const boardRows = demoBoards.map(({ id, name, description }) => ({ id, name, description }));
    const groupRows = demoBoards.flatMap((board) => board.groups.map((group, index) => ({ id: group.id, board_id: board.id, name: group.name, ui_class: group.className, position: index + 1 })));
    const taskRows = demoBoards.flatMap((board) => board.groups.flatMap((group) => group.tasks.map((task) => ({ ...task }))));
    const commentMap = {};
    for (const task of taskRows) {
      commentMap[task.id] = task.comments || [];
    }

    setBoards(boardRows);
    setGroups(groupRows);
    setTasks(taskRows);
    setCommentsByTask(commentMap);
    setSelectedBoardId(boardRows[0]?.id || null);
    setUsingDemoMode(true);
    setLoading(false);
  }

  const selectedBoard = useMemo(() => boards.find((board) => board.id === selectedBoardId) || null, [boards, selectedBoardId]);

  const boardGroups = useMemo(() => groups.filter((group) => group.board_id === selectedBoardId), [groups, selectedBoardId]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();

    return boardGroups.map((group) => {
      const groupTasks = tasks.filter((task) => task.group_id === group.id).map((task) => ({ ...task, comments: commentsByTask[task.id] || [] }));

      if (!q) return { ...group, tasks: groupTasks };

      const filteredTasks = groupTasks.filter((task) => {
        const haystack = [task.title, task.assessor, task.status, task.qa_status, task.notes, task.magicplan_status, ...(task.issues || [])].join(' ').toLowerCase();
        return haystack.includes(q);
      });

      return { ...group, tasks: filteredTasks };
    });
  }, [boardGroups, tasks, commentsByTask, search]);

  const flatTasks = useMemo(() => filteredGroups.flatMap((group) => group.tasks), [filteredGroups]);

  const stats = useMemo(() => {
    const allBoardTasks = tasks.filter((task) => boardGroups.some((group) => group.id === task.group_id));
    return {
      total: allBoardTasks.length,
      qaOpen: allBoardTasks.filter((task) => !['Passed', 'N/A'].includes(task.qa_status)).length,
      highPriority: allBoardTasks.filter((task) => task.priority === 'High').length,
      dueSoon: allBoardTasks.filter((task) => ['2026-03-19', '2026-03-20', '2026-03-21'].includes(task.due_date)).length,
    };
  }, [tasks, boardGroups]);

  async function addTask() {
    if (!newTaskTitle.trim()) return;
    const groupId = newTaskGroupId || boardGroups[0]?.id;
    if (!groupId) return;

    if (usingDemoMode || !supabase) {
      const nextTask = {
        id: `demo-${Date.now()}`,
        group_id: groupId,
        title: newTaskTitle.trim(),
        status: groups.find((group) => group.id === groupId)?.name || 'Assigned',
        priority: 'Medium',
        assessor: 'Unassigned',
        due_date: '2026-03-26',
        qa_status: 'Pending',
        magicplan_status: 'No',
        issues: [],
        notes: '',
      };
      setTasks((prev) => [nextTask, ...prev]);
      setNewTaskTitle('');
      return;
    }

    const group = groups.find((item) => item.id === groupId);

    const { error } = await supabase.from('tasks').insert({
      group_id: groupId,
      title: newTaskTitle.trim(),
      status: group?.name || 'Assigned',
      priority: 'Medium',
      assessor: 'Unassigned',
      due_date: '2026-03-26',
      qa_status: 'Pending',
      magicplan_status: 'No',
      issues: [],
      notes: '',
    });

    if (error) {
      setErrorText(error.message);
      return;
    }

    setNewTaskTitle('');
    await loadData();
  }

  function openTask(task) {
    setSelectedTask({ ...task, comments: commentsByTask[task.id] || [] });
    setNewComment('');
  }

  function updateSelectedTaskField(field, value) {
    setSelectedTask((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function saveTaskChanges() {
    if (!selectedTask) return;

    if (usingDemoMode || !supabase) {
      setTasks((prev) => prev.map((task) => (task.id === selectedTask.id ? { ...task, ...selectedTask } : task)));
      setSelectedTask(null);
      return;
    }

    const payload = {
      title: selectedTask.title,
      assessor: selectedTask.assessor,
      due_date: selectedTask.due_date,
      qa_status: selectedTask.qa_status,
      magicplan_status: selectedTask.magicplan_status,
      notes: selectedTask.notes,
      issues: selectedTask.issues,
      priority: selectedTask.priority,
    };

    const { error } = await supabase.from('tasks').update(payload).eq('id', selectedTask.id);
    if (error) {
      setErrorText(error.message);
      return;
    }

    await loadData();
    setSelectedTask(null);
  }

  async function addComment() {
    if (!selectedTask || !newComment.trim()) return;

    const commentToAdd = {
      id: `comment-${Date.now()}`,
      task_id: selectedTask.id,
      author: 'Seb',
      text: newComment.trim(),
      created_at: new Date().toISOString(),
    };

    if (usingDemoMode || !supabase) {
      setCommentsByTask((prev) => ({
        ...prev,
        [selectedTask.id]: [...(prev[selectedTask.id] || []), commentToAdd],
      }));
      setSelectedTask((prev) => prev ? { ...prev, comments: [...(prev.comments || []), commentToAdd] } : prev);
      setNewComment('');
      return;
    }

    const { error } = await supabase.from('comments').insert({
      task_id: selectedTask.id,
      author: 'Seb',
      text: newComment.trim(),
    });

    if (error) {
      setErrorText(error.message);
      return;
    }

    setNewComment('');
    await loadData();
    const latestTask = tasks.find((task) => task.id === selectedTask.id);
    if (latestTask) openTask(latestTask);
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandBadge">D</div>
          <div>
            <div className="brandTitle">Domna Work OS</div>
            <div className="brandSub">Monday-style operations platform</div>
          </div>
        </div>

        <div className="boardList">
          {boards.map((board) => (
            <button key={board.id} className={`boardButton ${board.id === selectedBoardId ? 'active' : ''}`} onClick={() => setSelectedBoardId(board.id)}>
              <div className="boardButtonTitle">{board.name}</div>
              <div className="boardButtonText">{board.description}</div>
            </button>
          ))}
        </div>

        <div className="sideCard">
          <h3>Next modules</h3>
          <ul>
            <li>Authentication and user roles</li>
            <li>Realtime board refresh</li>
            <li>File evidence uploads</li>
            <li>QA alert notifications</li>
            <li>Performance dashboard by assessor</li>
          </ul>
        </div>
      </aside>

      <main className="main">
        {!isSupabaseConfigured && (
          <div className="notice">
            <strong>Demo mode is active.</strong>
            Add your Supabase URL and anon key in <code>.env.local</code> and in Vercel to switch this app to live data.
          </div>
        )}

        {errorText && <div className="notice"><strong>Data note</strong>{errorText}</div>}

        <div className="topbar">
          <div>
            <h1 className="pageTitle">{selectedBoard?.name || 'Loading board...'}</h1>
            <p className="pageText">{selectedBoard?.description || 'Loading data...'}</p>
          </div>

          <div className="actions">
            <div className="searchWrap">
              <input className="searchInput" placeholder="Search tasks, issues, people..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <button className="btn">Filter</button>
            <button className="btn btnPrimary" onClick={loadData}>Refresh</button>
          </div>
        </div>

        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Total items</div>
            <div className="statValue">{stats.total}</div>
            <div className="statSub">Across selected board</div>
          </div>
          <div className="statCard">
            <div className="statLabel">QA open</div>
            <div className="statValue">{stats.qaOpen}</div>
            <div className="statSub">Items not yet passed</div>
          </div>
          <div className="statCard">
            <div className="statLabel">High priority</div>
            <div className="statValue">{stats.highPriority}</div>
            <div className="statSub">Immediate attention required</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Due soon</div>
            <div className="statValue">{stats.dueSoon}</div>
            <div className="statSub">Today to next 2 days</div>
          </div>
        </div>

        <div className="panelGrid">
          <section className="panel">
            <h2 className="panelTitle">Add board item</h2>
            <div className="formGrid">
              <div>
                <label className="label">New item title</label>
                <input className="input" value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Example: 54 Market Street - QA Review" />
              </div>
              <div>
                <label className="label">Group</label>
                <select className="select" value={newTaskGroupId} onChange={(event) => setNewTaskGroupId(event.target.value)}>
                  <option value="">Default group</option>
                  {boardGroups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              <button className="btn btnPrimary" onClick={addTask}>Add item</button>
            </div>
          </section>

          <section className="panel">
            <h2 className="panelTitle">Backend readiness</h2>
            <div className="moduleGrid">
              <div className="moduleCard">
                <span className="badge badgeDark">Ready</span>
                <h4 style={{ marginTop: 10 }}>Supabase data model</h4>
                <p>Boards, groups, tasks and comments are already structured for persistence.</p>
              </div>
              <div className="moduleCard">
                <span className="badge badgeDark">Ready</span>
                <h4 style={{ marginTop: 10 }}>Vercel deployment</h4>
                <p>Project uses a lightweight stack to reduce build failures and dependency issues.</p>
              </div>
              <div className="moduleCard">
                <span className="badge">Next</span>
                <h4 style={{ marginTop: 10 }}>Authentication</h4>
                <p>Add manager and assessor access control in the next version.</p>
              </div>
              <div className="moduleCard">
                <span className="badge">Next</span>
                <h4 style={{ marginTop: 10 }}>Notifications</h4>
                <p>Due date reminders, QA alerts and task mentions can be added after live deployment.</p>
              </div>
            </div>
          </section>
        </div>

        {loading ? (
          <div className="emptyState">Loading board data...</div>
        ) : (
          <div className="boardScroller">
            <div className="groupRow">
              {filteredGroups.map((group) => (
                <div className="groupColumn" key={group.id}>
                  <div className="groupCard">
                    <div className={`groupHead ${group.ui_class || ''}`}>
                      <div className="groupTitle">{group.name}</div>
                      <span className="badge">{group.tasks.length}</span>
                    </div>
                    <div className="groupBody">
                      {group.tasks.length === 0 ? (
                        <div className="emptyState">No items in this group.</div>
                      ) : (
                        group.tasks.map((task) => (
                          <button key={task.id} className="taskCard" onClick={() => openTask(task)} style={{ textAlign: 'left' }}>
                            <div className="taskTop">
                              <h3 className="taskTitle">{task.title}</h3>
                              <span className={`badge ${statusClass(task.status)}`}>{task.status}</span>
                            </div>
                            <div className="tagRow">
                              <span className={`badge ${priorityClass(task.priority)}`}>{task.priority || 'Medium'}</span>
                              <span className="badge">QA: {task.qa_status || 'Pending'}</span>
                              <span className="badge">MagicPlan: {task.magicplan_status || 'No'}</span>
                            </div>
                            <div className="metaRow">
                              <span className="metaText">Assessor: {task.assessor || 'Unassigned'}</span>
                            </div>
                            <div className="metaRow">
                              <span className="metaText">Due: {formatDate(task.due_date)}</span>
                            </div>
                            <div className="metaRow">
                              <span className="metaText">Issues: {(task.issues || []).length ? task.issues.join(', ') : 'No issues'}</span>
                            </div>
                            <div className="metaRow">
                              <span className="metaText">Comments: {(commentsByTask[task.id] || []).length}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {selectedTask && (
        <div className="overlay" onClick={() => setSelectedTask(null)}>
          <div className="modalCard" onClick={(event) => event.stopPropagation()}>
            <div className="modalGrid">
              <div className="modalMain">
                <div className="modalTop">
                  <div>
                    <h2 className="modalTitle">{selectedTask.title}</h2>
                    <div className="tagRow">
                      <span className={`badge ${statusClass(selectedTask.status)}`}>{selectedTask.status}</span>
                      <span className={`badge ${priorityClass(selectedTask.priority)}`}>{selectedTask.priority}</span>
                      <span className="badge">QA: {selectedTask.qa_status}</span>
                    </div>
                  </div>
                  <button className="iconBtn" onClick={() => setSelectedTask(null)}>×</button>
                </div>

                <div className="fieldGrid">
                  <div>
                    <label className="label">Title</label>
                    <input className="input" value={selectedTask.title} onChange={(event) => updateSelectedTaskField('title', event.target.value)} />
                  </div>
                  <div>
                    <label className="label">Assessor</label>
                    <input className="input" value={selectedTask.assessor || ''} onChange={(event) => updateSelectedTaskField('assessor', event.target.value)} />
                  </div>
                  <div>
                    <label className="label">Due date</label>
                    <input className="input" type="date" value={selectedTask.due_date || ''} onChange={(event) => updateSelectedTaskField('due_date', event.target.value)} />
                  </div>
                  <div>
                    <label className="label">QA status</label>
                    <input className="input" value={selectedTask.qa_status || ''} onChange={(event) => updateSelectedTaskField('qa_status', event.target.value)} />
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select className="select" value={selectedTask.priority || 'Medium'} onChange={(event) => updateSelectedTaskField('priority', event.target.value)}>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">MagicPlan</label>
                    <input className="input" value={selectedTask.magicplan_status || ''} onChange={(event) => updateSelectedTaskField('magicplan_status', event.target.value)} />
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <label className="label">Issues</label>
                  <input className="input" value={(selectedTask.issues || []).join(', ')} onChange={(event) => updateSelectedTaskField('issues', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} />
                </div>

                <div style={{ marginTop: 18 }}>
                  <label className="label">Notes</label>
                  <textarea className="textarea" rows={7} value={selectedTask.notes || ''} onChange={(event) => updateSelectedTaskField('notes', event.target.value)} />
                </div>

                <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
                  <button className="btn btnPrimary" onClick={saveTaskChanges}>Save changes</button>
                  <button className="btn" onClick={() => setSelectedTask(null)}>Close</button>
                </div>
              </div>

              <div className="modalSide">
                <h3 style={{ marginTop: 0 }}>Updates</h3>
                <p className="muted" style={{ fontSize: 13 }}>Internal comments, audit notes and manager feedback.</p>

                <div className="commentList">
                  {(selectedTask.comments || []).length === 0 ? (
                    <div className="emptyState">No comments yet.</div>
                  ) : (
                    selectedTask.comments.map((comment) => (
                      <div className="commentCard" key={comment.id}>
                        <div className="commentAuthor">{comment.author || 'Team'}</div>
                        <div className="commentText">{comment.text}</div>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <label className="label">Add comment</label>
                  <textarea className="textarea" rows={6} value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Add update, QA note, or manager comment..." />
                </div>

                <div style={{ marginTop: 12 }}>
                  <button className="btn btnPrimary" onClick={addComment}>Add update</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
