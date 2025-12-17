"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { BarChart3, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"
import UnifiedTaskTable from "../../components/unified/UnifiedTaskTable"
import { useDispatch, useSelector } from "react-redux"
import { checklistData, checklistHistoryData, updateChecklist } from "../../redux/slice/checklistSlice"
import {
    fetchPendingMaintenanceTasks,
    fetchCompletedMaintenanceTasks,
    fetchUniqueMachineNames,
    fetchUniqueAssignedPersonnel
} from "../../redux/slice/maintenanceSlice"
import { getPendingTasks, getHistoryTasks } from "../../components/api/delegationApi"
import {
    normalizeAllTasks,
    normalizeChecklistTask,
    normalizeMaintenanceTask,
    normalizeHousekeepingTask
} from "../../utils/taskNormalizer"
import { updateMultipleMaintenanceTasks } from "../../redux/slice/maintenanceSlice"
import { submitTasks as submitHousekeepingTasks } from "../../components/api/delegationApi"

/**
 * UnifiedTaskPage - Main page component for unified task management
 * Fetches and merges data from Checklist, Maintenance, and Housekeeping systems
 */
export default function UnifiedTaskPage() {
    // State
    const [housekeepingTasks, setHousekeepingTasks] = useState([])
    const [housekeepingLoading, setHousekeepingLoading] = useState(false)
    const [housekeepingError, setHousekeepingError] = useState(null)
    const [userRole, setUserRole] = useState("")
    const [username, setUsername] = useState("")
    const [showHistory, setShowHistory] = useState(false)
    const [systemAccess, setSystemAccess] = useState([]) // New state for system access

    const dispatch = useDispatch()

    // Redux selectors - ADD THIS SECTION
    const checklistState = useSelector((state) => state.checkList)
    const maintenanceState = useSelector((state) => state.maintenance)

    // Destructure variables from redux state - ADD THIS SECTION
    const {
        checklist = [],
        history: checklistHistory = [],
        loading: checklistLoading,
        hasMore: checklistHasMore = false,
        currentPage: checklistCurrentPage = 1,
    } = checklistState || {}

    const {
        tasks: maintenanceTasks = [],
        history: maintenanceHistory = [],
        loading: maintenanceLoading,
        machineNames = [],
        assignedPersonnel = []
    } = maintenanceState || {}

    // Housekeeping history state
    const [housekeepingHistory, setHousekeepingHistory] = useState([])

    // Load user info
    useEffect(() => {
        const role = localStorage.getItem("role")
        const user = localStorage.getItem("user-name")
        const access = localStorage.getItem("system_access") || ""

        setUserRole(role || "")
        setUsername(user || "")
        setSystemAccess(access.split(',').map(item => item.trim().toLowerCase()))
    }, [])

    // Function to check if user has access to a system
    const hasSystemAccess = useCallback((system) => {
        if (systemAccess.length === 0) return true; // If no restriction, allow all
        return systemAccess.includes(system.toLowerCase());
    }, [systemAccess])

    // Load housekeeping history data
    const loadHousekeepingHistoryData = useCallback(async () => {
        try {
            const data = await getHistoryTasks({})
            console.log("=== DEBUG: Housekeeping history loaded ===", data?.length || 0)
            setHousekeepingHistory(data || [])
        } catch (error) {
            console.error("Error loading housekeeping history:", error)
            setHousekeepingHistory([])
        }
    }, [])

    // Combine loading states
    const isLoading = checklistLoading || maintenanceLoading || housekeepingLoading

    // Load all data sources (pending + history) based on system_access
    useEffect(() => {
        const role = localStorage.getItem("role")
        const user = localStorage.getItem("user-name")

        console.log("=== DEBUG: Loading Data ===")
        console.log("User role:", role, "Username:", user)
        console.log("System access:", systemAccess)

        // Load checklist data only if user has access
        if (hasSystemAccess('checklist') || systemAccess.length === 0) {
            dispatch(checklistData(1))
            dispatch(checklistHistoryData(1))
        } else {
            console.log("User doesn't have access to checklist system")
        }

        // Load maintenance data only if user has access
        if (hasSystemAccess('maintenance') || systemAccess.length === 0) {
            dispatch(fetchPendingMaintenanceTasks({
                page: 1,
                userId: role === "user" ? user : null
            }))
            dispatch(fetchCompletedMaintenanceTasks({ page: 1, filters: {} }))
            dispatch(fetchUniqueMachineNames())
            dispatch(fetchUniqueAssignedPersonnel())
        } else {
            console.log("User doesn't have access to maintenance system")
        }

        // Load housekeeping data only if user has access
        if (hasSystemAccess('housekeeping') || systemAccess.length === 0) {
            loadHousekeepingData()
            loadHousekeepingHistoryData()
        } else {
            console.log("User doesn't have access to housekeeping system")
        }
    }, [dispatch, hasSystemAccess, systemAccess])

    // Update loadHousekeepingData function to respect system_access
    const loadHousekeepingData = useCallback(async () => {
        // Check if user has housekeeping access
        if (!hasSystemAccess('housekeeping') && systemAccess.length > 0) {
            console.log("User doesn't have access to housekeeping system")
            setHousekeepingTasks([])
            return
        }

        setHousekeepingLoading(true)
        setHousekeepingError(null)
        try {
            const filters = {}
            const role = localStorage.getItem("role")
            if (role?.toLowerCase() === "user") {
                filters.name = localStorage.getItem("user-name")
            }
            const data = await getPendingTasks(filters)
            console.log("=== DEBUG: Housekeeping pending loaded ===", data?.length || 0)
            setHousekeepingTasks(data || [])
        } catch (error) {
            console.error("Error loading housekeeping data:", error)
            setHousekeepingError(error.message)
            setHousekeepingTasks([])
        } finally {
            setHousekeepingLoading(false)
        }
    }, [hasSystemAccess, systemAccess])

    // Callback to load more checklist data (called on scroll)
    const loadMoreChecklistData = useCallback(() => {
        if (checklistHasMore && !checklistLoading) {
            console.log("=== DEBUG: Loading more checklist data, page:", checklistCurrentPage + 1)
            dispatch(checklistData(checklistCurrentPage + 1))
        }
    }, [checklistHasMore, checklistLoading, checklistCurrentPage, dispatch])

    // Normalize and merge all tasks - filter based on system_access
    const allTasks = useMemo(() => {
        // Filter checklist tasks based on access
        const checklistFiltered = hasSystemAccess('checklist') || systemAccess.length === 0
            ? (Array.isArray(checklist) ? checklist : [])
            : []

        const checklistHistoryFiltered = hasSystemAccess('checklist') || systemAccess.length === 0
            ? (Array.isArray(checklistHistory) ? checklistHistory : [])
            : []

        // Filter maintenance tasks based on access
        const maintenanceFiltered = hasSystemAccess('maintenance') || systemAccess.length === 0
            ? (Array.isArray(maintenanceTasks) ? maintenanceTasks : [])
            : []

        const maintenanceHistoryFiltered = hasSystemAccess('maintenance') || systemAccess.length === 0
            ? (Array.isArray(maintenanceHistory) ? maintenanceHistory : [])
            : []

        // Filter housekeeping tasks based on access
        const housekeepingFiltered = hasSystemAccess('housekeeping') || systemAccess.length === 0
            ? (Array.isArray(housekeepingTasks) ? housekeepingTasks : [])
            : []

        const housekeepingHistoryFiltered = hasSystemAccess('housekeeping') || systemAccess.length === 0
            ? (Array.isArray(housekeepingHistory) ? housekeepingHistory : [])
            : []

        // Combine pending tasks from all accessible sources
        const pendingTasks = normalizeAllTasks(
            checklistFiltered,
            maintenanceFiltered,
            housekeepingFiltered
        )

        // Combine history tasks from all accessible sources
        const historyTasks = normalizeAllTasks(
            checklistHistoryFiltered,
            maintenanceHistoryFiltered,
            housekeepingHistoryFiltered,
            true // isHistory flag
        )

        // Combine all tasks (pending + history)
        const allCombined = [...pendingTasks, ...historyTasks]

        console.log("=== DEBUG: Filtered tasks ===", {
            checklist: checklistFiltered.length,
            maintenance: maintenanceFiltered.length,
            housekeeping: housekeepingFiltered.length,
            total: allCombined.length
        })

        return allCombined
    }, [
        checklist,
        checklistHistory,
        maintenanceTasks,
        maintenanceHistory,
        housekeepingTasks,
        housekeepingHistory,
        hasSystemAccess,
        systemAccess
    ])

    // Get unique assignees from all sources
    const allAssignees = useMemo(() => {
        const assigneesSet = new Set()

        // From maintenance
        assignedPersonnel.forEach(p => assigneesSet.add(p))

        // From all tasks
        allTasks.forEach(task => {
            if (task.assignedTo && task.assignedTo !== '—') {
                assigneesSet.add(task.assignedTo)
            }
        })

        return Array.from(assigneesSet).filter(Boolean).sort()
    }, [allTasks, assignedPersonnel])

    // Get unique departments from all sources
    const allDepartments = useMemo(() => {
        const departmentsSet = new Set()

        allTasks.forEach(task => {
            if (task.department && task.department !== '—') {
                departmentsSet.add(task.department)
            }
        })

        return Array.from(departmentsSet).filter(Boolean).sort()
    }, [allTasks])

    // Calculate statistics
    const statistics = useMemo(() => {
        const total = allTasks.length
        const completed = allTasks.filter(t =>
            t.status === 'Completed' || t.originalStatus === 'Yes'
        ).length
        const pending = allTasks.filter(t =>
            t.status === 'Pending' || t.originalStatus === 'Pending'
        ).length
        const highPriority = allTasks.filter(t => t.priority === 'High').length

        const bySource = {
            checklist: allTasks.filter(t => t.sourceSystem === 'checklist' && hasSystemAccess('checklist')).length,
            maintenance: allTasks.filter(t => t.sourceSystem === 'maintenance' && hasSystemAccess('maintenance')).length,
            housekeeping: allTasks.filter(t => t.sourceSystem === 'housekeeping' && hasSystemAccess('housekeeping')).length,
        }

        return { total, completed, pending, highPriority, bySource }
    }, [allTasks, hasSystemAccess])

    // Handle task update
    const handleUpdateTask = useCallback(async (updateData) => {
        const { taskId, sourceSystem, status, remarks, image, originalData } = updateData

        try {
            switch (sourceSystem) {
                case 'checklist':
                    await dispatch(updateChecklist([{
                        taskId,
                        status,
                        remarks,
                        image: image ? await fileToBase64(image) : null,
                    }])).unwrap()
                    dispatch(checklistData(1))
                    break

                case 'maintenance':
                    await dispatch(updateMultipleMaintenanceTasks([{
                        taskId,
                        status,
                        remarks,
                        image: image ? await fileToBase64(image) : null,
                    }])).unwrap()
                    dispatch(fetchPendingMaintenanceTasks({
                        page: 1,
                        userId: userRole === "user" ? username : null
                    }))
                    break

                case 'housekeeping':
                    await submitHousekeepingTasks([{
                        task_id: taskId,
                        status,
                        remark: remarks,
                        attachment: originalData?.attachment,
                    }])
                    await loadHousekeepingData()
                    break

                default:
                    throw new Error(`Unknown source system: ${sourceSystem}`)
            }
        } catch (error) {
            console.error("Error updating task:", error)
            throw error
        }
    }, [dispatch, userRole, username, loadHousekeepingData])

    // Handle bulk submit - receives data from UnifiedTaskTable inline editing
    const handleBulkSubmit = useCallback(async (submissionData) => {
        // submissionData is array of: { taskId, sourceSystem, status, soundStatus, temperature, remarks, image, originalData }

        // Group tasks by source system
        const tasksBySource = {
            checklist: [],
            maintenance: [],
            housekeeping: [],
        }

        submissionData.forEach(task => {
            tasksBySource[task.sourceSystem]?.push(task)
        })

        console.log("=== DEBUG: Bulk Submit ===", tasksBySource)

        const results = await Promise.allSettled([
            // Update checklist tasks
            tasksBySource.checklist.length > 0
                ? dispatch(updateChecklist(
                    tasksBySource.checklist.map(t => ({
                        taskId: t.taskId,
                        status: t.status,
                        remarks: t.remarks || '',
                        image: t.image,
                    }))
                )).unwrap()
                : Promise.resolve(),

            // Update maintenance tasks - with all fields
            tasksBySource.maintenance.length > 0
                ? dispatch(updateMultipleMaintenanceTasks(
                    tasksBySource.maintenance.map(t => ({
                        taskId: t.taskId,
                        status: t.status,
                        sound_status: t.soundStatus || '',
                        temperature_status: t.temperature || '',
                        remarks: t.remarks || '',
                        image: t.image,
                        actual_date: t.status === 'Yes'
                            ? new Date().toISOString().split('T')[0]
                            : null
                    }))
                )).unwrap()
                : Promise.resolve(),

            // Update housekeeping tasks
            tasksBySource.housekeeping.length > 0
                ? submitHousekeepingTasks(
                    tasksBySource.housekeeping.map(t => ({
                        task_id: t.taskId,
                        status: t.status,
                        remark: t.remarks || '',
                        attachment: t.originalData?.attachment,
                    }))
                )
                : Promise.resolve(),
        ])

        // Refresh all data
        dispatch(checklistData(1))
        dispatch(fetchPendingMaintenanceTasks({
            page: 1,
            userId: userRole === "user" ? username : null
        }))
        await loadHousekeepingData()

        // Check for errors
        const errors = results.filter(r => r.status === 'rejected')
        if (errors.length > 0) {
            console.error("Bulk submit errors:", errors)
            throw new Error(`${errors.length} update(s) failed`)
        }
    }, [dispatch, userRole, username, loadHousekeepingData])

    // File to base64 helper
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = (error) => reject(error)
        })
    }

    return (
        <AdminLayout>
            <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-blue-700">
                        Unified Task Management
                    </h1>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Tasks</p>
                                    <p className="text-xl font-bold">{statistics.total}</p>
                                </div>
                            </div>

                            <div className="mt-2 flex gap-2 text-xs text-gray-500">
                                {hasSystemAccess('checklist') && (
                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                        {statistics.bySource.checklist} Checklist
                                    </span>
                                )}
                                {hasSystemAccess('maintenance') && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                        {statistics.bySource.maintenance} Maint.
                                    </span>
                                )}
                                {hasSystemAccess('housekeeping') && (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                        {statistics.bySource.housekeeping} HK
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="bg-green-100 p-2 rounded-lg mr-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Completed</p>
                                    <p className="text-xl font-bold">{statistics.completed}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Pending</p>
                                    <p className="text-xl font-bold">{statistics.pending}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="bg-red-100 p-2 rounded-lg mr-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">High Priority</p>
                                    <p className="text-xl font-bold">{statistics.highPriority}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {housekeepingError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        Housekeeping data error: {housekeepingError}
                    </div>
                )}

                {/* Unified Task Table */}
                <UnifiedTaskTable
                    tasks={allTasks}
                    loading={isLoading}
                    onUpdateTask={handleUpdateTask}
                    onBulkSubmit={handleBulkSubmit}
                    assignedToOptions={allAssignees}
                    departmentOptions={allDepartments}
                    userRole={userRole}
                    username={username}
                    onLoadMore={loadMoreChecklistData}
                    hasMore={checklistHasMore}
                />
            </div>
        </AdminLayout>
    )
}