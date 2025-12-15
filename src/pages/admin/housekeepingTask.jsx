"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { CheckCircle2, Upload, X, Search, History, ArrowLeft } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout.jsx"
import { getPendingTasks, getHistoryTasks, submitTasks, confirmTask } from "../../components/api/delegationApi.js"
import { API_BASE_URL } from "../../components/api/axios.js"

// Configuration object
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


function HousekeepingDataPage() {
  const [pendingTasks, setPendingTasks] = useState([])
  const [historyTasks, setHistoryTasks] = useState([])
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userDepartment, setUserDepartment] = useState("")
  const [confirmingTask, setConfirmingTask] = useState(null)
  const [userConfirmRemarks, setUserConfirmRemarks] = useState({})
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" })
  const [doerName2Selections, setDoerName2Selections] = useState({})

  const tableContainerRef = useRef(null)


  useEffect(() => {
  const role = localStorage.getItem("role")
  const username = localStorage.getItem("user-name")

  if (role) setUserRole(role)
  if (username) setUserDepartment("") // keep as-is if unused
}, [])


  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // (auth removed) userRole and userDepartment remain empty strings unless set elsewhere

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
     const filters = {}

if (selectedDepartment) {
  filters.department = selectedDepartment
}

if (userRole?.toLowerCase() === "user") {
  filters.name = localStorage.getItem("user-name")
}

const data = showHistory
  ? await getHistoryTasks(filters)
  : await getPendingTasks(filters)

