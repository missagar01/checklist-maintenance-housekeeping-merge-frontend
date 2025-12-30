import { configureStore } from "@reduxjs/toolkit";
import loginSliceReducer from "./slice/loginSlice";
import assignTaskReducer from './slice/assignTaskSlice';
import quickTaskReducer from './slice/quickTaskSlice';
import delegationReducer  from "./slice/delegationSlice";
import checkListReducer  from "./slice/checklistSlice";
import dashboardReducer from "./slice/dashboardSlice";
import settingReducer from './slice/settingSlice';
import maintenanceReducer from './slice/maintenanceSlice';
import housekeepingReducer from './slice/housekeepingSlice';

const store = configureStore({
    reducer: {
        login: loginSliceReducer,
        assignTask: assignTaskReducer,
        quickTask: quickTaskReducer,
        delegation: delegationReducer,
        checkList: checkListReducer,
        dashBoard: dashboardReducer,
        setting: settingReducer,
        maintenance: maintenanceReducer,
        housekeeping: housekeepingReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'maintenance/updateTask/fulfilled',
                    'maintenance/updateMultipleTasks/fulfilled',
                    'housekeeping/confirmTask/fulfilled',
                    'housekeeping/updateTask/fulfilled'
                ],
                ignoredPaths: [
                    'maintenance.tasks',
                    'maintenance.history',
                    'housekeeping.pendingTasks',
                    'housekeeping.historyTasks'
                ],
            },
        }),
});

export default store;