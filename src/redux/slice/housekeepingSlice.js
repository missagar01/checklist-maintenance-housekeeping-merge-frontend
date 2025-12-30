import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  assignHousekeepingTaskAPI,
  getHousekeepingLocationsAPI,
  getHousekeepingUserDepartmentsAPI,
  createHousekeepingLocationAPI,
  getHousekeepingPendingTasksAPI,
  getHousekeepingHistoryTasksAPI,
  confirmHousekeepingTaskAPI,
  submitHousekeepingTasksAPI,
  updateHousekeepingTaskAPI,
  getHousekeepingGivenByAPI,
  getHousekeepingDashboardSummaryAPI,
  getHousekeepingDepartmentsAPI,
  getHousekeepingTaskCountsAPI,
  getHousekeepingTasksWithFiltersAPI,
} from "../api/housekeepingApi";

const initialState = {
  // Task assignment
  locations: [],
  userDepartments: [],
  givenByOptions: [],
  doerNames: [],
  
  // Tasks
  pendingTasks: [],
  historyTasks: [],
  
  // Dashboard
  dashboardSummary: {
    total: 0,
    completed: 0,
    pending: 0,
    upcoming: 0,
    overdue: 0,
    progress_percent: 0
  },
  dashboardDepartments: [],
  dashboardTasks: [],
  taskCounts: {
    recent: 0,
    upcoming: 0,
    overdue: 0
  },
  
  // Loading states
  loading: false,
  assigningTask: false,
  creatingLocation: false,
  confirmingTask: false,
  submittingTasks: false,
  loadingDashboard: false,
  loadingTaskCounts: false,
  loadingDashboardTasks: false,
  
  // Error states
  error: null,
  
  // Pagination
  pendingPage: 1,
  historyPage: 1,
  pendingHasMore: true,
  historyHasMore: true,
  dashboardPage: 1,
  dashboardHasMore: true,
};

// Async thunks

