/**
 * Task Normalizer Utilities
 * Normalizes data from Checklist, Maintenance, and Housekeeping systems
 * into a unified format for the UnifiedTaskTable component.
 */

// =============================================================================
// STATUS MAPPING
// =============================================================================
const STATUS_MAP = {
    // Checklist statuses
    'Yes': 'Completed',
    'No': 'Not Done',
    'Pending': 'Pending',

    // Maintenance statuses
    'completed': 'Completed',
    'in progress': 'In Progress',
    'pending': 'Pending',

    // Generic fallback
    'confirmed': 'Confirmed',
};

const getUnifiedStatus = (status) => {
    if (!status) return 'Pending';
    const normalized = STATUS_MAP[status] || STATUS_MAP[status.toLowerCase()];
    return normalized || status;
};

// =============================================================================
// PRIORITY NORMALIZATION
// =============================================================================
const PRIORITY_ORDER = {
    'High': 1,
    'Medium': 2,
    'Low': 3,
    'N/A': 4,
};

const normalizePriority = (priority) => {
    if (!priority) return 'N/A';
    const capitalized = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
    return ['High', 'Medium', 'Low'].includes(capitalized) ? capitalized : 'N/A';
};

// =============================================================================
// DATE FORMATTING
// =============================================================================
export const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
};

export const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
};

// =============================================================================
// CONTEXT BUILDER
// =============================================================================
const buildContext = (department, machineName, location) => {
    const parts = [department, machineName, location].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : '—';
};

// =============================================================================
// CHECKLIST TASK NORMALIZER
// =============================================================================
export const normalizeChecklistTask = (task, isHistory = false) => {
    if (!task) return null;

    // Determine final status
    // If it's from history source (isHistory=true), force it to 'Completed' (unless it was explicitly 'No'/'Not Done')
    let rawStatus = task.status || 'Pending';
    let unifiedStatus = getUnifiedStatus(rawStatus);

    if (isHistory || task.submission_date) {
        // If it was explicitly 'No', we might want to keep that distinction
        if (rawStatus === 'No' || rawStatus === 'Not Done') {
            unifiedStatus = 'Not Done';
        } else {
            unifiedStatus = 'Completed';
            rawStatus = 'Completed';
        }
    }

    return {
        id: task.task_id,
        sourceSystem: 'checklist',
        sourceLabel: 'Checklist',
        title: task.task_description || '—',
        context: buildContext(task.department, null, null),
        department: task.department || '—',
        machineName: '—',
        location: '—',
        assignedTo: task.name || task.assigned_to || '—',
        assignedToSecondary: task.doer_name2 || '—',
        dueDate: task.task_start_date,
        dueDateFormatted: formatDate(task.task_start_date),
        status: unifiedStatus,
        originalStatus: rawStatus,
        priority: normalizePriority(task.priority),

        // Schedule & Rules
        frequency: task.frequency || '—',
        reminderEnabled: task.reminder_enabled || false,
        plannedDate: task.planned_date || '—',
        taskStartDate: task.task_start_date || '—',
        submissionDate: task.submission_date || '—',
        delay: task.delay || '—',

        // Maintenance-specific (N/A for checklist)
        soundStatus: '—',
        temperature: '—',
        adminDone: task.admin_done || '—',

        // Approvals
        confirmedByHOD: task.attachment === 'confirmed' ? 'Confirmed' : (task.attachment || '—'),
        verificationStatus: '—',

        // Attachments
        image: task.image || null,
        imageUrl: task.image_url || task.image || null,
        requireAttachment: task.require_attachment || 'No',

        // Remarks
        remarks: task.remark || task.remarks || '—',

        // Timestamps
        createdAt: task.created_at || '—',
        updatedAt: task.updated_at || '—',

        // Original data for drawer view
        originalData: task,
    };
};