showHistory ? setHistoryTasks(data) : setPendingTasks(data)

    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [showHistory, selectedDepartment])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetFilters = useCallback(() => {
    setSearchTerm("")
    setSelectedMembers([])
    setSelectedDepartment("")
    setStartDate("")
    setEndDate("")
  }, [])

  // NEW FUNCTION FOR USER CONFIRMATION
  const handleConfirmTask = async (taskId) => {
    setConfirmingTask(taskId)
    try {
      const remarkToSend = (userConfirmRemarks[taskId] || "").trim()
      if (!remarkToSend) {
        setConfirmingTask(null)
        return
      }
      const imageToSend = userUploadedImages[taskId]?.file || null
      const doerName2ToSend = doerName2Selections[taskId] || ""
      await confirmTask(taskId, remarkToSend, imageToSend, doerName2ToSend)
      setSuccessMessage("Task confirmed successfully!")
      setUserConfirmRemarks(prev => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
      setUserUploadedImages(prev => {
        const next = { ...prev }
        const existing = next[taskId]
        if (existing?.previewUrl) {
          URL.revokeObjectURL(existing.previewUrl)
        }
        delete next[taskId]
        return next
      })
      // Reload data to reflect changes
      await loadData()
    } catch (error) {
      console.error('Confirmation error:', error)
      alert('Confirmation failed: ' + error.message)
    } finally {
      setConfirmingTask(null)
    }
  }

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
    const normalizedSelectedDept = selectedDepartment?.toLowerCase().trim() || "";

    return pendingTasks.filter(task => {
      const matchesSearch = searchTerm
        ? Object.values(task).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
        : true

      const matchesMember = selectedMembers.length > 0
        ? selectedMembers.includes(task.name)
        : true

      const matchesDepartment = selectedDepartment
        ? (task.department || "").toLowerCase().trim() === normalizedSelectedDept
        : true

      return matchesSearch && matchesMember && matchesDepartment
    })
  }, [pendingTasks, searchTerm, selectedMembers, selectedDepartment])

  const filteredHistoryData = useMemo(() => {
    const normalizedSelectedDept = selectedDepartment?.toLowerCase().trim() || "";

    return historyTasks
      .filter(item => {
        const matchesSearch = searchTerm
          ? Object.entries(item).some(([key, value]) => {
            if (['image', 'admin_done'].includes(key)) return false
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          })
          : true

        const matchesMember = selectedMembers.length > 0
          ? selectedMembers.includes(item.name)
          : true

        const matchesDepartment = selectedDepartment
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
      
  }, [historyTasks, searchTerm, selectedMembers, selectedDepartment, startDate, endDate])

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
  }, [API_BASE_URL, apiOrigin, apiBaseWithoutApi])

  // Selection handlers (for admin only)
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
    // Only allow selection if task is confirmed by HOD
    if (task && task.attachment === "confirmed") {
      handleSelectItem(taskId, e.target.checked)
    }
  }, [handleSelectItem, pendingTasks])

  const handleSelectAllItems = useCallback((e) => {
    const checked = e.target.checked
    if (checked) {
      // Only select tasks where attachment is "confirmed"
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

  const handleMemberSelection = useCallback((member) => {
    setSelectedMembers(prev =>
      prev.includes(member)
        ? prev.filter(item => item !== member)
        : [...prev, member]
    )
  }, [])

  const toggleHistory = useCallback(() => {
    setShowHistory(prev => !prev)
    resetFilters()
  }, [resetFilters])

  // Admin submit function
  const handleSubmit = async () => {
    const selectedItemsArray = Array.from(selectedItems);
    if (selectedItemsArray.length === 0) {
      setSubmitMessage({ type: "error", text: "Please select at least one item to submit." })
      return;
    }

    setSubmitMessage({ type: "info", text: "Submitting, please wait..." })
    setIsSubmitting(true);

    try {
      const selectedData = selectedItemsArray.map(id => {
        const task = pendingTasks.find(t => t.task_id === id);
        const taskImageUrl = getTaskImageUrl(task);

        return {
          task_id: task.task_id,
          status: additionalData[id] || "Yes",
          remark: remarksData[id] || "",
          attachment: task.attachment, // Use the existing attachment value (including "confirmed")
          doer_name2: doerName2Selections[id] || task.doer_name2 || "",
          image_url: taskImageUrl || null
        };
      });

      const result = await submitTasks(selectedData);

      if (result.failed.length > 0) {
        setSubmitMessage({ type: "error", text: `${result.failed.length} submissions failed. Check console for details.` })
        console.error('Failed submissions:', result.failed);
      } else {
        setSuccessMessage(`Successfully submitted ${selectedItemsArray.length} tasks!`);
        setSubmitMessage({ type: "", text: "" })
      }

      await loadData();
      setSelectedItems(new Set());
      setAdditionalData({});
      setRemarksData({});
      setDoerName2Selections({});

    } catch (error) {
      console.error('Submission error:', error);
      setSubmitMessage({ type: "error", text: 'Submission failed: ' + error.message })
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItemsCount = selectedItems.size
  const isUser = userRole && userRole.toLowerCase() === 'user'

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
                  disabled={selectedItemsCount === 0 || isSubmitting}
                  className="flex-1 sm:flex-none rounded-md gradient-bg py-2 px-3 sm:px-4 text-white hover:from-gray-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base inline-flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isSubmitting ? "Submitting..." : `Submit (${selectedItemsCount})`}
                </button>
              )}
            </div>
          </div>
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
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500 mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">Loading task data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center text-sm sm:text-base">
              {error}{" "}
              <button className="underline ml-2" onClick={loadData}>
                Try again
              </button>
            </div>
          ) : showHistory ? (
            <>
              {/* History Filters */}
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

              {/* History Table */}
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
              </div>
            </>
          ) : (
            <div>
              {/* Pending Tasks - Different views for User vs Admin */}
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
                      {/* USER VIEW - SIMPLIFIED COLUMNS */}
                      {isUser ? (
                        <>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-0 z-30 bg-white">
                            Action
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
                            COnfirm By HOD
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            Remark
                          </th>
                        </>
                      ) : (
                        /* ADMIN VIEW - FULL COLUMNS */
                        <>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-16">
                            Seq. No.
                          </th>
                          <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                              checked={filteredPendingTasks.length > 0 && selectedItems.size === filteredPendingTasks.length}
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
                        const userRemarkTrimmed = (userConfirmRemarks[task.task_id] || "").trim()
                        const taskImageUrl = getTaskImageUrl(task)
                        return (
                          <tr key={task.task_id} className={`${isSelected ? "bg-gray-50" : ""} hover:bg-gray-50`}>
                            {isUser ? (
                              /* USER VIEW ROW */
                              <>
                                <td className="px-2 sm:px-3 py-2 sm:py-4 sticky left-0 z-20 bg-white">
                                  <button
                                    onClick={() => handleConfirmTask(task.task_id)}
                                    disabled={confirmingTask === task.task_id || task.attachment === "confirmed" || !userRemarkTrimmed}
                                    className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium ${task.attachment === "confirmed"
                                      ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                                      : "bg-green-600 text-white hover:bg-green-700"
                                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {confirmingTask === task.task_id
                                      ? "Confirming..."
                                      : task.attachment === "confirmed"
                                        ? "Confirmed"
                                        : "Confirm"
                                    }
                                  </button>
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
                              /* ADMIN VIEW ROW */
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
                                    disabled={task.attachment !== "confirmed"} // Disable if not confirmed
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
                                  <div className="text-xs sm:text-sm text-gray-900 break-words" title={task.remark}>
                                    {task.remark || "—"}
                                  </div>
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
                        <td colSpan={isUser ? 9 : 12} className="px-4 sm:px-6 py-4 text-center text-gray-500 text-xs sm:text-sm">
                          {searchTerm || selectedMembers.length > 0
                            ? "No tasks matching your search"
                            : "No pending tasks found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default HousekeepingDataPage
