import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { disclosureService } from '@/services/disclosureService'
import { Disclosure, DisclosureStatus } from '@/types'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'

type ColumnType = 'assigned' | 'pending' | 'approved'

export default function LawyerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [disclosures, setDisclosures] = useState<Disclosure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    loadDisclosures()
  }, [])

  const loadDisclosures = async () => {
    try {
      const data = await disclosureService.getAll()
      setDisclosures(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load disclosures')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: DisclosureStatus) => {
    const badges = {
      [DisclosureStatus.DRAFT]: 'badge-draft',
      [DisclosureStatus.AI_PROCESSING]: 'badge-processing',
      [DisclosureStatus.READY_FOR_REVIEW]: 'badge-ready',
      [DisclosureStatus.IN_REVIEW]: 'badge-approved',
      [DisclosureStatus.REVISION_REQUESTED]: 'badge-revision',
      [DisclosureStatus.APPROVED]: 'badge-approved',
    }
    return badges[status] || 'badge-draft'
  }

  const handleLogout = () => {
    logout()
    navigate('/welcome')
  }

  // Categorize disclosures
  const assignedDisclosures = disclosures.filter(
    (d) =>
      d.status === DisclosureStatus.DRAFT ||
      d.status === DisclosureStatus.AI_PROCESSING ||
      d.status === DisclosureStatus.IN_REVIEW ||
      d.status === DisclosureStatus.REVISION_REQUESTED
  )
  const pendingReviewDisclosures = disclosures.filter(
    (d) => d.status === DisclosureStatus.READY_FOR_REVIEW
  )
  const approvedDisclosures = disclosures.filter(
    (d) => d.status === DisclosureStatus.APPROVED
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const disclosureId = active.id as number
    const overId = over.id

    // Only handle drops on columns (string IDs)
    if (typeof overId === 'string') {
      const targetColumn = overId as ColumnType
      const disclosure = disclosures.find((d) => d.id === disclosureId)
      if (!disclosure) return

      // Determine new status based on target column
      let newStatus: DisclosureStatus
      switch (targetColumn) {
        case 'assigned':
          newStatus = DisclosureStatus.IN_REVIEW
          break
        case 'pending':
          newStatus = DisclosureStatus.READY_FOR_REVIEW
          break
        case 'approved':
          newStatus = DisclosureStatus.APPROVED
          break
        default:
          return
      }

      // Don't update if status is the same
      if (disclosure.status === newStatus) return

      try {
        // Optimistically update UI
        setDisclosures((prev) =>
          prev.map((d) => (d.id === disclosureId ? { ...d, status: newStatus } : d))
        )

        // Update status on backend
        await disclosureService.updateStatus(disclosureId, newStatus)
      } catch (err: any) {
        // Revert on error
        await loadDisclosures()
        alert('Failed to update status: ' + (err.response?.data?.detail || 'Unknown error'))
      }
    }
  }

  const DraggableCard = ({ disclosure }: { disclosure: Disclosure }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: disclosure.id,
    })

    const style: React.CSSProperties = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.5 : 1,
      position: isDragging ? 'relative' : undefined,
      zIndex: isDragging ? 1000 : undefined,
    }

    return (
      <div ref={setNodeRef} style={style} className="mb-4">
        <div className="card-hover">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div
              {...listeners}
              {...attributes}
              className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing hover:bg-neutral-100 rounded p-1 transition-colors"
              title="Drag to move between columns"
            >
              <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
              </svg>
            </div>

            {/* Card Content */}
            <div
              className="flex-1 cursor-pointer"
              onClick={() => navigate(`/lawyer/disclosure/${disclosure.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold text-neutral-900">{disclosure.title}</h3>
                <span className={`status-badge text-xs ${getStatusBadge(disclosure.status)}`}>
                  {disclosure.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-600">
                <span className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(disclosure.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  ID: #{disclosure.id}
                </span>
              </div>
            </div>

            {/* Arrow Icon */}
            <svg className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  const DroppableColumn = ({
    column,
    title,
    disclosures: columnDisclosures,
    icon,
    emptyMessage,
    colorClass,
  }: {
    column: ColumnType
    title: string
    disclosures: Disclosure[]
    icon: React.ReactNode
    emptyMessage: string
    colorClass: string
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: column,
    })

    return (
      <div
        ref={setNodeRef}
        className={`flex flex-col h-full min-h-0 rounded-2xl border-2 transition-all duration-200 ${
          isOver
            ? `border-${colorClass}-500 bg-${colorClass}-50/70 border-dashed shadow-lg scale-[1.02]`
            : 'border-neutral-200 bg-white'
        }`}
      >
        {/* Column Header */}
        <div className={`px-6 py-4 border-b border-neutral-200 bg-${colorClass}-50/30 rounded-t-2xl flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-${colorClass}-100 rounded-xl flex items-center justify-center`}>
                {icon}
              </div>
              <div>
                <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
                <p className="text-xs text-neutral-600 mt-0.5">{columnDisclosures.length} cases</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {columnDisclosures.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 bg-${colorClass}-50 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                {icon}
              </div>
              <p className="text-neutral-500 text-sm">{emptyMessage}</p>
              <p className="text-neutral-400 text-xs mt-1">Drag cards here to update status</p>
            </div>
          ) : (
            columnDisclosures.map((disclosure) => (
              <DraggableCard key={disclosure.id} disclosure={disclosure} />
            ))
          )}
        </div>
      </div>
    )
  }

  const activeDisclosure = activeId ? disclosures.find((d) => d.id === activeId) : null

  // Custom collision detection that prioritizes droppable columns
  const customCollisionDetection = (args: Parameters<typeof rectIntersection>[0]) => {
    // First check if pointer is within any droppable
    const pointerCollisions = pointerWithin(args)

    // Filter to only include column droppables (string IDs)
    const columnCollisions = pointerCollisions.filter(
      (collision) => typeof collision.id === 'string'
    )

    if (columnCollisions.length > 0) {
      return columnCollisions
    }

    // Fall back to rectangle intersection
    const rectCollisions = rectIntersection(args)
    return rectCollisions.filter((collision) => typeof collision.id === 'string')
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
        <div className="h-screen flex flex-col bg-gradient-to-br from-neutral-50 via-navy-50/20 to-neutral-100 overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200 flex-shrink-0">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Limira</h1>
              <p className="text-sm text-navy-700 mt-1 font-medium">Patent Attorney Portal</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">{user?.full_name || user?.email}</p>
                <p className="text-xs text-neutral-500 mt-0.5">Patent Attorney</p>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm">
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 flex-shrink-0">
            <div className="card group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-neutral-600">Total Cases</h3>
                  <p className="text-4xl font-semibold text-neutral-900 mt-3 tracking-tight">{disclosures.length}</p>
                </div>
                <div className="w-14 h-14 bg-navy-100 rounded-2xl flex items-center justify-center group-hover:bg-navy-700 transition-colors">
                  <svg className="w-7 h-7 text-navy-700 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="card group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-neutral-600">Pending Reviews</h3>
                  <p className="text-4xl font-semibold text-amber-600 mt-3 tracking-tight">{pendingReviewDisclosures.length}</p>
                </div>
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                  <svg className="w-7 h-7 text-amber-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="card group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-neutral-600">Approved</h3>
                  <p className="text-4xl font-semibold text-emerald-600 mt-3 tracking-tight">{approvedDisclosures.length}</p>
                </div>
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                  <svg className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex-shrink-0">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-16 flex-1 flex items-center justify-center">
              <div>
                <div className="w-16 h-16 border-4 border-navy-200 border-t-navy-700 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading disclosures...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Drag and Drop Instructions */}
              <div className="bg-navy-50 border border-navy-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 flex-shrink-0">
                <svg className="w-5 h-5 text-navy-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-navy-800">
                  <strong>Tip:</strong> Drag the handle (⋮⋮) to move cards between columns and change status
                </p>
              </div>

              {/* Three Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                <DroppableColumn
                  column="assigned"
                  title="Assigned Disclosures"
                  disclosures={assignedDisclosures}
                  icon={
                    <svg className="w-6 h-6 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  emptyMessage="No assigned disclosures"
                  colorClass="navy"
                />

                <DroppableColumn
                  column="pending"
                  title="Pending Reviews"
                  disclosures={pendingReviewDisclosures}
                  icon={
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  emptyMessage="No pending reviews"
                  colorClass="amber"
                />

                <DroppableColumn
                  column="approved"
                  title="Approved"
                  disclosures={approvedDisclosures}
                  icon={
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  emptyMessage="No approved disclosures"
                  colorClass="emerald"
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDisclosure ? (
          <div className="card-hover opacity-90 shadow-2xl scale-105 rotate-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 pt-1">
                <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-neutral-900">{activeDisclosure.title}</h3>
                <p className="text-xs text-neutral-600 mt-1">ID: #{activeDisclosure.id}</p>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
