import { configureStore } from "@reduxjs/toolkit";
import loginSliceReducer from "./slice/loginSlice";
import assignTaskReducer from './slice/assignTaskSlice';
import quickTaskReducer from './slice/quickTaskSlice';
import delegationReducer  from "./slice/delegationSlice";
import checkListReducer  from "./slice/checklistSlice";
import dashboardReducer from "./slice/dashboardSlice";
import settingReducer from './slice/settingSlice';
import maintenanceReducer from './slice/maintenanceSlice'; // Add this line

const store = configureStore({
    reducer: {
        login: loginSliceReducer,
        assignTask: assignTaskReducer,
        quickTask: quickTaskReducer,
        delegation: delegationReducer,
        checkList: checkListReducer,
        dashBoard: dashboardReducer,
        setting: settingReducer,
        maintenance: maintenanceReducer, // Add this line
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    // Add maintenance actions if needed
                    'maintenance/updateTask/fulfilled',
                    'maintenance/updateMultipleTasks/fulfilled'
                ],
                ignoredPaths: [
                    // Add maintenance paths if needed
                    'maintenance.tasks',
                    'maintenance.history'
                ],
            },
        }),
});

export default store;