// =============================================================================
// MAINTENANCE TASK NORMALIZER
// =============================================================================
export const normalizeMaintenanceTask = (task) => {
    if (!task) return null;

    return {
        id: task.task_id,
        taskNo: task.task_no || task.task_id,  // Use task_no for display, fallback to task_id
        sourceSystem: 'maintenance',
        sourceLabel: 'Maintenance',
        title: task.task_description || '—',
        context: buildContext(null, task.machine_name, task.location),
        department: task.doer_department || '—',
        machineName: task.machine_name || '—',
        location: task.location || '—',
        serialNo: task.serial_no || '—',
        assignedTo: task.assigned_to || task.doer_name || '—',
        doerName: task.doer_name || '—',
        assignedToSecondary: task.doer_name2 || '—',
        dueDate: task.scheduled_date || task.task_start_date,
        dueDateFormatted: formatDate(task.scheduled_date || task.task_start_date),
        status: getUnifiedStatus(task.status),
        originalStatus: task.status || 'Pending',
        priority: normalizePriority(task.priority),
        taskType: task.task_type || '—',

        // Schedule & Rules
        frequency: task.frequency || '—',
        reminderEnabled: false,
        plannedDate: task.planned_date || task.scheduled_date || '—',
        taskStartDate: task.task_start_date || '—',
        scheduledDate: task.scheduled_date || '—',
        submissionDate: task.actual_date || task.submission_date || '—',
        completedDate: task.completed_date || '—',
        delay: '—',

        // Maintenance-specific
        soundStatus: task.sound_status || '—',
        temperature: task.temperature_status || task.temperature || '—',
        adminDone: task.admin_done || '—',

        // Approvals
        confirmedByHOD: '—',
        verificationStatus: '—',

        // Attachments
        image: task.image || null,
        imageUrl: task.image_url || task.image || null,
        requireAttachment: 'No',

        // Remarks
        remarks: task.remarks || task.remark || '—',

        // Timestamps
        createdAt: task.created_at || '—',
        updatedAt: task.updated_at || '—',

        // Original data for submission
        originalData: task,
    };
};

// =============================================================================
// HOUSEKEEPING TASK NORMALIZER
// =============================================================================
export const normalizeHousekeepingTask = (task) => {
    if (!task) return null;

    return {
        id: task.task_id,
        sourceSystem: 'housekeeping',
        sourceLabel: 'Housekeeping',
        title: task.task_description || '—',
        context: buildContext(task.department, null, null),
        department: task.department || '—',
        machineName: '—',
        location: '—',
        assignedTo: task.name || task.assigned_to || '—',
        assignedToSecondary: task.doer_name2 || '—',
        dueDate: task.task_start_date,
        dueDateFormatted: formatDate(task.task_start_date),
        status: getUnifiedStatus(task.status),
        originalStatus: task.status || 'Pending',
        priority: normalizePriority(task.priority),

        // Schedule & Rules
        frequency: task.frequency || '—',
        reminderEnabled: false,
        plannedDate: '—',
        taskStartDate: task.task_start_date || '—',
        submissionDate: task.submission_date || '—',
        delay: '—',

        // Maintenance-specific (N/A for housekeeping)
        soundStatus: '—',
        temperature: '—',
        adminDone: task.admin_done || '—',

        // Approvals
        confirmedByHOD: task.attachment === 'confirmed' ? 'Confirmed' : (task.attachment || '—'),
        verificationStatus: '—',

        // Attachments
        image: task.image || null,
        imageUrl: task.image_url || task.image || null,
        requireAttachment: 'No',

        // Remarks
        remarks: task.remark || task.remarks || '—',

        // Timestamps
        createdAt: task.created_at || '—',
        updatedAt: task.updated_at || '—',

        // Original data for drawer view
        originalData: task,
    };
};

// =============================================================================
// UNIFIED NORMALIZER
// =============================================================================
export const normalizeAllTasks = (checklistTasks = [], maintenanceTasks = [], housekeepingTasks = [], isHistory = false) => {
    // Normalize Checklist tasks
    const normalizedChecklist = checklistTasks
        .map(task => normalizeChecklistTask(task, isHistory))
        .filter(task => task !== null);

    // Normalize Maintenance tasks
    const normalizedMaintenance = maintenanceTasks
        .map(normalizeMaintenanceTask)
        .filter(task => task !== null);

    // Normalize Housekeeping tasks
    const normalizedHousekeeping = housekeepingTasks
        .map(normalizeHousekeepingTask)
        .filter(task => task !== null);

    // Combine all
    return [
        ...normalizedChecklist,
        ...normalizedMaintenance,
        ...normalizedHousekeeping
    ];
};

