"use client"

import { useEffect, useState } from "react"
import AdminLayout from "../../components/layout/AdminLayout.jsx"
import StatisticsCards from "./housekepping-dashboard-content/StaticsCard.jsx"
import TaskNavigationTabs from "./housekepping-dashboard-content/TaskNavigationTab.jsx"

export default function AdminDashboard() {
  const [dashboardType] = useState("checklist")
  const [taskView, setTaskView] = useState("recent")
  const [searchQuery] = useState("")
  const [dashboardStaffFilter, setDashboardStaffFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [userRole, setUserRole] = useState("")
  const [, setFilterStaff] = useState("all")

  // Load user info and auto-set department filter for user role
  useEffect(() => {
    const role = localStorage.getItem("role") || ""
    setUserRole(role)
    
    // For user role, automatically filter by user_access departments
    if (role.toLowerCase() === "user") {
      const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
      if (userAccess) {
        const departments = userAccess.split(',').map(d => d.trim()).filter(Boolean)
        // Set first department as default filter (or all if multiple)
        if (departments.length > 0) {
          // For housekeeping, we might want to show all user's departments
          // But for now, let's use the first one or "all" if multiple
          setDepartmentFilter(departments.length === 1 ? departments[0] : "all")
        }
      }
    }
  }, [])

  // Keep staff filter reset in sync with dashboard/department changes
  useEffect(() => {
    if (dashboardType === "checklist") {
      setDashboardStaffFilter("all")
    }
  }, [departmentFilter, dashboardType])

  // Reset filters when dashboard type changes (but preserve user_access filter for user role)
  useEffect(() => {
    setDashboardStaffFilter("all")
    // Don't reset departmentFilter if user role is "user" - keep their access filter
    if (userRole.toLowerCase() !== "user") {
      setDepartmentFilter("all")
    }
  }, [dashboardType, userRole])

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case "one-time":
        return "bg-gray-500 hover:bg-gray-600 text-white"
      case "daily":
        return "bg-blue-500 hover:bg-blue-600 text-white"
      case "weekly":
        return "bg-gray-500 hover:bg-gray-600 text-white"
      case "fortnightly":
        return "bg-indigo-500 hover:bg-indigo-600 text-white"
      case "monthly":
        return "bg-orange-500 hover:bg-orange-600 text-white"
      case "quarterly":
        return "bg-amber-500 hover:bg-amber-600 text-white"
      case "yearly":
        return "bg-emerald-500 hover:bg-emerald-600 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  return (
    // <AdminLayout>
      <div className="space-y-6">
        <StatisticsCards
          dashboardType={dashboardType}
          selectedDepartment={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
        />

        <TaskNavigationTabs
          taskView={taskView}
          setTaskView={setTaskView}
          dashboardType={dashboardType}
          dashboardStaffFilter={dashboardStaffFilter}
          departmentFilter={departmentFilter}
          searchQuery={searchQuery}
          setFilterStaff={setFilterStaff}
          getFrequencyColor={getFrequencyColor}
        />
      </div>
    // </AdminLayout>
  )
}