// Assign Task
export const assignHousekeepingTask = createAsyncThunk(
  "housekeeping/assignTask",
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await assignHousekeepingTaskAPI(taskData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Get Locations
export const fetchHousekeepingLocations = createAsyncThunk(
  "housekeeping/fetchLocations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getHousekeepingLocationsAPI();
      // API returns array of {location: "..."} objects
      const data = Array.isArray(response.data) ? response.data : [];
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Get User Departments
export const fetchHousekeepingUserDepartments = createAsyncThunk(
  "housekeeping/fetchUserDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getHousekeepingUserDepartmentsAPI();
      // API returns array of user objects with department and user_name
      const data = Array.isArray(response.data) ? response.data : [];
      return data;
    } catch (error) {
      // Handle 403 silently for user role
      if (error.response?.status === 403 || error.response?.status === 404) {
        return [];
      }
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Create Location
export const createHousekeepingLocation = createAsyncThunk(
  "housekeeping/createLocation",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await createHousekeepingLocationAPI(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Get Pending Tasks
export const fetchHousekeepingPendingTasks = createAsyncThunk(
  "housekeeping/fetchPendingTasks",
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await getHousekeepingPendingTasksAPI(page, filters);
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items || [];
      const total = data?.total ?? items.length;
      const limit = filters.limit || 100;
      
      return {
        items,
        total,
        page,
        hasMore: (page * limit) < total && items.length > 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Get History Tasks
export const fetchHousekeepingHistoryTasks = createAsyncThunk(
  "housekeeping/fetchHistoryTasks",
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await getHousekeepingHistoryTasksAPI(page, filters);
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items || [];
      const total = data?.total ?? items.length;
      const limit = filters.limit || 100;
      
      return {
        items,
        total,
        page,
        hasMore: (page * limit) < total && items.length > 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Confirm Task
export const confirmHousekeepingTask = createAsyncThunk(
  "housekeeping/confirmTask",
  async ({ taskId, remark = "", imageFile = null, doerName2 = "" }, { rejectWithValue }) => {
    try {
      const response = await confirmHousekeepingTaskAPI(taskId, remark, imageFile, doerName2);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Submit Tasks (bulk)
export const submitHousekeepingTasks = createAsyncThunk(
  "housekeeping/submitTasks",
  async (tasks, { rejectWithValue }) => {
    try {
      const response = await submitHousekeepingTasksAPI(tasks);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Update Task
export const updateHousekeepingTask = createAsyncThunk(
  "housekeeping/updateTask",
  async ({ taskId, updateData }, { rejectWithValue }) => {
    try {
      const response = await updateHousekeepingTaskAPI(taskId, updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Get Given By options
export const fetchHousekeepingGivenBy = createAsyncThunk(
  "housekeeping/fetchGivenBy",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getHousekeepingGivenByAPI();
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      // If API doesn't exist, return empty array
      if (error.response?.status === 404) {
        return [];
      }
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Dashboard APIs
export const fetchHousekeepingDashboardSummary = createAsyncThunk(
  "housekeeping/fetchDashboardSummary",
  async (options = {}, { rejectWithValue }) => {
    try {
      const response = await getHousekeepingDashboardSummaryAPI(options);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchHousekeepingDepartments = createAsyncThunk(
  "housekeeping/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getHousekeepingDepartmentsAPI();
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchHousekeepingTaskCounts = createAsyncThunk(
  "housekeeping/fetchTaskCounts",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const counts = await getHousekeepingTaskCountsAPI(filters);
      return counts;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchHousekeepingDashboardTasks = createAsyncThunk(
  "housekeeping/fetchDashboardTasks",
  async ({ taskType, page = 1, limit = 50, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await getHousekeepingTasksWithFiltersAPI(taskType, page, limit, filters);
      const data = response.data;
      const items = Array.isArray(data) ? data : data?.items || [];
      const total = data?.total ?? items.length;
      
      return {
        items,
        total,
        page,
        taskType,
        hasMore: (page * limit) < total && items.length > 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);


const housekeepingSlice = createSlice({
  name: "housekeeping",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPendingTasks: (state) => {
      state.pendingTasks = [];
      state.pendingPage = 1;
      state.pendingHasMore = true;
    },
    clearHistoryTasks: (state) => {
      state.historyTasks = [];
      state.historyPage = 1;
      state.historyHasMore = true;
    },
    setPendingPage: (state, action) => {
      state.pendingPage = action.payload;
    },
    setHistoryPage: (state, action) => {
      state.historyPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Assign Task
      .addCase(assignHousekeepingTask.pending, (state) => {
        state.assigningTask = true;
        state.error = null;
      })
      .addCase(assignHousekeepingTask.fulfilled, (state) => {
        state.assigningTask = false;
      })
      .addCase(assignHousekeepingTask.rejected, (state, action) => {
        state.assigningTask = false;
        state.error = action.payload;
      })
      
      // Fetch Locations
      .addCase(fetchHousekeepingLocations.fulfilled, (state, action) => {
        state.locations = action.payload;
      })
      
      // Fetch User Departments
      .addCase(fetchHousekeepingUserDepartments.fulfilled, (state, action) => {
        state.userDepartments = action.payload;
      })
      
      // Create Location
      .addCase(createHousekeepingLocation.pending, (state) => {
        state.creatingLocation = true;
        state.error = null;
      })
      .addCase(createHousekeepingLocation.fulfilled, (state) => {
        state.creatingLocation = false;
      })
      .addCase(createHousekeepingLocation.rejected, (state, action) => {
        state.creatingLocation = false;
        state.error = action.payload;
      })
      
      // Fetch Pending Tasks
      .addCase(fetchHousekeepingPendingTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHousekeepingPendingTasks.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.page === 1) {
          state.pendingTasks = action.payload.items;
        } else {
          state.pendingTasks = [...state.pendingTasks, ...action.payload.items];
        }
        state.pendingPage = action.payload.page;
        state.pendingHasMore = action.payload.hasMore;
      })
      .addCase(fetchHousekeepingPendingTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch History Tasks
      .addCase(fetchHousekeepingHistoryTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHousekeepingHistoryTasks.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.page === 1) {
          state.historyTasks = action.payload.items;
        } else {
          state.historyTasks = [...state.historyTasks, ...action.payload.items];
        }
        state.historyPage = action.payload.page;
        state.historyHasMore = action.payload.hasMore;
      })
      .addCase(fetchHousekeepingHistoryTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Confirm Task
      .addCase(confirmHousekeepingTask.pending, (state) => {
        state.confirmingTask = true;
        state.error = null;
      })
      .addCase(confirmHousekeepingTask.fulfilled, (state, action) => {
        state.confirmingTask = false;
        // Update the task in pending tasks
        const updatedTask = action.payload;
        state.pendingTasks = state.pendingTasks.map(task =>
          task.task_id === updatedTask.task_id ? updatedTask : task
        );
      })
      .addCase(confirmHousekeepingTask.rejected, (state, action) => {
        state.confirmingTask = false;
        state.error = action.payload;
      })
      
      // Submit Tasks
      .addCase(submitHousekeepingTasks.pending, (state) => {
        state.submittingTasks = true;
        state.error = null;
      })
      .addCase(submitHousekeepingTasks.fulfilled, (state) => {
        state.submittingTasks = false;
      })
      .addCase(submitHousekeepingTasks.rejected, (state, action) => {
        state.submittingTasks = false;
        state.error = action.payload;
      })
      
      // Update Task
      .addCase(updateHousekeepingTask.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        state.pendingTasks = state.pendingTasks.map(task =>
          task.task_id === updatedTask.task_id ? updatedTask : task
        );
        state.historyTasks = state.historyTasks.map(task =>
          task.task_id === updatedTask.task_id ? updatedTask : task
        );
      })
      
      // Fetch Given By
      .addCase(fetchHousekeepingGivenBy.fulfilled, (state, action) => {
        state.givenByOptions = action.payload;
      })
      
      // Dashboard Summary
      .addCase(fetchHousekeepingDashboardSummary.pending, (state) => {
        state.loadingDashboard = true;
        state.error = null;
      })
      .addCase(fetchHousekeepingDashboardSummary.fulfilled, (state, action) => {
        state.loadingDashboard = false;
        state.dashboardSummary = action.payload || state.dashboardSummary;
      })
      .addCase(fetchHousekeepingDashboardSummary.rejected, (state, action) => {
        state.loadingDashboard = false;
        state.error = action.payload;
      })
      
      // Dashboard Departments
      .addCase(fetchHousekeepingDepartments.fulfilled, (state, action) => {
        state.dashboardDepartments = action.payload;
      })
      
      // Task Counts
      .addCase(fetchHousekeepingTaskCounts.pending, (state) => {
        state.loadingTaskCounts = true;
      })
      .addCase(fetchHousekeepingTaskCounts.fulfilled, (state, action) => {
        state.loadingTaskCounts = false;
        state.taskCounts = action.payload;
      })
      .addCase(fetchHousekeepingTaskCounts.rejected, (state) => {
        state.loadingTaskCounts = false;
      })
      
      // Dashboard Tasks
      .addCase(fetchHousekeepingDashboardTasks.pending, (state) => {
        state.loadingDashboardTasks = true;
        state.error = null;
      })
      .addCase(fetchHousekeepingDashboardTasks.fulfilled, (state, action) => {
        state.loadingDashboardTasks = false;
        if (action.payload.page === 1) {
          state.dashboardTasks = action.payload.items;
        } else {
          state.dashboardTasks = [...state.dashboardTasks, ...action.payload.items];
        }
        state.dashboardPage = action.payload.page;
        state.dashboardHasMore = action.payload.hasMore;
      })
      .addCase(fetchHousekeepingDashboardTasks.rejected, (state, action) => {
        state.loadingDashboardTasks = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearError,
  clearPendingTasks,
  clearHistoryTasks,
  setPendingPage,
  setHistoryPage
} = housekeepingSlice.actions;

export default housekeepingSlice.reducer;

