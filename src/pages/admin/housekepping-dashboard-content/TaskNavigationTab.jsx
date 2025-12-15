// components/TaskNavigationTabs.js
"use client"

import { Filter, ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import taskApi from "../../../components/api/dashbaordTaskApi" // Adjust path as needed

export default function TaskNavigationTabs({
  dashboardType,
  taskView,
  setTaskView,
  searchQuery,
  setFilterStaff,
  getFrequencyColor,
  dashboardStaffFilter,
  departmentFilter
}) 
{
  const [currentPage, setCurrentPage] = useState(1)
  const [displayedTasks, setDisplayedTasks] = useState([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [taskCounts, setTaskCounts] = useState({
    recent: 0,
    upcoming: 0,
    overdue: 0
  })
  const itemsPerPage = 50

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
    setDisplayedTasks([])
    setHasMoreData(true)
    setTotalCount(0)
  }, [taskView, dashboardType, dashboardStaffFilter, departmentFilter])

  // Function to get task status based on submission_date
  const getTaskStatus = (submissionDate, status) => {
    if (submissionDate || status === 'Yes') {
      return "Completed";
    } else {
      return "Pending";
    }
  }

  // Function to load all task counts
  const loadTaskCounts = useCallback(async () => {
    try {
      const departmentFilters = departmentFilter && departmentFilter !== "all" ? { department: departmentFilter } : {};
      const [recentData, upcomingData, overdueData] = await Promise.all([
        taskApi.getTodayCount(departmentFilters),
        taskApi.getTomorrowCount(departmentFilters),
        taskApi.getOverdueCount(departmentFilters)
      ]);

      setTaskCounts({
        recent: recentData.count || 0,
        upcoming: upcomingData.count || 0,
        overdue: overdueData.count || 0
      });

    } catch (error) {
      console.error('Error loading task counts:', error);
    }
  }, [departmentFilter]);

  // Function to load tasks from API with pagination
  const loadTasksFromApi = useCallback(async (page = 1, append = false) => {
    if (isLoadingMore) return;

    try {
      setIsLoadingMore(true)

      let apiData = [];
      let totalCountFromApi = 0;
      const departmentFilters = departmentFilter && departmentFilter !== "all" ? { department: departmentFilter } : {};

      // Call appropriate API based on taskView with pagination
      switch (taskView) {
        case "recent":
          apiData = await taskApi.getTasksWithFilters("recent", page, itemsPerPage, departmentFilters);
          totalCountFromApi = (await taskApi.getTodayCount(departmentFilters)).count || 0;
          break;
        case "overdue":
          apiData = await taskApi.getTasksWithFilters("overdue", page, itemsPerPage, departmentFilters);
          totalCountFromApi = (await taskApi.getOverdueCount(departmentFilters)).count || 0;
          break;
        case "upcoming": // Upcoming tasks = tomorrow's tasks
          apiData = await taskApi.getTasksWithFilters("upcoming", page, itemsPerPage, departmentFilters);
          totalCountFromApi = (await taskApi.getTomorrowCount(departmentFilters)).count || 0;
          break;
        default:
          apiData = await taskApi.getRecentTasks(departmentFilters);
          totalCountFromApi = (await taskApi.getTodayCount(departmentFilters)).count || 0;
      }

      // Set total count from API
      if (!append) {
        setTotalCount(totalCountFromApi);
      }

      if (!apiData || apiData.length === 0) {
        setHasMoreData(false)
        if (!append) {
          setDisplayedTasks([])
        }
        setIsLoadingMore(false)
        return
      }

      // Process the data
      const processedTasks = apiData.map((task) => {
        const taskStartDate = task.task_start_date
        const completionDate = task.submission_date

        let status = "pending"
        if (completionDate || task.status === 'Yes') {
          status = "completed"
        }

        return {
          id: task.task_id,
          title: task.task_description,
          assignedTo: task.name || "Unassigned",
          taskStartDate: task.task_start_date, // show raw backend value
          originalTaskStartDate: task.task_start_date,
          status: getTaskStatus(task.submission_date, task.status), // Add status field
          submissionDate: task.submission_date || null,
          frequency: task.frequency || "one-time",
          rating: task.color_code_for || 0,
          department: task.department || "N/A",
          remarks: task.remark || "",
          rawTaskStartDate: task.task_start_date,
          rawSubmissionDate: task.submission_date,
        }
      })

      // Apply filters
      let filteredTasks = processedTasks.filter((task) => {
        // Apply search filter
        if (searchQuery && searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase().trim()
          const matchesSearch = (
            (task.title && task.title.toLowerCase().includes(query)) ||
            (task.id && task.id.toString().includes(query)) ||
            (task.assignedTo && task.assignedTo.toLowerCase().includes(query)) ||
            (task.remarks && task.remarks.toLowerCase().includes(query)) ||
            (task.taskStartDate && task.taskStartDate.toLowerCase().includes(query)) ||
            (task.status && task.status.toLowerCase().includes(query))
          )
          if (!matchesSearch) return false;
        }

        return true;
      })

      // Check if there's more data before updating state
      let newDisplayedCount;
      if (append) {
        newDisplayedCount = displayedTasks.length + filteredTasks.length;
        setDisplayedTasks(prev => [...prev, ...filteredTasks])
      } else {
        newDisplayedCount = filteredTasks.length;
        setDisplayedTasks(filteredTasks)
      }

      // Check if there's more data to load
      const hasMore = filteredTasks.length === itemsPerPage && newDisplayedCount < totalCountFromApi;
      setHasMoreData(hasMore);

    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [taskView, searchQuery, isLoadingMore, itemsPerPage, displayedTasks.length, departmentFilter])

  // Initial load when component mounts or key dependencies change
  useEffect(() => {
    setCurrentPage(1);
    loadTasksFromApi(1, false);
    loadTaskCounts();
  }, [taskView, dashboardType, dashboardStaffFilter, departmentFilter])

  // Load when search changes
  useEffect(() => {
    if (currentPage === 1) {
      loadTasksFromApi(1, false)
    }
  }, [searchQuery])

  // Infinite scroll handler
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Load more when scrolled to 80% of the container
    if (scrollTop + clientHeight >= scrollHeight * 0.8 && hasMoreData && !isLoadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadTasksFromApi(nextPage, true);
    }
  }, [hasMoreData, isLoadingMore, currentPage, loadTasksFromApi])

  // Reset local staff filter when dashboardStaffFilter changes
  useEffect(() => {
    if (dashboardStaffFilter !== "all") {
      setFilterStaff("all")
    }
  }, [dashboardStaffFilter])

  // Render table headers based on task view
  const renderTableHeaders = () => {
    const baseHeaders = [
      { key: 'seq', label: 'Seq No.' },
      { key: 'id', label: 'Task ID' },
      { key: 'title', label: 'Task Description' },
      { key: 'assignedTo', label: 'Assigned To' },
    ];

    if (dashboardType === "checklist") {
      baseHeaders.push({ key: 'department', label: 'Department' });
    }

    baseHeaders.push(
      { key: 'taskStartDate', label: 'Task Start Date' },
      { key: 'frequency', label: 'Frequency' }
    );

    // Add Status column for Recent tasks
    if (taskView === "recent") {
      baseHeaders.push({ key: 'status', label: 'Status' });
    }

    // Add Remarks column only for Not Done tasks
    if (taskView === "upcoming") {
      baseHeaders.push({ key: 'remarks', label: 'Remarks' });
    }

    return baseHeaders;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Tab Headers with Counts */}
      <div className="grid grid-cols-3">
        <button
          className={`py-3 text-center font-medium transition-colors relative ${taskView === "recent" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          onClick={() => setTaskView("recent")}
        >
          {dashboardType === "delegation" ? "Today Tasks" : "Today's Tasks"}
          {/* <span className="absolute top-1 right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {taskCounts.recent}
          </span> */}
        </button>
        <button
          className={`py-3 text-center font-medium transition-colors relative ${taskView === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          onClick={() => setTaskView("upcoming")}
        >
          {dashboardType === "delegation" ? "Future Tasks" : "Upcoming Tasks"}
          {/* <span className="absolute top-1 right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {taskCounts.upcoming}
          </span> */}
        </button>
        <button
          className={`py-3 text-center font-medium transition-colors relative ${taskView === "overdue" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          onClick={() => setTaskView("overdue")}
        >
          Overdue Tasks
          {/* <span className="absolute top-1 right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {taskCounts.overdue}
          </span> */}
        </button>
      </div>

      <div className="p-4">
        {/* Total Count Display */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Total Tasks:
              <span className="ml-2 text-blue-600 font-bold">{totalCount}</span>
            </span>
            <div className="text-xs text-gray-500">
              Showing {displayedTasks.length} of {totalCount} tasks
            </div>
          </div>
        </div>

        {displayedTasks.length === 0 && !isLoadingMore ? (
          <div className="text-center p-8 text-gray-500">
            <p>
              {taskView === "recent"
                ? "No tasks found for today."
                : `No tasks found for ${taskView} view.`
              }
            </p>
            {(dashboardStaffFilter !== "all" || departmentFilter !== "all") && (
              <p className="text-sm mt-2">Try adjusting your filters to see more results.</p>
            )}
          </div>
        ) : (
          <div
            className="task-table-container overflow-x-auto"
            style={{ maxHeight: "400px", overflowY: "auto" }}
            onScroll={handleScroll}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {renderTableHeaders().map((header) => (
                    <th
                      key={header.key}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedTasks.map((task, index) => {
                  const sequenceNumber = index + 1;

                  return (
                    <tr key={`${task.id}-${task.taskStartDate}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        {sequenceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{task.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedTo}</td>
                      {dashboardType === "checklist" && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.department}</td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.taskStartDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(task.frequency)}`}>
                          {task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1)}
                        </span>
                      </td>

                      {/* Status column - only for Recent tasks */}
                      {taskView === "recent" && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                      )}

                      {/* Remarks column - only for Not Done tasks */}
                      {taskView === "upcoming" && (
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {task.remarks || "—"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {isLoadingMore && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500 mt-2">Loading tasks...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
