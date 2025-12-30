import { useState, useMemo } from "react";
import { Search, X, History, Clock, ListFilter } from "lucide-react";

export default function TaskFilterBar({
    filters = {},
    onFiltersChange,
}) {
    const {
        searchTerm = "",
        sourceSystem = "",
        status = "",  // Default to empty to show all
    } = filters;

    const handleChange = (key, value) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFiltersChange({
            searchTerm: "",
            sourceSystem: "",
            status: "",  // Reset to empty (show all)
            priority: "",
            assignedTo: "",
            department: "",
            startDate: "",
            endDate: "",
        });
    };

    const hasActiveFilters = useMemo(() => {
        return searchTerm || sourceSystem || status;
    }, [searchTerm, sourceSystem, status]);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 md:p-4 shadow-sm space-y-3 sm:space-y-4">

            {/* MAIN TOGGLE: All vs Pending vs History */}
            <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                <button
                    onClick={() => handleChange("status", "")}
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg font-medium transition-all text-xs sm:text-sm ${!status
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <ListFilter className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">📊 All Tasks</span>
                    <span className="xs:hidden">All</span>
                </button>
                <button
                    onClick={() => handleChange("status", "Pending")}
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg font-medium transition-all text-xs sm:text-sm ${status === "Pending"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">⏳ Pending</span>
                    <span className="xs:hidden">Pending</span>
                </button>
                <button
                    onClick={() => handleChange("status", "Completed")}
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg font-medium transition-all text-xs sm:text-sm ${status === "Completed"
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <History className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">✅ Completed</span>
                    <span className="xs:hidden">Done</span>
                </button>
            </div>

            {/* Simple Search Box */}
            <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                <input
                    type="text"
                    placeholder="🔍 Search by task name or ID..."
                    value={searchTerm}
                    onChange={(e) => handleChange("searchTerm", e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                />
            </div>

            {/* Task Type Filter - Big colorful buttons */}
            <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">📋 Show Tasks From:</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <button
                        onClick={() => handleChange("sourceSystem", "")}
                        className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${sourceSystem === ""
                            ? "bg-blue-600 text-white ring-2 ring-blue-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        <span className="hidden sm:inline">📊 All Tasks</span>
                        <span className="sm:hidden">All</span>
                    </button>
                    <button
                        onClick={() => handleChange("sourceSystem", sourceSystem === "checklist" ? "" : "checklist")}
                        className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${sourceSystem === "checklist"
                            ? "bg-purple-600 text-white ring-2 ring-purple-300"
                            : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            }`}
                    >
                        <span className="hidden sm:inline">✅ Checklist</span>
                        <span className="sm:hidden">CL</span>
                    </button>
                    <button
                        onClick={() => handleChange("sourceSystem", sourceSystem === "maintenance" ? "" : "maintenance")}
                        className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${sourceSystem === "maintenance"
                            ? "bg-blue-600 text-white ring-2 ring-blue-300"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                    >
                        <span className="hidden sm:inline">🔧 Maintenance</span>
                        <span className="sm:hidden">Maint</span>
                    </button>
                    <button
                        onClick={() => handleChange("sourceSystem", sourceSystem === "housekeeping" ? "" : "housekeeping")}
                        className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${sourceSystem === "housekeeping"
                            ? "bg-green-600 text-white ring-2 ring-green-300"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                    >
                        <span className="hidden sm:inline">🏠 Housekeeping</span>
                        <span className="sm:hidden">HK</span>
                    </button>
                </div>
            </div>

            {/* Clear Button - Only show when filters are active */}
            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs sm:text-sm"
                >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Clear All Filters</span>
                    <span className="sm:hidden">Clear Filters</span>
                </button>
            )}
        </div>
    );
}