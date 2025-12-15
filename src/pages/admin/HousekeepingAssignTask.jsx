import { useMemo, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { pushAssignTask } from "../../components/api/assignTaskApi";

const departmentHODs = {
  Mandir: "Komal Sahu and Rinku Gautam",
  "Main Gate": "Komal Sahu and Rinku Gautam",
  "Main Gate Front Area": "Komal Sahu and Rinku Gautam",
  "Admin Office - Ground Floor": "Moradhwaj Verma and Shivraj Sharma",
  "Admin Office - First Floor": "Moradhwaj Verma and Shivraj Sharma",
  "Cabins ग्राउंड फ्लोर: and first floor": "Moradhwaj Verma and Shivraj Sharma",
  "Weight Office & Kata In/Out": "Vipin Pandey & Rajendra Tiwari",
  "New Lab": "Mukesh Patle & Sushil",
  "Canteen Area 1 & 2": "Tuleshwar Verma",
  "Labour Colony & Bathroom": "Tuleshwar Verma",
  "Plant Area": "Tuleshwar Verma",
  "Pipe Mill": "Ravi Kumar Singh, G. Ram Mohan Rao, Hullash Paswan",
  "Patra Mill Foreman Office": "Sparsh Jha and Toman Sahu",
  "Patra Mill DC Panel Room": "Danveer Singh Chauhan",
  "Patra Mill AC Panel Room": "Danveer Singh Chauhan",
  "SMS Panel Room": "Deepak Bhalla",
  "SMS Office": "Baldev Singh",
  "CCM Office": "Rinku Singh",
  "CCM Panel Room": "Rinku Singh",
  "Store Office": "Pramod and Suraj",
  Workshop: "Dhanji Yadav",
  "Car Parking Area": "Department HOD",
  default: "Department HOD",
};

const allDepartments = [
  "Mandir",
  "Car Parking Area",
  "Main Gate",
  "Main Gate Front Area",
  "Admin Office - Ground Floor",
  "Cabins ग्राउंड फ्लोर: and first floor",
  "Admin Office - First Floor",
  "Weight Office & Kata In/Out",
  "New Lab",
  "Canteen Area 1 & 2",
  "Pipe Mill",
  "Patra Mill Foreman Office",
  "Patra Mill DC Panel Room",
  "Patra Mill AC Panel Room",
  "SMS Panel Room",
  "SMS Office",
  "CCM Office",
  "CCM Panel Room",
  "Store Office",
  "Workshop",
  "Labour Colony & Bathroom",
  "Plant Area",
];

const givenByOptions = [
  "AAKASH AGRAWAL",
  "SHEELESH MARELE",
  "AJIT KUMAR GUPTA",
];

const doerNames = ["Housekeeping Staff", "Company Reja"];
const frequencies = ["one-time", "daily", "weekly", "monthly"];

export default function AssignTask() {
  const [formData, setFormData] = useState({
    department: "",
    given_by: "",
    name: "",
    task_description: "",
    frequency: "",
    task_start_date: "",
    hod: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const departments = useMemo(() => allDepartments, []);

  const updateHod = (dept) =>
    departmentHODs[dept] || departmentHODs.default;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "department") {
        next.hod = updateHod(value);
      }
      return next;
    });
  };

  const validate = () => {
    if (!formData.department) return "Department is required";
    if (!formData.task_description.trim())
      return "Task description is required";
    if (!formData.frequency) return "Frequency is required";
    if (!formData.task_start_date)
      return "Start date is required";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await pushAssignTask({
        ...formData,
        task_description: formData.task_description.trim(),
      });

      setSuccess("Task submitted successfully.");

      setFormData({
        department: "",
        given_by: "",
        name: "",
        task_description: "",
        frequency: "",
        task_start_date: "",
        hod: "",
      });
    } catch (err) {
      setError(err?.message || "Failed to submit task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Housekeeping
            </p>
            <h1 className="text-xl font-semibold text-gray-800">
              Assign Task
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-6 py-5 space-y-4"
          >
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Department HOD
                </label>
                <input
                  name="hod"
                  value={formData.hod}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Given By
                </label>
                <select
                  name="given_by"
                  value={formData.given_by}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select</option>
                  {givenByOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Doer Name
                </label>
                <select
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select</option>
                  {doerNames.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Task Description
              </label>
              <textarea
                name="task_description"
                value={formData.task_description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Frequency
                </label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select</option>
                  {frequencies.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  name="task_start_date"
                  value={formData.task_start_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Task"}
            </button>
          </form>
        </div>
      </div>
    // </AdminLayout>
  );
}
