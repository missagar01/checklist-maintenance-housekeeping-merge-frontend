import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { CheckCircle2, X, AlertTriangle } from "lucide-react";
import TaskRow, { TaskTableHeader, TaskTableEmpty } from "./TaskRow";
import TaskFilterBar from "./TaskFilterBar";
import TaskDrawer from "./TaskDrawer";
import { filterTasks, sortByDate, sortHousekeepingTasks } from "../../utils/taskNormalizer";

/**
 * UnifiedTaskTable - Main unified table component
 * Now with inline editing like maintenance-data-page.jsx
 * Supports scroll-based infinite loading like SalesDataPage
 * 
 * @param {array} tasks - Array of normalized tasks
 * @param {boolean} loading - Loading state
 * @param {function} onUpdateTask - Task update handler (for drawer)
 * @param {function} onBulkSubmit - Bulk submit handler
 * @param {string} userRole - Current user role
 * @param {string} username - Current username
 * @param {function} onLoadMore - Callback to load more data (infinite scroll)
 * @param {boolean} hasMore - Whether there's more data to load
 */
export default function UnifiedTaskTable({
    tasks = [],
    loading = false,
    onUpdateTask,
    onBulkSubmit,
    userRole = "admin",
    onLoadMore,  // Callback for scroll-based loading
    hasMore = false,  // Whether more data is available
}) {
    // State
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [filters, setFilters] = useState({
        searchTerm: "",
        sourceSystem: "",
        status: "Pending",  // Default to Pending - only show pending tasks
        priority: "",
        assignedTo: "",
        department: "",
        startDate: "",
        endDate: "",
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Inline editing state - like maintenance page
    const [rowData, setRowData] = useState({});  // { taskId: { status, soundStatus, temperature, remarks } }
    const [uploadedImages, setUploadedImages] = useState({});  // { taskId: { file, previewUrl } }

    const tableContainerRef = useRef(null);

    // Handle scroll for infinite loading - improved detection
    const handleScroll = useCallback(() => {
        if (loading || isFetchingMore || !hasMore || !onLoadMore) return;

        let isNearBottom = false;

        // Check table container scroll first (primary method)
        if (tableContainerRef.current) {
            const container = tableContainerRef.current;
            const containerScrollTop = container.scrollTop;
            const containerScrollHeight = container.scrollHeight;
            const containerClientHeight = container.clientHeight;
            
            // Check if near bottom of container (within 300px)
            if (containerScrollTop + containerClientHeight >= containerScrollHeight - 300) {
                isNearBottom = true;
            }
        }

        // Also check window scroll as fallback (for mobile)
        if (!isNearBottom) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Check if near bottom of window (within 400px)
            if (scrollTop + windowHeight >= documentHeight - 400) {
                isNearBottom = true;
            }
        }

        if (isNearBottom) {
            setIsFetchingMore(true);
            onLoadMore();
            // Reset after a delay to prevent multiple rapid calls
            setTimeout(() => setIsFetchingMore(false), 2000);
        }
    }, [loading, isFetchingMore, hasMore, onLoadMore]);

    // Add scroll event listeners to both window and container
    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        const container = tableContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll]);

    // Filter and sort tasks
    const filteredTasks = useMemo(() => {
        const filtered = filterTasks(tasks, filters);
        // If showing housekeeping only, use special sorting (confirmed first)
        if (filters.sourceSystem === 'housekeeping') {
            return sortHousekeepingTasks(filtered);
        }
        return sortByDate(filtered, true);
    }, [tasks, filters]);

    // Check if showing only housekeeping tasks
    const isHousekeepingOnly = useMemo(() => {
        if (filters.sourceSystem === 'housekeeping') {
            return true;
        }
        // If no source filter and all tasks are housekeeping
        if (!filters.sourceSystem && filteredTasks.length > 0) {
            return filteredTasks.every(task => task.sourceSystem === 'housekeeping');
        }
        return false;
    }, [filters.sourceSystem, filteredTasks]);

    // Use all filtered tasks for infinite scroll (no client-side pagination)
    const displayTasks = filteredTasks;

    // Check if all visible items are selected
    const isAllSelected = displayTasks.length > 0 && displayTasks.every(t => selectedItems.has(t.id));
    const isIndeterminate = displayTasks.some(t => selectedItems.has(t.id)) && !isAllSelected;

    // Has active filters
    const hasFilters = useMemo(() => {
        return Object.values(filters).some(v => v);
    }, [filters]);

    // Handlers
    const handleSelectItem = useCallback((id, isChecked) => {
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            if (isChecked) {
                newSelected.add(id);
            } else {
                newSelected.delete(id);
                // Clean up related data when unchecking
                setRowData(prevData => {
                    const newData = { ...prevData };
                    delete newData[id];
                    return newData;
                });
                setUploadedImages(prevImages => {
                    const newImages = { ...prevImages };
                    if (newImages[id]?.previewUrl) {
                        URL.revokeObjectURL(newImages[id].previewUrl);
                    }
                    delete newImages[id];
                    return newImages;
                });
            }
            return newSelected;
        });
    }, []);

    const handleSelectAll = useCallback((e) => {
        if (e.target.checked) {
            // Select all visible tasks
            const allIds = displayTasks.map(task => task.id);
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                allIds.forEach(id => newSet.add(id));
                return newSet;
            });
        } else {
            // Deselect all visible tasks
            const allIds = new Set(displayTasks.map(task => task.id));
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                allIds.forEach(id => newSet.delete(id));
                return newSet;
            });
            // Clean up row data for deselected items
            allIds.forEach(id => {
                setRowData(prevData => {
                    const newData = { ...prevData };
                    delete newData[id];
                    return newData;
                });
                if (uploadedImages[id]?.previewUrl) {
                    URL.revokeObjectURL(uploadedImages[id].previewUrl);
                }
            });
        }
    }, [displayTasks, uploadedImages]);

    // Handle inline row data changes
    const handleRowDataChange = useCallback((taskId, field, value) => {
        setRowData(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value
            }
        }));
    }, []);

    // Handle image upload
    const handleImageUpload = useCallback((taskId, file) => {
        const previewUrl = URL.createObjectURL(file);
        setUploadedImages(prev => ({
            ...prev,
            [taskId]: { file, previewUrl }
        }));
    }, []);

    // View task in drawer
    const handleViewTask = useCallback((task) => {
        setSelectedTask(task);
        setDrawerOpen(true);
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setDrawerOpen(false);
        setSelectedTask(null);
    }, []);

    // Convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // Main submit function - matches maintenance-data-page.jsx logic
    const handleBulkSubmit = useCallback(async () => {
        const selectedItemsArray = Array.from(selectedItems);

        if (selectedItemsArray.length === 0) {
            setErrorMessage("⚠️ Please select at least one task to submit");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }

        // Validate required fields - status is required
        const missingStatus = selectedItemsArray.filter(id => {
            const status = rowData[id]?.status;
            return !status || status === "";
        });

        if (missingStatus.length > 0) {
            setErrorMessage("⚠️ Please select status (Yes/No) for all selected tasks");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare submission data for each task
            const submissionData = await Promise.all(
                selectedItemsArray.map(async (id) => {
                    const task = filteredTasks.find(t => t.id === id);
                    const taskRowData = rowData[id] || {};
                    const imageData = uploadedImages[id];

                    let imageBase64 = null;
                    if (imageData?.file) {
                        try {
                            imageBase64 = await fileToBase64(imageData.file);
                        } catch {
                            // Error converting image
                        }
                    }

                    return {
                        taskId: id,
                        sourceSystem: task?.sourceSystem,
                        status: taskRowData.status,
                        soundStatus: taskRowData.soundStatus || "",
                        temperature: taskRowData.temperature || "",
                        remarks: taskRowData.remarks || "",
                        doerName2: taskRowData.doerName2 || "",  // Add doerName2 for housekeeping
                        image: imageBase64,
                        originalData: task?.originalData,
                    };
                })
            );

            // Call the bulk submit handler
            if (onBulkSubmit) {
                await onBulkSubmit(submissionData);
            }

            setSuccessMessage(`✅ Successfully updated ${selectedItemsArray.length} tasks!`);

            // Reset selections
            setSelectedItems(new Set());
            setRowData({});
            Object.values(uploadedImages).forEach(img => {
                if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
            });
            setUploadedImages({});

        } catch (error) {
            setErrorMessage(`❌ Failed to update tasks: ${error.message || error}`);
        } finally {
            setIsSubmitting(false);
            setTimeout(() => {
                setSuccessMessage("");
                setErrorMessage("");
            }, 3000);
        }
    }, [selectedItems, rowData, uploadedImages, filteredTasks, onBulkSubmit]);

    return (
        <div className="space-y-4">
            {/* Filter Bar - Simplified */}
            <TaskFilterBar
                filters={filters}
                onFiltersChange={setFilters}
            />

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-2 sm:px-4 py-2 sm:py-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-green-500 flex-shrink-0" />
                        <span className="font-medium text-xs sm:text-sm truncate">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage("")} className="ml-2 flex-shrink-0">
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 hover:text-green-700" />
                    </button>
                </div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-2 sm:px-4 py-2 sm:py-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-red-500 flex-shrink-0" />
                        <span className="font-medium text-xs sm:text-sm truncate">{errorMessage}</span>
                    </div>
                    <button onClick={() => setErrorMessage("")} className="ml-2 flex-shrink-0">
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 hover:text-red-700" />
                    </button>
                </div>
            )}

            {/* Table Card */}
            <div className="rounded-lg border border-blue-200 shadow-md bg-white overflow-hidden">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-blue-700 font-medium text-xs sm:text-sm md:text-base truncate">
                                📋 All Tasks (Checklist + Maintenance + Housekeeping)
                            </h2>
                            <p className="text-blue-600 text-xs mt-1">
                                Showing {displayTasks.length} of {displayTasks.length} tasks
                                {displayTasks.length !== tasks.length && ` (${tasks.length} total)`}
                                {hasMore && <span className="text-blue-500"> • Loading more...</span>}
                            </p>
                        </div>

                        {/* Only show Update button for pending tasks (not history) */}
                        {filters.status !== "Completed" && (
                            <button
                                onClick={handleBulkSubmit}
                                disabled={selectedItems.size === 0 || isSubmitting}
                                className="w-full sm:w-auto rounded-md bg-green-600 py-1.5 sm:py-2 px-3 sm:px-4 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium whitespace-nowrap"
                            >
                                {isSubmitting ? "⏳ Processing..." : `✅ Update Selected (${selectedItems.size})`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Container */}
                <div
                    ref={tableContainerRef}
                    className="overflow-x-auto overflow-y-auto"
                    style={{ maxHeight: 'calc(100vh - 400px)' }}
                >
                    {loading && displayTasks.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-blue-600 text-xs sm:text-sm">Loading tasks from all sources...</p>
                        </div>
                    ) : (
                        <>
                            <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
                                <TaskTableHeader
                                    onSelectAll={handleSelectAll}
                                    isAllSelected={isAllSelected}
                                    isIndeterminate={isIndeterminate}
                                    isHistoryMode={filters.status === "Completed"}
                                    isHousekeepingOnly={isHousekeepingOnly}
                                />
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {displayTasks.length > 0 ? (
                                        displayTasks.map((task, index) => (
                                            <TaskRow
                                                key={`${task.sourceSystem}-${task.id}`}
                                                task={task}
                                                isSelected={selectedItems.has(task.id)}
                                                onSelect={handleSelectItem}
                                                onView={handleViewTask}
                                                rowData={rowData[task.id] || {}}
                                                onRowDataChange={handleRowDataChange}
                                                uploadedImage={uploadedImages[task.id]}
                                                onImageUpload={handleImageUpload}
                                                isHistoryMode={filters.status === "Completed"}
                                                isHousekeepingOnly={isHousekeepingOnly}
                                                seqNo={index + 1}
                                                userRole={userRole}
                                            />
                                        ))
                                    ) : (
                                        <TaskTableEmpty hasFilters={hasFilters} />
                                    )}
                                </tbody>
                            </table>
                            {/* Loading indicator at bottom for infinite scroll */}
                            {isFetchingMore && (
                                <div className="bg-white border-t border-gray-200 py-3">
                                    <div className="text-center">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                        <p className="text-blue-600 text-xs mt-2">Loading more tasks...</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer - Only show selection info, no pagination for infinite scroll */}
                {displayTasks.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-200 px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                            {/* Task Count Info */}
                            <div className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">{displayTasks.length}</span> tasks displayed
                                {hasMore && <span className="text-blue-600 ml-1">• More available (scroll to load)</span>}
                            </div>

                            {/* Selection Info */}
                            <div className="text-xs sm:text-sm text-gray-600">
                                {selectedItems.size > 0 && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md whitespace-nowrap">
                                        ✓ {selectedItems.size} selected
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Task Drawer - for viewing details */}
            <TaskDrawer
                task={selectedTask}
                isOpen={drawerOpen}
                onClose={handleCloseDrawer}
                onUpdate={onUpdateTask}
                userRole={userRole}
            />
        </div>
    );
}