// =============================================================================
// SORTING UTILITIES
// =============================================================================
export const sortByDate = (tasks, ascending = true) => {
    return [...tasks].sort((a, b) => {
        const dateA = new Date(a.dueDate || 0);
        const dateB = new Date(b.dueDate || 0);
        return ascending ? dateA - dateB : dateB - dateA;
    });
};

// Sort housekeeping tasks: confirmed first, then by date
export const sortHousekeepingTasks = (tasks) => {
    return [...tasks].sort((a, b) => {
        // Only apply special sorting for housekeeping tasks
        if (a.sourceSystem !== 'housekeeping' || b.sourceSystem !== 'housekeeping') {
            const dateA = new Date(a.dueDate || 0);
            const dateB = new Date(b.dueDate || 0);
            return dateA - dateB;
        }
        
        // Check if tasks are confirmed (attachment === 'confirmed' or confirmedByHOD === 'Confirmed')
        const aConfirmed = a.originalData?.attachment === 'confirmed' || a.confirmedByHOD === 'Confirmed';
        const bConfirmed = b.originalData?.attachment === 'confirmed' || b.confirmedByHOD === 'Confirmed';
        
        // Confirmed tasks first
        if (aConfirmed && !bConfirmed) return -1;
        if (!aConfirmed && bConfirmed) return 1;
        
        // If both confirmed or both not confirmed, sort by date
        const dateA = new Date(a.dueDate || 0);
        const dateB = new Date(b.dueDate || 0);
        return dateA - dateB;
    });
};

export const sortByPriority = (tasks) => {
    return [...tasks].sort((a, b) => {
        return (PRIORITY_ORDER[a.priority] || 4) - (PRIORITY_ORDER[b.priority] || 4);
    });
};

// =============================================================================
// FILTER UTILITIES
// =============================================================================
export const filterTasks = (tasks, filters) => {
    const {
        sourceSystem,
        status,
        priority,
        assignedTo,
        department,
        searchTerm,
        startDate,
        endDate,
    } = filters;

    return tasks.filter(task => {
        // Source system filter
        if (sourceSystem && task.sourceSystem !== sourceSystem) return false;

        // Status filter
        if (status) {
            // Special case: 'Completed' filter shows both 'Completed' and 'Not Done' (History view)
            if (status === 'Completed') {
                if (task.status !== 'Completed' && task.status !== 'Not Done' &&
                    task.originalStatus !== 'Completed' && task.originalStatus !== 'Yes' &&
                    task.originalStatus !== 'No') {
                    return false;
                }
            } else if (task.status !== status && task.originalStatus !== status) {
                return false;
            }
        }

        // Priority filter
        if (priority && task.priority !== priority) return false;

        // Assigned to filter
        if (assignedTo && task.assignedTo !== assignedTo) return false;

        // Department filter
        if (department && task.department !== department) return false;

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                task.title.toLowerCase().includes(search) ||
                task.id?.toString().toLowerCase().includes(search) ||
                task.assignedTo.toLowerCase().includes(search) ||
                task.context.toLowerCase().includes(search) ||
                task.department.toLowerCase().includes(search) ||
                task.machineName.toLowerCase().includes(search);
            if (!matchesSearch) return false;
        }

        // Date range filter
        if (startDate || endDate) {
            const taskDate = new Date(task.dueDate);
            if (isNaN(taskDate.getTime())) return false;

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (taskDate < start) return false;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (taskDate > end) return false;
            }
        }

        return true;
    });
};

// =============================================================================
// PRESET FILTER FACTORIES
// =============================================================================
export const getMyTasksFilter = (username) => ({
    assignedTo: username,
});

export const getTodayFilter = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return {
        startDate: todayStr,
        endDate: todayStr,
    };
};

export const getOverdueFilter = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
        endDate: new Date(today.getTime() - 86400000).toISOString().split('T')[0],
    };
};

export const getHighPriorityFilter = () => ({
    priority: 'High',
});

export const getSourceFilter = (source) => ({
    sourceSystem: source,
});
