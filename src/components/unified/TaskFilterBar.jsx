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
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">

            {/* MAIN TOGGLE: All vs Pending vs History */}
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                <button
                    onClick={() => handleChange("status", "")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${!status
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <ListFilter className="h-4 w-4" />
                    <span>📊 All Tasks</span>
                </button>
                <button
                    onClick={() => handleChange("status", "Pending")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${status === "Pending"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <Clock className="h-4 w-4" />
                    <span>⏳ Pending Only</span>
                </button>
                <button
                    onClick={() => handleChange("status", "Completed")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${status === "Completed"
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <History className="h-4 w-4" />
                    <span>✅ Completed Only</span>
                </button>
            </div>

            {/* Rest of your component remains the same */}
            {/* Simple Search Box */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="🔍 Search by task name or ID..."
                    value={searchTerm}
                    onChange={(e) => handleChange("searchTerm", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-base"
                />
            </div>

            {/* Task Type Filter - Big colorful buttons */}
            <div>
                <p className="text-sm font-medium text-gray-700 mb-2">📋 Show Tasks From:</p>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleChange("sourceSystem", "")}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${sourceSystem === ""
                            ? "bg-blue-600 text-white ring-2 ring-blue-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        📊 All Tasks
                    </button>
                    <button
                        onClick={() => handleChange("sourceSystem", sourceSystem === "checklist" ? "" : "checklist")}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${sourceSystem === "checklist"
                            ? "bg-purple-600 text-white ring-2 ring-purple-300"
                            : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            }`}
                    >
                        ✅ Checklist
                    </button>
                    <button
                        onClick={() => handleChange("sourceSystem", sourceSystem === "maintenance" ? "" : "maintenance")}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${sourceSystem === "maintenance"
                            ? "bg-blue-600 text-white ring-2 ring-blue-300"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                    >
                        🔧 Maintenance
                    </button>
                    <button
                        onClick={() => handleChange("sourceSystem", sourceSystem === "housekeeping" ? "" : "housekeeping")}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${sourceSystem === "housekeeping"
                            ? "bg-green-600 text-white ring-2 ring-green-300"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                    >
                        🏠 Housekeeping
                    </button>
                </div>
            </div>

            {/* Clear Button - Only show when filters are active */}
            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                >
                    <X className="h-4 w-4" />
                    Clear All Filters
                </button>
            )}
        </div>
    );
}