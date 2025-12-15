import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getMaintenanceTasksAPI,
  getPendingMaintenanceTasksAPI,
  getCompletedMaintenanceTasksAPI,
  updateMaintenanceTaskAPI,
  updateMultipleMaintenanceTasksAPI,
  getUniqueMachineNamesAPI,
  getUniqueAssignedPersonnelAPI,
  getMaintenanceStatisticsAPI
} from "../api/maintenanceApi";

const initialState = {
  tasks: [],
  history: [],
  machineNames: [],
  assignedPersonnel: [],
  statistics: null,
  loading: false,
  error: null,
  currentPage: 1,
  hasMore: true,
  currentPageHistory: 1,
  hasMoreHistory: true
};

// Async thunks
export const fetchMaintenanceTasks = createAsyncThunk(
  "maintenance/fetchTasks",
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await getMaintenanceTasksAPI(page, filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchPendingMaintenanceTasks = createAsyncThunk(
  "maintenance/fetchPendingTasks",
  async ({ page = 1, userId = null }, { rejectWithValue }) => {
    try {
      const response = await getPendingMaintenanceTasksAPI(page, userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchCompletedMaintenanceTasks = createAsyncThunk(
  "maintenance/fetchCompletedTasks",
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await getCompletedMaintenanceTasksAPI(page, filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateMaintenanceTask = createAsyncThunk(
  "maintenance/updateTask",
  async ({ taskId, updateData }, { rejectWithValue }) => {
    try {
      const response = await updateMaintenanceTaskAPI(taskId, updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateMultipleMaintenanceTasks = createAsyncThunk(
  "maintenance/updateMultipleTasks",
  async (tasks, { rejectWithValue }) => {
    try {
      const response = await updateMultipleMaintenanceTasksAPI(tasks);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchUniqueMachineNames = createAsyncThunk(
  "maintenance/fetchMachineNames",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUniqueMachineNamesAPI();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchUniqueAssignedPersonnel = createAsyncThunk(
  "maintenance/fetchAssignedPersonnel",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUniqueAssignedPersonnelAPI();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchMaintenanceStatistics = createAsyncThunk(
  "maintenance/fetchStatistics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMaintenanceStatisticsAPI();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const maintenanceSlice = createSlice({
  name: "maintenance",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setCurrentPageHistory: (state, action) => {
      state.currentPageHistory = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTasks: (state) => {
      state.tasks = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
    clearHistory: (state) => {
      state.history = [];
      state.currentPageHistory = 1;
      state.hasMoreHistory = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchMaintenanceTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceTasks.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg.page === 1) {
          state.tasks = action.payload.data;
        } else {
          state.tasks = [...state.tasks, ...action.payload.data];
        }
        state.currentPage = action.meta.arg.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchMaintenanceTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch pending tasks
      .addCase(fetchPendingMaintenanceTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingMaintenanceTasks.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg.page === 1) {
          state.tasks = action.payload.data;
        } else {
          state.tasks = [...state.tasks, ...action.payload.data];
        }
        state.currentPage = action.meta.arg.page;
        state.hasMore = action.payload.hasMore;
      })
      
      // Fetch completed tasks
      .addCase(fetchCompletedMaintenanceTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompletedMaintenanceTasks.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg.page === 1) {
          state.history = action.payload.data;
        } else {
          state.history = [...state.history, ...action.payload.data];
        }
        state.currentPageHistory = action.meta.arg.page;
        state.hasMoreHistory = action.payload.hasMore;
      })
      
      // Update task
      .addCase(updateMaintenanceTask.fulfilled, (state, action) => {
        // Update the task in the tasks array
        const updatedTask = action.payload.data;
        state.tasks = state.tasks.map(task => 
          task.task_id === updatedTask.task_id ? updatedTask : task
        );
        // Also update in history if exists
        state.history = state.history.map(task => 
          task.task_id === updatedTask.task_id ? updatedTask : task
        );
      })
      
      // Update multiple tasks
      .addCase(updateMultipleMaintenanceTasks.fulfilled, (state, action) => {
        const updatedTasks = action.payload.data;
        updatedTasks.forEach(updatedTask => {
          state.tasks = state.tasks.map(task => 
            task.task_id === updatedTask.task_id ? updatedTask : task
          );
          state.history = state.history.map(task => 
            task.task_id === updatedTask.task_id ? updatedTask : task
          );
        });
      })
      
      // Fetch machine names
      .addCase(fetchUniqueMachineNames.fulfilled, (state, action) => {
        state.machineNames = action.payload.data;
      })
      
      // Fetch assigned personnel
      .addCase(fetchUniqueAssignedPersonnel.fulfilled, (state, action) => {
        state.assignedPersonnel = action.payload.data;
      })
      
      // Fetch statistics
      .addCase(fetchMaintenanceStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload.data;
      });
  }
});

export const {
  setCurrentPage,
  setCurrentPageHistory,
  clearError,
  clearTasks,
  clearHistory
} = maintenanceSlice.actions;

export default maintenanceSlice.reducer;