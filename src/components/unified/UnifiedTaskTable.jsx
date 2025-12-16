import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { CheckCircle2, X, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import TaskRow, { TaskTableHeader, TaskTableEmpty } from "./TaskRow";
import TaskFilterBar from "./TaskFilterBar";
import TaskDrawer from "./TaskDrawer";
import { filterTasks, sortByDate } from "../../utils/taskNormalizer";

// Page size options
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 1000];

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
    username = "",
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    // Inline editing state - like maintenance page
    const [rowData, setRowData] = useState({});  // { taskId: { status, soundStatus, temperature, remarks } }
    const [uploadedImages, setUploadedImages] = useState({});  // { taskId: { file, previewUrl } }

    const tableContainerRef = useRef(null);

    // Handle scroll for infinite loading (like SalesDataPage)
    const handleScroll = useCallback(() => {
        if (!tableContainerRef.current || loading || isFetchingMore || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

        if (isNearBottom && onLoadMore) {
            setIsFetchingMore(true);
            onLoadMore();
            // Reset after a delay
            setTimeout(() => setIsFetchingMore(false), 1000);
        }
    }, [loading, isFetchingMore, hasMore, onLoadMore]);

    // Add scroll event listener
    useEffect(() => {
        const tableElement = tableContainerRef.current;
        if (tableElement) {
            tableElement.addEventListener('scroll', handleScroll);
            return () => tableElement.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    // Filter and sort tasks
    const filteredTasks = useMemo(() => {
        const filtered = filterTasks(tasks, filters);
        return sortByDate(filtered, true);
    }, [tasks, filters]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredTasks.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTasks = useMemo(() => {
        return filteredTasks.slice(startIndex, endIndex);
    }, [filteredTasks, startIndex, endIndex]);

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [filters]);

    // Check if all items on current page are selected
    const isAllSelected = paginatedTasks.length > 0 && paginatedTasks.every(t => selectedItems.has(t.id));
    const isIndeterminate = paginatedTasks.some(t => selectedItems.has(t.id)) && !isAllSelected;

    // Has active filters
    const hasFilters = useMemo(() => {
        return Object.values(filters).some(v => v);
    }, [filters]);

    // Pagination handlers
    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);  // Reset to first page
    };

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
            // Select all on current page
            const pageIds = paginatedTasks.map(task => task.id);
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                pageIds.forEach(id => newSet.add(id));
                return newSet;
            });
        } else {
            // Deselect all on current page
            const pageIds = new Set(paginatedTasks.map(task => task.id));
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                pageIds.forEach(id => newSet.delete(id));
                return newSet;
            });
            // Clean up row data for deselected items
            pageIds.forEach(id => {
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
    }, [filteredTasks, uploadedImages]);

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
                        } catch (error) {
                            console.error("Error converting image to base64:", error);
                        }
                    }

                    return {
                        taskId: id,
                        sourceSystem: task?.sourceSystem,
                        status: taskRowData.status,
                        soundStatus: taskRowData.soundStatus || "",
                        temperature: taskRowData.temperature || "",
                        remarks: taskRowData.remarks || "",
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
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                        <span className="font-medium">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage("")}>
                        <X className="h-5 w-5 text-green-500 hover:text-green-700" />
                    </button>
                </div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                    <button onClick={() => setErrorMessage("")}>
                        <X className="h-5 w-5 text-red-500 hover:text-red-700" />
                    </button>
                </div>
            )}

            {/* Table Card */}
            <div className="rounded-lg border border-blue-200 shadow-md bg-white overflow-hidden">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h2 className="text-blue-700 font-medium text-sm sm:text-base">
                            📋 All Tasks (Checklist + Maintenance + Housekeeping)
                        </h2>
                        <p className="text-blue-600 text-xs sm:text-sm">
                            Showing {startIndex + 1}-{Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length} tasks
                            {filteredTasks.length !== tasks.length && ` (${tasks.length} total)`}
                        </p>
                    </div>

                    {/* Only show Update button for pending tasks (not history) */}
                    {filters.status !== "Completed" && (
                        <button
                            onClick={handleBulkSubmit}
                            disabled={selectedItems.size === 0 || isSubmitting}
                            className="rounded-md bg-green-600 py-2 px-4 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                        >
                            {isSubmitting ? "⏳ Processing..." : `✅ Update Selected (${selectedItems.size})`}
                        </button>
                    )}
                </div>

                {/* Table Container */}
                <div
                    ref={tableContainerRef}
                    className="overflow-x-auto"
                    style={{ maxHeight: 'calc(100vh - 400px)' }}
                >
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-blue-600 text-sm">Loading tasks from all sources...</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <TaskTableHeader
                                onSelectAll={handleSelectAll}
                                isAllSelected={isAllSelected}
                                isIndeterminate={isIndeterminate}
                                isHistoryMode={filters.status === "Completed"}
                            />
                            <tbody className="bg-white divide-y divide-gray-100">
                                {paginatedTasks.length > 0 ? (
                                    paginatedTasks.map((task) => (
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
                                        />
                                    ))
                                ) : (
                                    <TaskTableEmpty hasFilters={hasFilters} />
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {filteredTasks.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Page Size Selector */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>📄 Show:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {PAGE_SIZE_OPTIONS.map(size => (
                                    <option key={size} value={size}>{size} per page</option>
                                ))}
                            </select>
                        </div>

                        {/* Page Navigation */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => goToPage(1)}
                                disabled={currentPage === 1}
                                className="px-2 py-1 text-sm text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="First Page"
                            >
                                ⏮️
                            </button>
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Prev
                            </button>

                            <span className="px-4 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-md">
                                Page {currentPage} of {totalPages || 1}
                            </span>

                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                            <button
                                onClick={() => goToPage(totalPages)}
                                disabled={currentPage >= totalPages}
                                className="px-2 py-1 text-sm text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Last Page"
                            >
                                ⏭️
                            </button>
                        </div>

                        {/* Selection Info */}
                        <div className="text-sm text-gray-600">
                            {selectedItems.size > 0 && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                                    ✓ {selectedItems.size} selected
                                </span>
                            )}
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
