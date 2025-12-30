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
import { normalizeAllTasks, sortHousekeepingTasks } from "../../utils/taskNormalizer"
import { updateMultipleMaintenanceTasks } from "../../redux/slice/maintenanceSlice"
import {
    fetchHousekeepingPendingTasks,
    fetchHousekeepingHistoryTasks,
    submitHousekeepingTasks,
} from "../../redux/slice/housekeepingSlice"

/**
 * UnifiedTaskPage - Main page component for unified task management
 * Fetches and merges data from Checklist, Maintenance, and Housekeeping systems
 */



export default function UnifiedTaskPage() {
    // State
    const [userRole, setUserRole] = useState("")
    const [username, setUsername] = useState("")
    const [systemAccess, setSystemAccess] = useState([]) // New state for system access

    const dispatch = useDispatch()

    // Redux selectors
    const checklistState = useSelector((state) => state.checkList)
    const maintenanceState = useSelector((state) => state.maintenance)
    const housekeepingState = useSelector((state) => state.housekeeping)

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
        assignedPersonnel = []
    } = maintenanceState || {}

    const {
        pendingTasks: housekeepingTasks = [],
        historyTasks: housekeepingHistory = [],
        loading: housekeepingLoading,
        error: housekeepingError,
        pendingPage: housekeepingPendingPage = 1,
        pendingHasMore: housekeepingPendingHasMore = false,
    } = housekeepingState || {}

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

    // Update loadHousekeepingData function to respect system_access
    // Backend now uses query params for department filtering (no token required)
    const loadHousekeepingData = useCallback(async () => {
        // Check if user has housekeeping access
        if (!hasSystemAccess('housekeeping') && systemAccess.length > 0) {
            return
        }

        // Pass department filter from user_access1 in query params
        const filters = {}
        const role = localStorage.getItem("role")
        if (role?.toLowerCase() === "user") {
            // Use user_access1 for housekeeping, fallback to user_access
            const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || ""
            const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
            const accessToUse = userAccess1 || userAccess
            if (accessToUse) {
                // Pass department as query param (comma-separated)
                filters.department = accessToUse
            }
        }
        await dispatch(fetchHousekeepingPendingTasks({ page: 1, filters })).unwrap()
    }, [hasSystemAccess, systemAccess, dispatch])

    // Load housekeeping history data
    // Backend now uses query params for department filtering (no token required)
    const loadHousekeepingHistoryData = useCallback(async () => {
        // Pass department filter from user_access1 in query params
        const filters = {}
        const role = localStorage.getItem("role")
        if (role?.toLowerCase() === "user") {
            // Use user_access1 for housekeeping, fallback to user_access
            const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || ""
            const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
            const accessToUse = userAccess1 || userAccess
            if (accessToUse) {
                // Pass department as query param (comma-separated)
                filters.department = accessToUse
            }
        }
        await dispatch(fetchHousekeepingHistoryTasks({ page: 1, filters })).unwrap()
    }, [dispatch])

    // Combine loading states
    const isLoading = checklistLoading || maintenanceLoading || housekeepingLoading

    // Load all data sources (pending + history) based on system_access
    useEffect(() => {
        const role = localStorage.getItem("role")
        const user = localStorage.getItem("user-name")

        // Load checklist data only if user has access
        if (hasSystemAccess('checklist') || systemAccess.length === 0) {
            dispatch(checklistData(1))
            dispatch(checklistHistoryData(1))
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
        }

        // Load housekeeping data only if user has access
        if (hasSystemAccess('housekeeping') || systemAccess.length === 0) {
            loadHousekeepingData()
            loadHousekeepingHistoryData()
        }
    }, [dispatch, hasSystemAccess, systemAccess, loadHousekeepingData, loadHousekeepingHistoryData])

    // Callback to load more checklist data (called on scroll)
    const loadMoreChecklistData = useCallback(() => {
        if (checklistHasMore && !checklistLoading) {
            dispatch(checklistData(checklistCurrentPage + 1))
        }
    }, [checklistHasMore, checklistLoading, checklistCurrentPage, dispatch])

    // Callback to load more housekeeping data (called on scroll)
    const loadMoreHousekeepingData = useCallback(async () => {
        if (housekeepingPendingHasMore && !housekeepingLoading) {
            const filters = {}
            const role = localStorage.getItem("role")
            if (role?.toLowerCase() === "user") {
                const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || ""
                const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
                const accessToUse = userAccess1 || userAccess
                if (accessToUse) {
                    filters.department = accessToUse
                }
            }
            await dispatch(fetchHousekeepingPendingTasks({ 
                page: housekeepingPendingPage + 1, 
                filters 
            })).unwrap()
        }
    }, [housekeepingPendingHasMore, housekeepingLoading, housekeepingPendingPage, dispatch])

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

        // Filter housekeeping tasks based on access and user_access departments
        let housekeepingFiltered = []
        let housekeepingHistoryFiltered = []
        
        if (hasSystemAccess('housekeeping') || systemAccess.length === 0) {
            const allHousekeepingTasks = Array.isArray(housekeepingTasks) ? housekeepingTasks : []
            const allHousekeepingHistory = Array.isArray(housekeepingHistory) ? housekeepingHistory : []
            
            // Get current role from localStorage (stable value)
            const currentRole = localStorage.getItem("role") || ""
            
            // For user role, filter by user_access1 departments (for housekeeping)
            if (currentRole?.toLowerCase() === "user") {
                // Use user_access1 for housekeeping, fallback to user_access
                const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || ""
                const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
                const accessToUse = userAccess1 || userAccess
                
                if (accessToUse) {
                    // Parse departments (comma-separated)
                    const userDepartments = accessToUse.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
                    
                    // Filter tasks to only show those matching user's departments
                    // Match exact or normalized match (case-insensitive, space-normalized)
                    const normalizeDept = (dept) => dept.replace(/\s+/g, ' ').trim().toLowerCase()
                    
                    housekeepingFiltered = allHousekeepingTasks.filter(task => {
                        const taskDept = normalizeDept(task.department || '')
                        if (!taskDept) return false
                        return userDepartments.some(userDept => {
                            const normalizedUserDept = normalizeDept(userDept)
                            // Exact match
                            if (taskDept === normalizedUserDept) return true
                            // Partial match - task department contains user department or vice versa
                            if (taskDept.includes(normalizedUserDept) || normalizedUserDept.includes(taskDept)) return true
                            return false
                        })
                    })
                    
                    housekeepingHistoryFiltered = allHousekeepingHistory.filter(task => {
                        const taskDept = normalizeDept(task.department || '')
                        if (!taskDept) return false
                        return userDepartments.some(userDept => {
                            const normalizedUserDept = normalizeDept(userDept)
                            // Exact match
                            if (taskDept === normalizedUserDept) return true
                            // Partial match - task department contains user department or vice versa
                            if (taskDept.includes(normalizedUserDept) || normalizedUserDept.includes(taskDept)) return true
                            return false
                        })
                    })
                } else {
                    // No user_access1 or user_access, show nothing for user role
                    housekeepingFiltered = []
                    housekeepingHistoryFiltered = []
                }
            } else {
                // Admin role - show all housekeeping tasks
                housekeepingFiltered = allHousekeepingTasks
                housekeepingHistoryFiltered = allHousekeepingHistory
            }
        }

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

        // Sort housekeeping tasks: confirmed first
        return sortHousekeepingTasks(allCombined)
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
                await dispatch(submitHousekeepingTasks([{
                    task_id: taskId,
                    status,
                    remark: remarks,
                    doer_name2: updateData.doerName2 || '',  // Include doer_name2 if provided
                    attachment: originalData?.attachment,
                }])).unwrap()
                await loadHousekeepingData()
                break

            default:
                throw new Error(`Unknown source system: ${sourceSystem}`)
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
                ? dispatch(submitHousekeepingTasks(
                    tasksBySource.housekeeping.map(t => ({
                        task_id: t.taskId,
                        status: t.status,
                        remark: t.remarks || '',
                        doer_name2: t.doerName2 || '',  // Include doer_name2 from select box
                        attachment: t.originalData?.attachment,
                    }))
                )).unwrap()
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
            <div className="space-y-3 sm:space-y-4 md:space-y-6 p-2 sm:p-4 md:p-0">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-blue-700">
                        Unified Task Management
                    </h1>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                        <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-gray-500 truncate">Total Tasks</p>
                                    <p className="text-lg sm:text-xl font-bold">{statistics.total}</p>
                                </div>
                            </div>

                            <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1 sm:gap-2 text-xs text-gray-500">
                                {hasSystemAccess('checklist') && (
                                    <span className="px-1 sm:px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                        {statistics.bySource.checklist} C
                                    </span>
                                )}
                                {hasSystemAccess('maintenance') && (
                                    <span className="px-1 sm:px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                        {statistics.bySource.maintenance} M
                                    </span>
                                )}
                                {hasSystemAccess('housekeeping') && (
                                    <span className="px-1 sm:px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                        {statistics.bySource.housekeeping} H
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-gray-500 truncate">Completed</p>
                                    <p className="text-lg sm:text-xl font-bold">{statistics.completed}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="bg-yellow-100 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-gray-500 truncate">Pending</p>
                                    <p className="text-lg sm:text-xl font-bold">{statistics.pending}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="bg-red-100 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-gray-500 truncate">High Priority</p>
                                    <p className="text-lg sm:text-xl font-bold">{statistics.highPriority}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {housekeepingError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-2 sm:px-4 py-2 sm:py-3 rounded-md text-xs sm:text-sm">
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
                    onLoadMore={() => {
                        // Load more for both checklist and housekeeping
                        loadMoreChecklistData()
                        loadMoreHousekeepingData()
                    }}
                    hasMore={checklistHasMore || housekeepingPendingHasMore}
                />
            </div>
        </AdminLayout>
    )
}