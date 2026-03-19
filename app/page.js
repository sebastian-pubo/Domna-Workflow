'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'

const supabaseUrl =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : ''
const supabaseAnonKey =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : ''

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const DOMNA = {
  navy: '#0B1F3A',
  blue: '#153E75',
  sky: '#DCEAF9',
  pale: '#F4F8FC',
  border: '#C9D8EA',
  green: '#DDF4E8',
  amber: '#FFF1D6',
  red: '#FDE2E1',
  text: '#10233F',
  muted: '#59708F',
  white: '#FFFFFF',
}

const defaultMetricCards = [
  { key: 'metric_1', label: 'Total items', type: 'total' },
  { key: 'metric_2', label: 'QA open', type: 'qa_open' },
  { key: 'metric_3', label: 'High priority', type: 'high_priority' },
  { key: 'metric_4', label: 'Due soon', type: 'due_soon' },
]

function styles() {
  return {
    page: {
      minHeight: '100vh',
      background: DOMNA.pale,
      color: DOMNA.text,
      fontFamily: 'Arial, sans-serif',
    },
    shell: {
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      minHeight: '100vh',
    },
    sidebar: {
      background: DOMNA.white,
      borderRight: `1px solid ${DOMNA.border}`,
      padding: 18,
    },
    brandWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18,
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: DOMNA.navy,
      color: DOMNA.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
    },
    boardButton: (active) => ({
      width: '100%',
      textAlign: 'left',
      padding: 14,
      borderRadius: 18,
      border: active ? `1px solid ${DOMNA.navy}` : `1px solid ${DOMNA.border}`,
      background: active ? DOMNA.navy : DOMNA.white,
      color: active ? DOMNA.white : DOMNA.text,
      cursor: 'pointer',
      marginBottom: 10,
    }),
    panel: {
      background: DOMNA.white,
      border: `1px solid ${DOMNA.border}`,
      borderRadius: 22,
      padding: 16,
      boxShadow: '0 2px 10px rgba(11,31,58,0.04)',
    },
    main: {
      padding: 22,
      overflow: 'hidden',
    },
    topRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
      marginBottom: 18,
      flexWrap: 'wrap',
    },
    title: {
      fontSize: 22,
      fontWeight: 700,
      margin: 0,
      color: DOMNA.navy,
    },
    actions: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    input: {
      border: `1px solid ${DOMNA.border}`,
      borderRadius: 14,
      padding: '10px 12px',
      background: DOMNA.white,
      color: DOMNA.text,
      width: '100%',
      boxSizing: 'border-box',
    },
    button: (tone = 'primary') => ({
      border: tone === 'secondary' ? `1px solid ${DOMNA.border}` : `1px solid ${DOMNA.navy}`,
      background: tone === 'secondary' ? DOMNA.white : DOMNA.navy,
      color: tone === 'secondary' ? DOMNA.text : DOMNA.white,
      borderRadius: 14,
      padding: '10px 14px',
      cursor: 'pointer',
      fontWeight: 600,
    }),
    metricGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))',
      gap: 12,
      marginBottom: 16,
    },
    metricCard: {
      background: DOMNA.white,
      border: `1px solid ${DOMNA.border}`,
      borderRadius: 20,
      padding: 14,
    },
    metricValue: {
      fontSize: 28,
      fontWeight: 700,
      color: DOMNA.navy,
      marginTop: 6,
    },
    workspaceGrid: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 0.9fr',
      gap: 14,
      marginBottom: 16,
    },
    boardLaneWrap: {
      overflowX: 'auto',
      paddingBottom: 8,
    },
    boardLaneInner: {
      display: 'flex',
      gap: 14,
      minWidth: 'max-content',
      alignItems: 'flex-start',
    },
    column: {
      width: 320,
      background: DOMNA.white,
      border: `1px solid ${DOMNA.border}`,
      borderRadius: 22,
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(11,31,58,0.04)',
    },
    columnHeader: (bg) => ({
      padding: 14,
      background: bg,
      borderBottom: `1px solid ${DOMNA.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    }),
    card: (dragging = false) => ({
      background: DOMNA.white,
      border: `1px solid ${dragging ? DOMNA.blue : DOMNA.border}`,
      borderRadius: 18,
      padding: 12,
      marginBottom: 10,
      cursor: 'grab',
      boxShadow: dragging
        ? '0 8px 20px rgba(21,62,117,0.18)'
        : '0 1px 6px rgba(11,31,58,0.06)',
      opacity: dragging ? 0.92 : 1,
    }),
    badge: (bg, color = DOMNA.text) => ({
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: 999,
      background: bg,
      color,
      fontSize: 12,
      marginRight: 6,
      marginBottom: 6,
      border: `1px solid ${DOMNA.border}`,
    }),
    small: {
      color: DOMNA.muted,
      fontSize: 13,
      lineHeight: 1.45,
    },
    modalShade: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 24, 44, 0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      zIndex: 50,
    },
    modal: {
      width: 'min(1050px, 95vw)',
      maxHeight: '90vh',
      overflow: 'auto',
      background: DOMNA.white,
      borderRadius: 24,
      border: `1px solid ${DOMNA.border}`,
      display: 'grid',
      gridTemplateColumns: '1.2fr 0.8fr',
    },
  }
}

function metricValueForType(type, tasks) {
  if (type === 'total') return tasks.length
  if (type === 'qa_open') {
    return tasks.filter((t) => (t.qa_status || '').toLowerCase() !== 'passed').length
  }
  if (type === 'high_priority') {
    return tasks.filter((t) => (t.priority || '').toLowerCase() === 'high').length
  }
  if (type === 'due_soon') {
    const today = new Date()
    const threshold = new Date(today)
    threshold.setDate(today.getDate() + 2)
    return tasks.filter((t) => {
      if (!t.due_date) return false
      const d = new Date(t.due_date)
      return d >= new Date(today.toDateString()) && d <= threshold
    }).length
  }
  return tasks.filter((t) => (t.status || '') === type).length
}

function toneForColumn(name) {
  const n = (name || '').toLowerCase()
  if (n.includes('assign')) return DOMNA.sky
  if (n.includes('survey')) return DOMNA.amber
  if (n.includes('qa')) return DOMNA.red
  if (n.includes('submit')) return DOMNA.green
  if (n.includes('support')) return DOMNA.red
  if (n.includes('stable')) return DOMNA.green
  return '#EEF3F8'
}

function priorityColor(priority) {
  const p = (priority || '').toLowerCase()
  if (p === 'high') return '#FFE2E0'
  if (p === 'medium') return '#FFF0CF'
  return '#E7F6EC'
}

function statusColor(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('qa')) return '#FFD9DC'
  if (s.includes('submit')) return '#D3F2E0'
  if (s.includes('survey')) return '#FFE6B8'
  return '#E8F0FA'
}

function DraggableTask({ task, onOpen }) {
  const s = styles()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = {
    ...s.card(isDragging),
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={() => onOpen(task)}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>{task.title}</div>
      <div>
        <span style={s.badge(priorityColor(task.priority), '#A12A2A')}>{task.priority || 'Medium'}</span>
        <span style={s.badge('#F4F7FB')}>QA: {task.qa_status || 'Pending'}</span>
        <span style={s.badge('#F4F7FB')}>MagicPlan: {task.magicplan || 'No'}</span>
        <span style={s.badge(statusColor(task.status))}>{task.status || 'Open'}</span>
      </div>
      <div style={{ ...s.small, marginTop: 6 }}>Assessor: {task.assessor || 'Unassigned'}</div>
      <div style={{ ...s.small, marginTop: 4 }}>Due: {task.due_date || 'Not set'}</div>
      <div style={{ ...s.small, marginTop: 4 }}>
        Issues: {Array.isArray(task.issues) && task.issues.length ? task.issues.join(', ') : 'No issues'}
      </div>
      <div style={{ ...s.small, marginTop: 4 }}>Comments: {task.comment_count || 0}</div>
    </div>
  )
}

function DroppableColumn({ group, tasks, onOpen, onRename }) {
  const s = styles()
  const { setNodeRef, isOver } = useDroppable({
    id: group.id,
    data: { group },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        ...s.column,
        outline: isOver ? `2px solid ${DOMNA.blue}` : 'none',
      }}
    >
      <div style={s.columnHeader(toneForColumn(group.name))}>
        <div style={{ fontWeight: 700 }}>{group.name}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={s.badge(DOMNA.white)}>{tasks.length}</span>
          <button style={s.button('secondary')} type="button" onClick={() => onRename(group)}>
            Rename
          </button>
        </div>
      </div>
      <div style={{ padding: 12, minHeight: 220, background: isOver ? '#F7FBFF' : 'transparent' }}>
        {tasks.map((task) => (
          <DraggableTask key={task.id} task={task} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const s = styles()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const [boards, setBoards] = useState([])
  const [selectedBoardId, setSelectedBoardId] = useState(null)
  const [groups, setGroups] = useState([])
  const [tasks, setTasks] = useState([])
  const [commentsByTask, setCommentsByTask] = useState({})
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemGroup, setNewItemGroup] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [renameGroup, setRenameGroup] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [metricCards, setMetricCards] = useState(defaultMetricCards)
  const [editingMetricKey, setEditingMetricKey] = useState(null)

  useEffect(() => {
    loadBoards()
  }, [])

  useEffect(() => {
    if (selectedBoardId) {
      loadBoardData(selectedBoardId)
    }
  }, [selectedBoardId])

  async function loadBoards() {
    if (!supabase) {
      setNotice('Preview mode active. Add Supabase environment variables in the real Next.js app to load live data.')
      setBoards([])
      return
    }

    const { data, error } = await supabase.from('boards').select('*').order('name')
    if (error) {
      setNotice(error.message)
      return
    }

    setBoards(data || [])
    if (data?.length && !selectedBoardId) {
      setSelectedBoardId(data[0].id)
    }
  }

  async function loadBoardData(boardId) {
    if (!supabase) return

    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true })

    if (groupError) {
      setNotice(groupError.message)
      return
    }

    const ids = (groupData || []).map((g) => g.id)
    let taskData = []

    if (ids.length) {
      const { data: fetchedTasks, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .in('group_id', ids)
        .order('created_at', { ascending: true })

      if (taskError) {
        setNotice(taskError.message)
        return
      }

      taskData = fetchedTasks || []
    }

    let commentMap = {}
    if (taskData.length) {
      const { data: commentRows } = await supabase
        .from('comments')
        .select('*')
        .in('task_id', taskData.map((t) => t.id))
        .order('created_at', { ascending: true })

      commentMap = (commentRows || []).reduce((acc, row) => {
        acc[row.task_id] = acc[row.task_id] || []
        acc[row.task_id].push(row)
        return acc
      }, {})
    }

    const taskRows = taskData.map((t) => ({
      ...t,
      comment_count: (commentMap[t.id] || []).length,
    }))

    setGroups(groupData || [])
    setTasks(taskRows)
    setCommentsByTask(commentMap)
    setNotice('')
  }

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tasks

    return tasks.filter((task) => {
      const hay = [
        task.title,
        task.status,
        task.assessor,
        task.qa_status,
        task.notes,
        ...(Array.isArray(task.issues) ? task.issues : []),
      ]
        .join(' ')
        .toLowerCase()

      return hay.includes(q)
    })
  }, [tasks, search])

  const tasksByGroup = useMemo(() => {
    const map = {}
    for (const group of groups) map[group.id] = []
    for (const task of filteredTasks) {
      if (!map[task.group_id]) map[task.group_id] = []
      map[task.group_id].push(task)
    }
    return map
  }, [groups, filteredTasks])

  async function addTask() {
    if (!supabase) return
    if (!newItemTitle.trim() || !newItemGroup) return

    const group = groups.find((g) => g.id === newItemGroup)
    const payload = {
      group_id: newItemGroup,
      title: newItemTitle.trim(),
      status: group?.name || 'Open',
      priority: 'Medium',
      assessor: '',
      qa_status: 'Pending',
      magicplan: 'No',
      notes: '',
      issues: [],
    }

    const { error } = await supabase.from('tasks').insert([payload])
    if (error) {
      setNotice(error.message)
      return
    }

    setNewItemTitle('')
    await loadBoardData(selectedBoardId)
  }

  async function addGroup() {
    if (!supabase) return
    if (!newGroupName.trim() || !selectedBoardId) return

    const nextPosition = groups.length + 1
    const { error } = await supabase.from('groups').insert([
      {
        board_id: selectedBoardId,
        name: newGroupName.trim(),
        position: nextPosition,
      },
    ])

    if (error) {
      setNotice(error.message)
      return
    }

    setNewGroupName('')
    await loadBoardData(selectedBoardId)
  }

  async function saveRenamedGroup() {
    if (!supabase) return
    if (!renameGroup || !renameValue.trim()) return

    const { error } = await supabase
      .from('groups')
      .update({ name: renameValue.trim() })
      .eq('id', renameGroup.id)

    if (error) {
      setNotice(error.message)
      return
    }

    const affected = tasks.filter((t) => t.group_id === renameGroup.id)
    if (affected.length) {
      await Promise.all(
        affected.map((task) =>
          supabase.from('tasks').update({ status: renameValue.trim() }).eq('id', task.id)
        )
      )
    }

    setRenameGroup(null)
    setRenameValue('')
    await loadBoardData(selectedBoardId)
  }

  async function handleDragEnd(event) {
    if (!supabase) return

    const { active, over } = event
    if (!over) return

    const taskId = active.id
    const newGroupId = over.id
    const targetGroup = groups.find((g) => g.id === newGroupId)
    if (!targetGroup) return

    const { error } = await supabase
      .from('tasks')
      .update({ group_id: newGroupId, status: targetGroup.name })
      .eq('id', taskId)

    if (error) {
      setNotice(error.message)
      return
    }

    await loadBoardData(selectedBoardId)
  }

  async function saveTaskChanges() {
    if (!supabase) return
    if (!selectedTask) return

    const payload = {
      title: selectedTask.title,
      priority: selectedTask.priority,
      assessor: selectedTask.assessor,
      due_date: selectedTask.due_date || null,
      qa_status: selectedTask.qa_status,
      magicplan: selectedTask.magicplan,
      notes: selectedTask.notes,
      issues: Array.isArray(selectedTask.issues)
        ? selectedTask.issues
        : String(selectedTask.issues || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean),
    }

    const { error } = await supabase.from('tasks').update(payload).eq('id', selectedTask.id)
    if (error) {
      setNotice(error.message)
      return
    }

    await loadBoardData(selectedBoardId)
    setSelectedTask(null)
  }

  async function addTaskComment() {
    if (!supabase) return
    if (!selectedTask || !newComment.trim()) return

    const { error } = await supabase.from('comments').insert([
      {
        task_id: selectedTask.id,
        author: 'Seb',
        text: newComment.trim(),
      },
    ])

    if (error) {
      setNotice(error.message)
      return
    }

    setNewComment('')
    await loadBoardData(selectedBoardId)
  }

  function updateMetricLabel(metricKey, label) {
    setMetricCards((prev) => prev.map((m) => (m.key === metricKey ? { ...m, label } : m)))
  }

  function openTask(task) {
    const fullTask = tasks.find((t) => t.id === task.id) || task
    setSelectedTask({ ...fullTask })
  }

  const metricOptions = [
    { value: 'total', label: 'Total items' },
    { value: 'qa_open', label: 'QA open' },
    { value: 'high_priority', label: 'High priority' },
    { value: 'due_soon', label: 'Due soon' },
    ...groups.map((g) => ({ value: g.name, label: `Status: ${g.name}` })),
  ]

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <aside style={s.sidebar}>
          <div style={s.brandWrap}>
            <div style={s.logo}>D</div>
            <div>
              <div style={{ fontWeight: 700, color: DOMNA.navy }}>Domna Homes</div>
              <div style={{ fontSize: 12, color: DOMNA.muted, marginTop: 2 }}>
                Retrofit operations platform
              </div>
            </div>
          </div>

          {boards.map((board) => (
            <button
              key={board.id}
              style={s.boardButton(board.id === selectedBoardId)}
              onClick={() => setSelectedBoardId(board.id)}
              type="button"
            >
              <div style={{ fontWeight: 700 }}>{board.name}</div>
            </button>
          ))}
        </aside>

        <main style={s.main}>
          {notice ? (
            <div style={{ ...s.panel, marginBottom: 14, color: '#7E2222' }}>
              Data note: {notice}
            </div>
          ) : null}

          <div style={s.topRow}>
            <div>
              <h1 style={s.title}>Domna Homes Operations Platform</h1>
              <div style={{ ...s.small, marginTop: 6, maxWidth: 760 }}>
                Tech-led assessments, clear workflows, and operational oversight aligned to
                Domna&apos;s retrofit service model.
              </div>
            </div>

            <div style={s.actions}>
              <input
                style={{ ...s.input, width: 270 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks, issues, people..."
              />
              <button
                style={s.button('secondary')}
                onClick={() => loadBoardData(selectedBoardId)}
                type="button"
              >
                Refresh
              </button>
            </div>
          </div>

          <div style={s.metricGrid}>
            {metricCards.map((metric) => (
              <div key={metric.key} style={s.metricCard}>
                {editingMetricKey === metric.key ? (
                  <input
                    style={s.input}
                    value={metric.label}
                    onChange={(e) => updateMetricLabel(metric.key, e.target.value)}
                    onBlur={() => setEditingMetricKey(null)}
                    autoFocus
                  />
                ) : (
                  <div
                    onDoubleClick={() => setEditingMetricKey(metric.key)}
                    style={{ cursor: 'text', color: DOMNA.muted }}
                  >
                    {metric.label}
                  </div>
                )}
                <div style={s.metricValue}>{metricValueForType(metric.type, tasks)}</div>
                <div style={{ marginTop: 8 }}>
                  <select
                    style={s.input}
                    value={metric.type}
                    onChange={(e) =>
                      setMetricCards((prev) =>
                        prev.map((m) => (m.key === metric.key ? { ...m, type: e.target.value } : m))
                      )
                    }
                  >
                    {metricOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div style={s.workspaceGrid}>
            <div style={s.panel}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Add board item</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px 120px', gap: 10 }}>
                <input
                  style={s.input}
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Example: 54 Market Street - QA Review"
                />
                <select
                  style={s.input}
                  value={newItemGroup}
                  onChange={(e) => setNewItemGroup(e.target.value)}
                >
                  <option value="">Select column</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <button style={s.button()} onClick={addTask} type="button">
                  Add item
                </button>
              </div>
            </div>

            <div style={s.panel}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Manage columns</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
                <input
                  style={s.input}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="New column name"
                />
                <button style={s.button()} onClick={addGroup} type="button">
                  Add column
                </button>
              </div>
              <div style={{ ...s.small, marginTop: 10 }}>
                You can rename any column from the board itself. Drag items into a column and the
                task status updates automatically.
              </div>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div style={s.boardLaneWrap}>
              <div style={s.boardLaneInner}>
                {groups.map((group) => (
                  <DroppableColumn
                    key={group.id}
                    group={group}
                    tasks={tasksByGroup[group.id] || []}
                    onOpen={openTask}
                    onRename={(g) => {
                      setRenameGroup(g)
                      setRenameValue(g.name)
                    }}
                  />
                ))}
              </div>
            </div>
          </DndContext>
        </main>
      </div>

      {renameGroup ? (
        <div style={s.modalShade}>
          <div style={{ ...s.panel, width: 420 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Rename column</div>
            <input style={s.input} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button style={s.button('secondary')} onClick={() => setRenameGroup(null)} type="button">
                Cancel
              </button>
              <button style={s.button()} onClick={saveRenamedGroup} type="button">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedTask ? (
        <div style={s.modalShade}>
          <div style={s.modal}>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 20 }}>{selectedTask.title}</div>
                <button style={s.button('secondary')} onClick={() => setSelectedTask(null)} type="button">
                  Close
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={s.small}>Task title</div>
                  <input
                    style={s.input}
                    value={selectedTask.title || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                  />
                </div>
                <div>
                  <div style={s.small}>Assessor</div>
                  <input
                    style={s.input}
                    value={selectedTask.assessor || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, assessor: e.target.value })}
                  />
                </div>
                <div>
                  <div style={s.small}>Priority</div>
                  <select
                    style={s.input}
                    value={selectedTask.priority || 'Medium'}
                    onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <div style={s.small}>Due date</div>
                  <input
                    type="date"
                    style={s.input}
                    value={selectedTask.due_date || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <div style={s.small}>QA status</div>
                  <input
                    style={s.input}
                    value={selectedTask.qa_status || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, qa_status: e.target.value })}
                  />
                </div>
                <div>
                  <div style={s.small}>MagicPlan</div>
                  <input
                    style={s.input}
                    value={selectedTask.magicplan || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, magicplan: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={s.small}>Issues (comma separated)</div>
                <input
                  style={s.input}
                  value={Array.isArray(selectedTask.issues) ? selectedTask.issues.join(', ') : selectedTask.issues || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, issues: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={s.small}>Notes</div>
                <textarea
                  style={{ ...s.input, minHeight: 150, resize: 'vertical' }}
                  value={selectedTask.notes || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                <button style={s.button()} onClick={saveTaskChanges} type="button">
                  Save changes
                </button>
              </div>
            </div>

            <div style={{ padding: 20, borderLeft: `1px solid ${DOMNA.border}`, background: '#F8FBFE' }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Updates</div>
              <div style={{ maxHeight: 340, overflow: 'auto', marginBottom: 12 }}>
                {(commentsByTask[selectedTask.id] || []).length ? (
                  commentsByTask[selectedTask.id].map((comment) => (
                    <div key={comment.id} style={{ ...s.panel, marginBottom: 10, padding: 12 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{comment.author}</div>
                      <div style={s.small}>{comment.text}</div>
                    </div>
                  ))
                ) : (
                  <div style={s.small}>No updates yet.</div>
                )}
              </div>

              <textarea
                style={{ ...s.input, minHeight: 120, resize: 'vertical' }}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add update, QA note, or manager comment"
              />
              <div style={{ marginTop: 10 }}>
                <button style={s.button()} onClick={addTaskComment} type="button">
                  Add update
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
