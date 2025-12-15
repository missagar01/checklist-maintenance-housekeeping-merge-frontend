import axios from "./axios";

// ================= CONFIG =================
const ENABLE_LOGS = true;

/**
 * BACKEND ROUTE STRUCTURE
 * app.use("/api/housekeeping-dashboard", routes)
 * routes.use("/assigntask", assignTaskRoutes)
 *
 * FINAL BASE:
 * /api/housekeeping-dashboard/assigntask/generate
 */
const API_BASE = "/housekeeping-dashboard/assigntask/generate";

const API_PENDING_URL = `${API_BASE}/pending`;
const API_HISTORY_URL = `${API_BASE}/history`;
const API_CONFIRM_URL = (id) => `${API_BASE}/${id}/confirm`;
const API_UPDATE_URL = (id) => `${API_BASE}/${id}`;

const DATE_FORMAT_OPTIONS = { year: "numeric", month: "2-digit", day: "2-digit" };

// ================= UTILITIES =================
const log = (...args) => ENABLE_LOGS && console.log(...args);
const logError = (context, error) =>
  console.error(`❌ ${context}:`, error?.response?.data || error.message);

const appendIfValid = (formData, key, value) => {
  if (value !== null && value !== undefined && value !== "") {
    formData.append(key, value);
  }
};

// ================= CORE REQUEST =================
const apiRequest = async (method, url, data = null, config = {}) => {
  try {
    const response = await axios({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const handleApiError = (operation, error) => {
  logError(operation, error);
  throw new Error(
    error?.response?.data?.message ||
    error?.message ||
    "Request failed"
  );
};

// ================= API FUNCTIONS =================

/**
 * GET PENDING TASKS
 */
export const getPendingTasks = async (filters = {}) => {
  try {
    return await apiRequest("get", API_PENDING_URL, null, {
      params: filters,
    });
  } catch (error) {
    handleApiError("Fetching pending tasks", error);
  }
};

/**
 * GET HISTORY TASKS
 */
export const getHistoryTasks = async (filters = {}) => {
  try {
    return await apiRequest("get", API_HISTORY_URL, null, {
      params: filters,
    });
  } catch (error) {
    handleApiError("Fetching history tasks", error);
  }
};

/**
 * CONFIRM TASK (USER)
 */
export const confirmTask = async (
  taskId,
  remark = "",
  imageFile = null,
  doerName2 = ""
) => {
  try {
    const formData = new FormData();

    appendIfValid(formData, "attachment", "confirmed");
    appendIfValid(formData, "remark", remark);
    appendIfValid(formData, "doer_name2", doerName2);

    if (imageFile instanceof File) {
      formData.append("image", imageFile);
    }

    return await apiRequest(
      "post",
      API_CONFIRM_URL(taskId),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  } catch (error) {
    handleApiError(`Confirming task ${taskId}`, error);
  }
};

/**
 * UPDATE TASK (ADMIN)
 */
export const updateTask = async (taskId, updateData = {}) => {
  try {
    const formData = new FormData();

    appendIfValid(formData, "status", updateData.status);
    appendIfValid(formData, "remark", updateData.remark);
    appendIfValid(formData, "attachment", updateData.attachment);
    appendIfValid(formData, "doer_name2", updateData.doer_name2);

    if (updateData.status === "Yes") {
      formData.append("submission_date", new Date().toISOString());
    }

    if (updateData.image_file instanceof File) {
      formData.append("image", updateData.image_file);
    } else if (updateData.image_url) {
      formData.append("image", updateData.image_url);
    }

    return await apiRequest(
      "patch",
      API_UPDATE_URL(taskId),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  } catch (error) {
    handleApiError(`Updating task ${taskId}`, error);
  }
};

/**
 * BULK SUBMIT (ADMIN)
 */
export const submitTasks = async (tasks = []) => {
  const promises = tasks.map((task) =>
    updateTask(task.task_id, {
      status: task.status || "Yes",
      remark: task.remark || "",
      attachment: task.attachment || "No",
      image_file: task.image_file,
      image_url: task.image_url,
    })
  );

  const results = await Promise.allSettled(promises);

  return {
    successful: results.filter(r => r.status === "fulfilled").map(r => r.value),
    failed: results.filter(r => r.status === "rejected").map(r => r.reason),
  };
};
