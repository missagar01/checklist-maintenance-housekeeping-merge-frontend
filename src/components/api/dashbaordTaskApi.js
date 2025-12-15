import api from "../Api/axios";

const todayISO = () => new Date().toISOString().split("T")[0];

const safeGet = async (endpoint, params = {}) => {
  const response = await api.get(endpoint, { params });
  return response.data;
};

export const taskApi = {
  // Explicit today endpoint for dashboard "Recent/Today" tab
  getTodayTasks: (options = {}) =>
    safeGet("/housekeeping-dashboard/assigntask/generate/today", {
      limit: 100,
      page: 1,
      ...options,
    }),

  // Scope to today's window to reduce payload; kept for compatibility
  getRecentTasks: (options = {}) => taskApi.getTodayTasks(options),
  getTomorrowTasks: (options = {}) =>
    safeGet("/housekeeping-dashboard/assigntask/generate/tomorrow", {
      limit: 100,
      page: 1,
      ...options,
    }),
  getOverdueTasks: (options = {}) =>
    safeGet("/housekeeping-dashboard/assigntask/generate/overdue", {
      end_date: todayISO(),
      limit: 100,
      page: 1,
      ...options,
    }),
  // Changed: getNotDoneTasks now returns upcoming (tomorrow's) tasks
  getNotDoneTasks: (options = {}) => taskApi.getTomorrowTasks(options),

  getTasksWithFilters: (taskType, page = 1, limit = 50, filters = {}) => {
    let endpoint = "/housekeeping-dashboard/assigntask/generate";
    if (taskType === "overdue") endpoint = "/housekeeping-dashboard/assigntask/generate/overdue";
    else if (taskType === "recent") endpoint = "/housekeeping-dashboard/assigntask/generate/today";
    else if (taskType === "upcoming" || taskType === "not-done") endpoint = "/housekeeping-dashboard/assigntask/generate/tomorrow";
    return safeGet(endpoint, {
      page,
      limit,
      start_date: filters.start_date || todayISO(),
      ...filters,
    });
  },

  getTodayCount: (filters = {}) =>
    safeGet("/housekeeping-dashboard/assigntask/generate/today/count", filters),

  getTomorrowCount: (filters = {}) =>
    safeGet("/housekeeping-dashboard/assigntask/generate/tomorrow/count", filters),

  getOverdueCount: (filters = {}) =>
    safeGet("/housekeeping-dashboard/assigntask/generate/overdue/count", filters),

  getTaskCounts: async (filters = {}) => {
    const [recentData, upcomingData, overdueData] = await Promise.all([
      taskApi.getTodayCount(filters),
      taskApi.getTomorrowCount(filters),
      taskApi.getOverdueCount(filters),
    ]);

    return {
      recent: recentData.count || 0,
      upcoming: upcomingData.count || 0,
      overdue: overdueData.count || 0,
    };
  },
};

export default taskApi;
