"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { CheckCircle2, Upload, X, Search, History, ArrowLeft } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchHousekeepingPendingTasks,
  fetchHousekeepingHistoryTasks,
  confirmHousekeepingTask,
  submitHousekeepingTasks,
  clearPendingTasks,
  clearHistoryTasks,
} from "../../redux/slice/housekeepingSlice"
import { API_BASE_URL } from "../../components/api/axios"

const CONFIG = {
  PAGE_CONFIG: {
    title: "HouseKeeping Tasks",
    historyTitle: "HouseKeeping History",
    description: "Showing today's tasks and past due tasks",
    historyDescription: "Read-only view of completed tasks with submission history",
  },
}

const DOER2_OPTIONS = [
  "Sarad Behera",
  "Tikeshware Chakradhari(KH)",
  "Makhan Lal",
]
const PAGE_SIZE = 100

function HousekeepingTasksPage() {
  const dispatch = useDispatch()
  const housekeepingState = useSelector((state) => state.housekeeping)
  
  const {
    pendingTasks,
    historyTasks,
    loading,
    pendingPage,
    historyPage,
    pendingHasMore,
    historyHasMore,
    submittingTasks,
  } = housekeepingState

  const [selectedItems, setSelectedItems] = useState(new Set())
  const [successMessage, setSuccessMessage] = useState("")
  const [additionalData, setAdditionalData] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState(null)
  const [remarksData, setRemarksData] = useState({})
  const [showHistory, setShowHistory] = useState(false)
  const [userUploadedImages, setUserUploadedImages] = useState({})
  const [selectedMembers, setSelectedMembers] = useState([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userConfirmRemarks, setUserConfirmRemarks] = useState({})
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" })
  const [doerName2Selections, setDoerName2Selections] = useState({})
  const [pageLoading, setPageLoading] = useState(false)
  const [userBulkConfirmIds, setUserBulkConfirmIds] = useState(new Set())
  const [isBulkConfirming, setIsBulkConfirming] = useState(false)

  const tableContainerRef = useRef(null)
  const pendingSentinelRef = useRef(null)
  const historySentinelRef = useRef(null)

  const isUser = userRole && userRole.toLowerCase() === 'user'

  useEffect(() => {
    const role = localStorage.getItem("role") || ""
    // Use user_access1 for housekeeping, fallback to user_access
    const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || ""
    const userAccessFallback = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
    const accessDenorm = (userAccess1 || userAccessFallback).trim()
    setUserRole(role)
    if (role.toLowerCase() === 'user') {
      const departments = accessDenorm.split(',').map(d => d.trim()).filter(Boolean)
      setSelectedDepartment(departments[0] || "")
    }
  }, [])

  const fetchTasks = useCallback(async ({ page = 1, append = false } = {}) => {
    const params = {
      limit: PAGE_SIZE,
      page,
      ...(!isUser && selectedDepartment ? { department: selectedDepartment } : {})
    }

    setError(null)
    if (!append) {
      setPageLoading(true)
    } else {
      setPageLoading(true)
    }

    try {
      if (showHistory) {
        await dispatch(fetchHousekeepingHistoryTasks({ page, filters: params })).unwrap()
      } else {
        await dispatch(fetchHousekeepingPendingTasks({ page, filters: params })).unwrap()
      }
    } catch {
      setError('Failed to load data. Please try again.')
    } finally {
      setPageLoading(false)
    }
  }, [showHistory, selectedDepartment, isUser, dispatch])

  useEffect(() => {
    if (showHistory) {
      dispatch(clearHistoryTasks())
    } else {
      dispatch(clearPendingTasks())
    }
    fetchTasks({ page: 1, append: false })
  }, [showHistory, fetchTasks, dispatch])

  useEffect(() => {
    if (showHistory) return
    const target = pendingSentinelRef.current
    if (!target || !pendingHasMore || loading || pageLoading) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchTasks({ page: pendingPage + 1, append: true })
      }
    }, { threshold: 1 })

    observer.observe(target)
    return () => observer.disconnect()
  }, [showHistory, pendingHasMore, loading, pageLoading, pendingPage, fetchTasks])

  useEffect(() => {
    if (!showHistory) return
    const target = historySentinelRef.current
    if (!target || !historyHasMore || loading || pageLoading) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchTasks({ page: historyPage + 1, append: true })
      }
    }, { threshold: 1 })

    observer.observe(target)
    return () => observer.disconnect()
  }, [showHistory, historyHasMore, loading, pageLoading, historyPage, fetchTasks])

  const resetFilters = useCallback(() => {
    setSearchTerm("")
    setSelectedMembers([])
    if (!isUser) {
      setSelectedDepartment("")
    }
    setStartDate("")
    setEndDate("")
    dispatch(clearPendingTasks())
    dispatch(clearHistoryTasks())
  }, [isUser, dispatch])

  const handleUserSelectToggle = useCallback((taskId, isChecked) => {
    setUserBulkConfirmIds(prev => {
      const next = new Set(prev)
      if (isChecked) {
        next.add(taskId)
      } else {
        next.delete(taskId)
      }
      return next
    })
  }, [])

  const handleBulkConfirm = useCallback(async () => {
    const ids = Array.from(userBulkConfirmIds)
    if (ids.length === 0) {
      setSubmitMessage({ type: "error", text: "Please select at least one task to confirm." })
      return
    }

    const tasksWithoutRemarks = ids.filter(id => {
      const remark = (userConfirmRemarks[id] || "").trim()
      return !remark
    })

    if (tasksWithoutRemarks.length > 0) {
      setSubmitMessage({ type: "error", text: `Please add remarks for all selected tasks. ${tasksWithoutRemarks.length} task(s) missing remarks.` })
      return
    }

    setIsBulkConfirming(true)
    setSubmitMessage({ type: "info", text: "Confirming tasks, please wait..." })
    
    try {
      const confirmPromises = ids.map(async (taskId) => {
        const remarkToSend = (userConfirmRemarks[taskId] || "").trim()
        const imageToSend = userUploadedImages[taskId]?.file || null
        const doerName2ToSend = doerName2Selections[taskId] || ""
        return dispatch(confirmHousekeepingTask({
          taskId,
          remark: remarkToSend,
          imageFile: imageToSend,
          doerName2: doerName2ToSend
        })).unwrap()
      })

      const results = await Promise.allSettled(confirmPromises)
      const successful = results.filter(r => r.status === "fulfilled").length
      const failed = results.filter(r => r.status === "rejected").length

      if (failed > 0) {
        setSubmitMessage({ type: "error", text: `${successful} confirmed, ${failed} failed.` })
      } else {
        setSuccessMessage(`Successfully confirmed ${successful} tasks!`)
        setSubmitMessage({ type: "", text: "" })
      }

      setUserBulkConfirmIds(new Set())
      ids.forEach(id => {
        setUserConfirmRemarks(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        setUserUploadedImages(prev => {
          const next = { ...prev }
          const existing = next[id]
          if (existing?.previewUrl) {
            URL.revokeObjectURL(existing.previewUrl)
          }
          delete next[id]
          return next
        })
        setDoerName2Selections(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      })

      dispatch(clearPendingTasks())
      await fetchTasks({ page: 1, append: false })
    } catch (error) {
      setSubmitMessage({ type: "error", text: 'Bulk confirmation failed: ' + error.message })
    } finally {
      setIsBulkConfirming(false)
    }
  }, [userBulkConfirmIds, userConfirmRemarks, userUploadedImages, doerName2Selections, dispatch, fetchTasks])

  const renderDateTimeRaw = useCallback((value) => {
    if (!value) return "—"

    const formatTimeTo12h = (timeStr) => {
      if (!timeStr) return ""
      const clean = timeStr.replace("Z", "")
      const [hRaw, mRaw = "00", sRaw = "00"] = clean.split(":")
      const hoursNum = Number(hRaw)
      if (Number.isNaN(hoursNum)) return clean
      const period = hoursNum >= 12 ? "PM" : "AM"
      const twelveHour = hoursNum % 12 === 0 ? 12 : hoursNum % 12
      const seconds = sRaw.includes(".") ? sRaw.split(".")[0] : sRaw
      const showSeconds = seconds && seconds !== "00"
      const formatted = `${String(twelveHour).padStart(2, "0")}:${mRaw.padStart(2, "0")}${showSeconds ? `:${seconds.padStart(2, "0")}` : ""} ${period}`
      return formatted
    }

    if (typeof value === "string" && value.includes("T")) {
      const [datePart, timePart = ""] = value.split("T")
      return (
        <div className="leading-tight break-words">
          <div className="font-medium">{datePart}</div>
          <div className="text-xs text-gray-500">{formatTimeTo12h(timePart)}</div>
        </div>
      )
    }
    return value
  }, [])

  const filteredPendingTasks = useMemo(() => {
    const shouldFilterByDepartment = !isUser && selectedDepartment
    const normalizedSelectedDept = selectedDepartment?.toLowerCase().trim() || "";
    const normalizedSearchTerm = searchTerm?.toLowerCase().trim() || "";

    const filtered = pendingTasks.filter(task => {
      const matchesSearch = normalizedSearchTerm
        ? (
            (task.department || "").toLowerCase().includes(normalizedSearchTerm) ||
            (task.task_description || "").toLowerCase().includes(normalizedSearchTerm)
          )
        : true

      const matchesMember = selectedMembers.length > 0
        ? selectedMembers.includes(task.name)
        : true

      const matchesDepartment = shouldFilterByDepartment
        ? (task.department || "").toLowerCase().trim() === normalizedSelectedDept
        : true

      return matchesSearch && matchesMember && matchesDepartment
    })

    return filtered.sort((a, b) => {
      const aConfirmed = (a.attachment || "").toLowerCase().trim() === "confirmed"
      const bConfirmed = (b.attachment || "").toLowerCase().trim() === "confirmed"
      
      if (aConfirmed !== bConfirmed) {
        return aConfirmed ? 1 : -1
      }
      
      const aDate = a.task_start_date ? new Date(a.task_start_date).getTime() : 0
      const bDate = b.task_start_date ? new Date(b.task_start_date).getTime() : 0
      return bDate - aDate
    })
  }, [pendingTasks, searchTerm, selectedMembers, selectedDepartment, isUser])

  const filteredHistoryData = useMemo(() => {
    const shouldFilterByDepartment = !isUser && selectedDepartment
    const normalizedSelectedDept = selectedDepartment?.toLowerCase().trim() || "";
    const normalizedSearchTerm = searchTerm?.toLowerCase().trim() || "";

    return historyTasks
      .filter(item => {
        const matchesSearch = normalizedSearchTerm
          ? (
              (item.department || "").toLowerCase().includes(normalizedSearchTerm) ||
              (item.task_description || "").toLowerCase().includes(normalizedSearchTerm)
            )
          : true

        const matchesMember = selectedMembers.length > 0
          ? selectedMembers.includes(item.name)
          : true

        const matchesDepartment = shouldFilterByDepartment
          ? (item.department || "").toLowerCase().trim() === normalizedSelectedDept
          : true

        let matchesDateRange = true
        if (startDate || endDate) {
          const itemDate = item.submission_date ? new Date(item.submission_date) : null
          if (!itemDate || isNaN(itemDate.getTime())) return false

          if (startDate) {
            const startDateObj = new Date(startDate)
            startDateObj.setHours(0, 0, 0, 0)
            if (itemDate < startDateObj) matchesDateRange = false
          }

          if (endDate) {
            const endDateObj = new Date(endDate)
            endDateObj.setHours(23, 59, 59, 999)
            if (itemDate > endDateObj) matchesDateRange = false
          }
        }

        return matchesSearch && matchesMember && matchesDepartment && matchesDateRange
      })
      
  }, [historyTasks, searchTerm, selectedMembers, selectedDepartment, startDate, endDate, isUser])

  const getDepartmentsList = useMemo(() => {
    const allDepartments = [...new Set([...pendingTasks, ...historyTasks]
      .map(task => task.department)
      .filter(Boolean))]
    return allDepartments
  }, [pendingTasks, historyTasks])

  const apiOrigin = (() => {
    try {
      return new URL(API_BASE_URL).origin
    } catch {
      return ""
    }
  })()
  const apiBaseWithoutApi = useMemo(() => {
    if (!API_BASE_URL) return ""
    return API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL
  }, [])

  const getTaskImageUrl = useCallback((task) => {
    const candidates = [
      task?.image,
      task?.uploaded_image?.url,
      task?.uploadedImage?.url,
      task?.uploadedImage,
      task?.image_url,
      task?.imageUrl,
    ];

    const rawFound = candidates.find((val) => typeof val === "string" && val.trim() && val !== "null" && val !== "undefined");
    if (!rawFound) return "";

    const raw = rawFound.trim();

    const buildWithOrigin = (path) => {
      if (apiOrigin) {
        const normalized = path.startsWith("/") ? path : `/${path}`
        return `${apiOrigin}${normalized}`
      }
      const base = (API_BASE_URL || "").replace(/\/+$/, "")
      const normalized = path.startsWith("/") ? path : `/${path}`
      return `${base}${normalized}`
    }

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      try {
        const url = new URL(raw)
        const pathPart = `${url.pathname}${url.search}${url.hash}`
        if (apiOrigin && url.origin !== apiOrigin) {
          return `${apiOrigin}${pathPart}`
        }
        return raw
      } catch {
        return raw
      }
    }

    if (raw.startsWith("/api") && apiBaseWithoutApi) {
      return `${apiBaseWithoutApi}${raw}`
    }

    return buildWithOrigin(raw)
  }, [apiOrigin, apiBaseWithoutApi])

  const handleSelectItem = useCallback((taskId, isChecked) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev)
      if (isChecked) {
        newSelected.add(taskId)
      } else {
        newSelected.delete(taskId)
        setAdditionalData(prevData => {
          const newData = { ...prevData }
          delete newData[taskId]
          return newData
        })
        setRemarksData(prevRemarks => {
          const newRemarks = { ...prevRemarks }
          delete newRemarks[taskId]
          return newRemarks
        })
      }
      return newSelected
    })
  }, [])

  const handleCheckboxClick = useCallback((e, taskId) => {
    const task = pendingTasks.find(t => t.task_id === taskId)
    if (task && task.attachment === "confirmed") {
      handleSelectItem(taskId, e.target.checked)
    }
  }, [handleSelectItem, pendingTasks])

  const handleSelectAllItems = useCallback((e) => {
    const checked = e.target.checked
    if (checked) {
      const allConfirmedIds = filteredPendingTasks
        .filter(task => task.attachment === "confirmed")
        .map(task => task.task_id)
      setSelectedItems(new Set(allConfirmedIds))
    } else {
      setSelectedItems(new Set())
      setAdditionalData({})
      setRemarksData({})
    }
  }, [filteredPendingTasks])

  const handleUserImageUpload = useCallback((taskId, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setUserUploadedImages(prev => ({
      ...prev,
      [taskId]: {
        file,
        previewUrl
      }
    }))
  }, [])

  const clearUserImageSelection = useCallback((taskId) => {
    setUserUploadedImages(prev => {
      const next = { ...prev }
      const existing = next[taskId]
      if (existing?.previewUrl) {
        URL.revokeObjectURL(existing.previewUrl)
      }
      delete next[taskId]
      return next
    })
  }, [])

  const toggleHistory = useCallback(() => {
    const newShowHistory = !showHistory
    setShowHistory(newShowHistory)
    
    setSearchTerm("")
    setSelectedMembers([])
    setStartDate("")
    setEndDate("")
    
    if (!isUser) {
      setSelectedDepartment("")
    }
    
    dispatch(clearPendingTasks())
    dispatch(clearHistoryTasks())
  }, [showHistory, isUser, dispatch])

  const handleSubmit = async () => {
    const selectedItemsArray = Array.from(selectedItems);
    if (selectedItemsArray.length === 0) {
      setSubmitMessage({ type: "error", text: "Please select at least one item to submit." })
      return;
    }

    setSubmitMessage({ type: "info", text: "Submitting, please wait..." })

    try {
      const selectedData = selectedItemsArray.map(id => {
        const task = pendingTasks.find(t => t.task_id === id);
        const taskImageUrl = getTaskImageUrl(task);

        return {
          task_id: task.task_id,
          status: additionalData[id] || "Yes",
          remark: remarksData[id] || "",
          attachment: task.attachment,
          doer_name2: doerName2Selections[id] || task.doer_name2 || "",
          image_url: taskImageUrl || null
        };
      });

      const result = await dispatch(submitHousekeepingTasks(selectedData)).unwrap();

      if (result.failed.length > 0) {
        setSubmitMessage({ type: "error", text: `${result.failed.length} submissions failed.` })
      } else {
        setSuccessMessage(`Successfully submitted ${selectedItemsArray.length} tasks!`);
        setSubmitMessage({ type: "", text: "" })
      }

      await fetchTasks({ page: 1, append: false });
      setSelectedItems(new Set());
      setAdditionalData({});
      setRemarksData({});
      setDoerName2Selections({});

    } catch (error) {
      setSubmitMessage({ type: "error", text: 'Submission failed: ' + error.message })
    }
  };

  const selectedItemsCount = selectedItems.size

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
        <div className="flex flex-col gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-700">
            {showHistory ? CONFIG.PAGE_CONFIG.historyTitle : CONFIG.PAGE_CONFIG.title}
          </h1>

          {submitMessage.text ? (
            <div className={`rounded-md px-3 py-2 text-sm sm:text-base ${submitMessage.type === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-blue-50 border border-blue-200 text-blue-700"
              }`}>
              {submitMessage.text}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={showHistory ? "Search history..." : "Search tasks..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm sm:text-base"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleHistory}
                className="flex-1 sm:flex-none rounded-md gradient-bg py-2 px-3 sm:px-4 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base"
              >
                {showHistory ? (
                  <div className="flex items-center justify-center">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Back to Tasks</span>
                    <span className="sm:hidden">Back</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <History className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">View History</span>
                    <span className="sm:hidden">History</span>
                  </div>
                )}
              </button>

              {!showHistory && !isUser && (
                <button
                  onClick={handleSubmit}
                  disabled={selectedItemsCount === 0 || submittingTasks}
                  className="flex-1 sm:flex-none rounded-md gradient-bg py-2 px-3 sm:px-4 text-white hover:from-gray-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base inline-flex items-center justify-center gap-2"
                >
                  {submittingTasks && (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {submittingTasks ? "Submitting..." : `Submit (${selectedItemsCount})`}
                </button>
              )}
            </div>
          </div>

          {!showHistory && isUser && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkConfirm}
                disabled={userBulkConfirmIds.size === 0 || isBulkConfirming}
                className="flex-1 sm:flex-none rounded-md gradient-bg py-2 px-3 sm:px-4 text-white hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base inline-flex items-center justify-center gap-2"
              >
                {isBulkConfirming && (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isBulkConfirming ? "Confirming..." : `Submit (${userBulkConfirmIds.size})`}
              </button>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-3 rounded-md flex items-center justify-between text-sm sm:text-base">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-500 flex-shrink-0" />
              <span className="break-words">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-700 ml-2 flex-shrink-0">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 shadow-md bg-white overflow-hidden">
          {loading || pageLoading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500 mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">Loading task data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center text-sm sm:text-base">
              {error}{" "}
              <button className="underline ml-2" onClick={() => fetchTasks({ page: 1, append: false })}>
                Try again
              </button>
            </div>
          ) : showHistory ? (
            <>
              <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-col gap-3 sm:gap-4">
                  {getDepartmentsList.length > 0 && (
                    <div className="flex flex-col">
                      <label htmlFor="department-filter" className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Filter by Department:
                      </label>
                      <select
                        id="department-filter"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="text-xs sm:text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-500 w-full sm:max-w-xs"
                      >
                        <option value="">All Departments</option>
                        {getDepartmentsList.map((department, idx) => (
                          <option key={idx} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(selectedMembers.length > 0 || selectedDepartment || startDate || endDate || searchTerm) && (
                    <button
                      onClick={resetFilters}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>

              <div ref={tableContainerRef} className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        S.No
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Task ID
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Department
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                        Task Description
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 whitespace-nowrap">
                        Task Start Date
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Freq
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Confirmed By HOD
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 whitespace-nowrap">
                        Actual Date
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[120px]">
                        Remarks
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        File
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((history, index) => {
                        const historyImageUrl = getTaskImageUrl(history)
                        return (
                          <tr key={history.task_id} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-3 py-2 sm:py-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 break-words text-center">
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                                {history.task_id || "—"}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900 break-words">{history.department || "—"}</div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 min-w-[150px]">
                              <div className="text-xs sm:text-sm text-gray-900 break-words" title={history.task_description}>
                                {history.task_description || "—"}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50">
                              <div className="text-xs sm:text-sm text-gray-900 break-words">
                                {renderDateTimeRaw(history.task_start_date)}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900 break-words">{history.frequency || "—"}</div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900 break-words">
                                {history.attachment === "confirmed" ? (
                                  <span className="text-green-600 font-medium">Confirmed</span>
                                ) : (
                                  history.attachment || "—"
                                )}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 bg-green-50">
                              <div className="text-xs sm:text-sm text-gray-900 break-words">
                                {renderDateTimeRaw(history.submission_date)}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 bg-blue-50">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full break-words ${history.status === "Yes"
                                  ? "bg-green-100 text-green-800"
                                  : history.status === "No"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                  }`}
                              >
                                {history.status || "—"}
                              </span>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 bg-gray-50 min-w-[120px]">
                              <div className="text-xs sm:text-sm text-gray-900 break-words" title={history.remark}>
                                {history.remark || "—"}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4">
                              {historyImageUrl ? (
                                <img
                                  src={historyImageUrl}
                                  alt="Attachment"
                                  crossOrigin="anonymous"
                                  className="h-24 w-24 object-cover rounded-md mr-2 flex-shrink-0 border border-gray-200"
                                />
                              ) : (
                                <span className="text-gray-400 text-xs sm:text-sm">No file</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                          {searchTerm || selectedMembers.length > 0 || startDate || endDate
                            ? "No historical records matching your filters"
                            : "No completed records found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div ref={historySentinelRef} className="h-4" />
              </div>
            </>
          ) : (
            <div>
              {!showHistory && !isUser && getDepartmentsList.length > 0 && (
                <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex flex-col-2 sm:flex-row items-start sm:items-end gap-3">
                    <div className="flex-1 min-w-0">
                      <label htmlFor="pending-department-filter" className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                        Filter by Department:
                      </label>
                      <select
                        id="pending-department-filter"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="text-xs sm:text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-500 w-full sm:max-w-xs"
                      >
                        <option value="">All Departments</option>
                        {getDepartmentsList.map((department, idx) => (
                          <option key={idx} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(selectedMembers.length > 0 || selectedDepartment || searchTerm) && (
                      <button
                        onClick={resetFilters}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-xs sm:text-sm whitespace-nowrap mt-6 sm:mt-0"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div ref={tableContainerRef} className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {isUser ? (
                        <>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-0 z-30 bg-white">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                              checked={filteredPendingTasks.length > 0 && filteredPendingTasks.filter(t => t.attachment !== "confirmed").every(t => userBulkConfirmIds.has(t.task_id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const allPendingIds = filteredPendingTasks
                                    .filter(t => t.attachment !== "confirmed")
                                    .map(t => t.task_id)
                                  setUserBulkConfirmIds(new Set(allPendingIds))
                                } else {
                                  setUserBulkConfirmIds(new Set())
                                }
                              }}
                            />
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Department
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                            Task Description
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 whitespace-nowrap">
                            Task Start Date
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Freq
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Upload Image
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Doer Name 2
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Confirm By HOD
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Remark
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-16">
                            Seq. No.
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                              checked={filteredPendingTasks.length > 0 && selectedItems.size === filteredPendingTasks.filter(t => t.attachment === "confirmed").length}
                              onChange={handleSelectAllItems}
                            />
                          </th> 
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Task ID
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Department
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Doer Name 2
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                            Task Description
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 whitespace-nowrap">
                            Task Start Date
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Freq
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Confirmed By HOD
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Status
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                            Remarks
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Image
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPendingTasks.length > 0 ? (
                      filteredPendingTasks.map((task, index) => {
                        const isSelected = selectedItems.has(task.task_id)
                        const sequenceNumber = index + 1
                        const taskImageUrl = getTaskImageUrl(task)
                        return (
                          <tr key={task.task_id} className={`${isSelected ? "bg-gray-50" : ""} hover:bg-gray-50`}>
                            {isUser ? (
                              <>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 sticky left-0 z-20 bg-white">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                    checked={userBulkConfirmIds.has(task.task_id)}
                                    onChange={(e) => handleUserSelectToggle(task.task_id, e.target.checked)}
                                    disabled={task.attachment === "confirmed"}
                                  />
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words">{task.department || "—"}</div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 min-w-[150px]">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words" title={task.task_description}>
                                    {task.task_description || "—"}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words">
                                    {renderDateTimeRaw(task.task_start_date)}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words">{task.frequency || "—"}</div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <div className="flex items-center gap-2">
                                    {userUploadedImages[task.task_id]?.previewUrl || taskImageUrl ? (
                                      <img
                                        src={userUploadedImages[task.task_id]?.previewUrl || taskImageUrl}
                                        alt="Task attachment"
                                        crossOrigin="anonymous"
                                        className="h-24 w-24 object-cover rounded-md border border-gray-200"
                                      />
                                    ) : (
                                      <span className="text-xs text-gray-400">No image</span>
                                    )}
                                    <label
                                      className={`flex items-center gap-1 text-gray-700 ${task.attachment === "confirmed" ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:text-gray-900"}`}
                                    >
                                      <Upload className="h-4 w-4 flex-shrink-0" />
                                      <span className="text-xs">Upload</span>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleUserImageUpload(task.task_id, e)}
                                        disabled={task.attachment === "confirmed"}
                                      />
                                    </label>
                                    {userUploadedImages[task.task_id] && task.attachment !== "confirmed" && (
                                      <button
                                        type="button"
                                        onClick={() => clearUserImageSelection(task.task_id)}
                                        className="text-xs text-red-600 hover:text-red-800"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <select
                                    value={doerName2Selections[task.task_id] ?? task.doer_name2 ?? ""}
                                    onChange={(e) => setDoerName2Selections(prev => ({ ...prev, [task.task_id]: e.target.value }))}
                                    disabled={task.attachment === "confirmed"}
                                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100"
                                  >
                                    <option value="">Select...</option>
                                    {DOER2_OPTIONS.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words">
                                    {task.attachment === "confirmed" ? (
                                      <span className="text-green-600 font-medium">Confirmed</span>
                                    ) : (
                                      task.attachment || "Pending"
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <input
                                    type="text"
                                    placeholder="Enter remark"
                                    value={userConfirmRemarks[task.task_id] || ""}
                                    onChange={(e) => setUserConfirmRemarks(prev => ({ ...prev, [task.task_id]: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                                    disabled={task.attachment === "confirmed"}
                                  />
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 w-16">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 text-center">
                                    {sequenceNumber}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 w-12">
                                  <input
                                    type="checkbox"
                                    className={`h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500 ${task.attachment !== "confirmed" ? "opacity-50 cursor-not-allowed" : ""
                                      }`}
                                    checked={isSelected}
                                    onChange={(e) => handleCheckboxClick(e, task.task_id)}
                                    disabled={task.attachment !== "confirmed"}
                                  />
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words">{task.task_id || "—"}</div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words">{task.department || "—"}</div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words">
                                    {doerName2Selections[task.task_id] || task.doer_name2 || "—"}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 min-w-[150px]">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words" title={task.task_description}>
                                    {task.task_description || "—"}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words">
                                    {renderDateTimeRaw(task.task_start_date)}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words">{task.frequency || "—"}</div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4">
                                  <div className="text-xs sm:text-sm text-gray-900 break-words">
                                    {task.attachment === "confirmed" ? (
                                      <span className="text-green-600 font-medium">Confirmed</span>
                                    ) : (
                                      task.attachment || "—"
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 bg-yellow-50">
                                  <select
                                    disabled={!isSelected || task.attachment !== "confirmed"}
                                    value={additionalData[task.task_id] || ""}
                                    onChange={(e) => {
                                      setAdditionalData(prev => ({ ...prev, [task.task_id]: e.target.value }))
                                      if (e.target.value !== "No") {
                                        setRemarksData(prev => {
                                          const newData = { ...prev }
                                          delete newData[task.task_id]
                                          return newData
                                        })
                                      }
                                    }}
                                    className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed text-xs sm:text-sm"
                                  >
                                    <option value="">Select...</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 bg-orange-50 min-w-[120px]">
                                  <textarea
                                    disabled={!isSelected || task.attachment !== "confirmed"}
                                    value={remarksData[task.task_id] || ""}
                                    onChange={(e) => setRemarksData(prev => ({ ...prev, [task.task_id]: e.target.value }))}
                                    className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed text-xs sm:text-sm"
                                    rows={2}
                                    placeholder="Enter remarks"
                                  />
                                </td>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 bg-green-50">
                                  {taskImageUrl ? (
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={taskImageUrl}
                                        alt="Attachment"
                                        crossOrigin="anonymous"
                                        className="h-24 w-24 object-cover rounded-md border border-gray-200"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">No image</span>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={isUser ? 10 : 12} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                          {searchTerm || selectedMembers.length > 0
                            ? "No tasks matching your search"
                            : "No pending tasks found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div ref={pendingSentinelRef} className="h-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default HousekeepingTasksPage

