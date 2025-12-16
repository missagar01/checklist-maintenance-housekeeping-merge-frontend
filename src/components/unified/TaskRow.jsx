import { memo } from "react";
import { Upload, Eye, CheckCircle } from "lucide-react";

/**
 * TaskRow - Memoized row component for the unified task table
 * Matches the exact table structure from maintenance-data-page.jsx
 * IMPORTANT: Hides checkbox and action columns for completed/history tasks
 * 
 * @param {object} task - Normalized task object
 * @param {boolean} isSelected - Whether row checkbox is selected
 * @param {function} onSelect - Checkbox change handler
 * @param {function} onView - View button click handler
 * @param {object} rowData - Additional row data (status, soundStatus, temperature, remarks)
 * @param {function} onRowDataChange - Handler for inline edits
 * @param {object} uploadedImage - Uploaded image for this row
 * @param {function} onImageUpload - Image upload handler
 * @param {boolean} isHistoryMode - True if viewing history/completed tasks (hides action columns)
 */
const TaskRow = memo(function TaskRow({
    task,
    isSelected,
    onSelect,
    onView,
    rowData = {},
    onRowDataChange,
    uploadedImage,
    onImageUpload,
    isHistoryMode = false,  // New prop to detect history/completed mode
}) {
    // Determine if this is a completed task (from history)
    const isCompleted = task.status === 'Completed' ||
        task.originalStatus === 'Yes' ||
        task.originalStatus === 'Completed' ||
        isHistoryMode;

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        onSelect?.(task.id, e.target.checked);
    };

    const handleViewClick = (e) => {
        e.stopPropagation();
        onView?.(task);
    };

    const handleDataChange = (field, value) => {
        onRowDataChange?.(task.id, field, value);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageUpload?.(task.id, file);
        }
    };

    // Get priority badge
    const getPriorityBadge = (priority) => {
        if (!priority) return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">N/A</span>;

        switch (priority?.toLowerCase()) {
            case 'high':
                return <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">High</span>;
            case 'medium':
                return <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium">Medium</span>;
            case 'low':
                return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">Low</span>;
            default:
                return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">N/A</span>;
        }
    };

    // Get source badge
    const getSourceBadge = (source) => {
        switch (source) {
            case 'checklist':
                return <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">✅ Checklist</span>;
            case 'maintenance':
                return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">🔧 Maintenance</span>;
            case 'housekeeping':
                return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">🏠 Housekeeping</span>;
            default:
                return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">{source}</span>;
        }
    };

    return (
        <tr className={`${isSelected ? "bg-blue-50" : isCompleted ? "bg-green-50/30" : ""} hover:bg-gray-50 border-b border-gray-100`}>
            {/* Checkbox - ONLY show for pending tasks */}
            <td className="px-2 sm:px-3 py-2 sm:py-4 w-12">
                {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-500" title="Completed" />
                ) : (
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isSelected}
                        onChange={handleCheckboxClick}
                    />
                )}
            </td>

            {/* Source System Badge */}
            <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                {getSourceBadge(task.sourceSystem)}
            </td>

            {/* Task No / ID */}
            <td className="px-2 sm:px-3 py-2 sm:py-4">
                <div className="text-xs sm:text-sm font-medium text-gray-900">
                    {task.taskNo || task.id || '—'}
                </div>
            </td>

            {/* Machine / Context */}
            <td className="px-2 sm:px-3 py-2 sm:py-4">
                <div className="text-xs sm:text-sm text-gray-900">
                    {task.machineName !== '—' ? task.machineName : task.department}
                    {task.serialNo && task.serialNo !== '—' && (
                        <div className="text-xs text-gray-500">SN: {task.serialNo}</div>
                    )}
                </div>
            </td>

            {/* Doer Name / Assigned To */}
            <td className="px-2 sm:px-3 py-2 sm:py-4">
                <div className="text-xs sm:text-sm text-gray-900">
                    {task.assignedTo}
                </div>
            </td>

            {/* Task Description */}
            <td className="px-2 sm:px-3 py-2 sm:py-4 max-w-[200px]">
                <div
                    className="text-xs sm:text-sm text-gray-900 line-clamp-2"
                    title={task.title}
                >
                    {task.title}
                </div>
            </td>

            {/* Priority */}
            <td className="px-2 sm:px-3 py-2 sm:py-4">
                {getPriorityBadge(task.priority)}
            </td>

            {/* Due Date */}
            <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                <div className="text-xs sm:text-sm text-gray-900">
                    {task.dueDateFormatted}
                </div>
            </td>

            {/* Sound Status - For completed: show value, for pending: show dropdown */}
            {task.sourceSystem === 'maintenance' ? (
                <td className="px-2 sm:px-3 py-2 sm:py-4">
                    {isCompleted ? (
                        <span className="text-xs text-gray-700">{task.soundStatus || '—'}</span>
                    ) : (
                        <select
                            disabled={!isSelected}
                            value={rowData.soundStatus || ""}
                            onChange={(e) => handleDataChange("soundStatus", e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select</option>
                            <option value="Good">Good</option>
                            <option value="Bad">Bad</option>
                            <option value="Need Repair">Need Repair</option>
                            <option value="OK">OK</option>
                        </select>
                    )}
                </td>
            ) : (
                <td className="px-2 sm:px-3 py-2 sm:py-4">
                    <span className="text-xs text-gray-400">—</span>
                </td>
            )}

            {/* Temperature - For completed: show value, for pending: show input */}
            {task.sourceSystem === 'maintenance' ? (
                <td className="px-2 sm:px-3 py-2 sm:py-4">
                    {isCompleted ? (
                        <span className="text-xs text-gray-700">{task.temperature || '—'}</span>
                    ) : (
                        <input
                            type="text"
                            placeholder="Temp"
                            disabled={!isSelected}
                            value={rowData.temperature || ""}
                            onChange={(e) => handleDataChange("temperature", e.target.value)}
                            className="border rounded-md px-2 py-1 w-20 text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    )}
                </td>
            ) : (
                <td className="px-2 sm:px-3 py-2 sm:py-4">
                    <span className="text-xs text-gray-400">—</span>
                </td>
            )}

            {/* Update Status - For completed: show status, for pending: show dropdown */}
            <td className="px-2 sm:px-3 py-2 sm:py-4">
                {isCompleted ? (
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                        ✅ {task.originalStatus || 'Yes'}
                    </span>
                ) : (
                    <select
                        disabled={!isSelected}
                        value={rowData.status || ""}
                        onChange={(e) => handleDataChange("status", e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 w-full text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Status</option>
                        <option value="Yes">✅ Yes</option>
                        <option value="No">❌ No</option>
                    </select>
                )}
            </td>

            {/* Remarks - For completed: show text, for pending: show input */}
            <td className="px-2 sm:px-3 py-2 sm:py-4">
                {isCompleted ? (
                    <span className="text-xs text-gray-700 max-w-[100px] truncate block" title={task.remarks}>
                        {task.remarks || '—'}
                    </span>
                ) : (
                    <input
                        type="text"
                        placeholder="Remarks"
                        disabled={!isSelected}
                        value={rowData.remarks || ""}
                        onChange={(e) => handleDataChange("remarks", e.target.value)}
                        className="border rounded-md px-2 py-1 w-full text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                )}
            </td>

            {/* Image - For completed: show if exists, for pending: show upload */}
            <td className="px-2 sm:px-3 py-2 sm:py-4">
                {isCompleted ? (
                    task.imageUrl ? (
                        <img src={task.imageUrl} alt="Attached" className="h-8 w-8 object-cover rounded" />
                    ) : (
                        <span className="text-xs text-gray-400">—</span>
                    )
                ) : (
                    <>
                        <label className={`flex items-center cursor-pointer text-blue-600 hover:text-blue-800 text-xs ${!isSelected ? "opacity-50 cursor-not-allowed" : ""}`}>
                            <Upload className="h-4 w-4 mr-1" />
                            <span>Upload</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={!isSelected}
                            />
                        </label>
                        {uploadedImage && (
                            <div className="mt-1">
                                <img
                                    src={uploadedImage.previewUrl}
                                    alt="Preview"
                                    className="h-8 w-8 object-cover rounded"
                                />
                            </div>
                        )}
                    </>
                )}
            </td>

            {/* View Details Button */}
            <td className="px-2 sm:px-3 py-2 sm:py-4">
                <button
                    onClick={handleViewClick}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="View Details"
                >
                    <Eye className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
});

export default TaskRow;

/**
 * TaskTableHeader - Table header component matching maintenance page
 * Now conditionally hides checkbox column header for history mode
 */
export function TaskTableHeader({
    onSelectAll,
    isAllSelected,
    isIndeterminate,
    isHistoryMode = false,
}) {
    return (
        <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    {isHistoryMode ? (
                        <span>Status</span>
                    ) : (
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => {
                                if (el) el.indeterminate = isIndeterminate;
                            }}
                            onChange={onSelectAll}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    )}
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Machine/Dept
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doer Name
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sound Status
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temperature
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isHistoryMode ? "Status" : "Update Status"}
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    View
                </th>
            </tr>
        </thead>
    );
}

/**
 * TaskTableEmpty - Empty state component
 */
export function TaskTableEmpty({ hasFilters = false }) {
    return (
        <tr>
            <td colSpan={14} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <span className="text-2xl">📋</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        {hasFilters
                            ? "No tasks matching your filters"
                            : "No tasks found"
                        }
                    </p>
                    {hasFilters && (
                        <p className="text-gray-400 text-xs mt-1">
                            Try clicking "Clear All Filters" above
                        </p>
                    )}
                </div>
            </td>
        </tr>
    );
}
