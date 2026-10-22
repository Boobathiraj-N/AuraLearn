
import { useEffect, useMemo, useState } from "react";
import {
  getAllStaff,
  createStaff,
  updateStaff,
  updateStaffStatus,
} from "../../services/staffService";
import {
  Search,
  Plus,
  Users,
  Mail,
  Phone,
  Pencil,
  UserRound,
  X,
} from "lucide-react";

  function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [activationUrl, setActivationUrl] = useState("");
  const [activationMessage, setActivationMessage] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAllStaff();
        const staffList = Array.isArray(data)
          ? data
          : data.staff;

        if (!Array.isArray(staffList)) {
          throw new Error("Unexpected staff API response format");
        }

        setStaff(staffList);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load staff members."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    return staff.filter((person) => {
      const matchesSearch = `${person.name} ${person.email} ${person.mobile}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "all" || person.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staff, search, roleFilter]);

  const openCreateModal = () => {
    setEditingStaff(null);
    setShowModal(true);
  };

  const openEditModal = (person) => {
    setEditingStaff(person);
    setShowModal(true);
  };


    const handleSaveStaff = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const staffData = {
        name: formData.get("name").trim(),
        email: formData.get("email").trim().toLowerCase(),
        mobile: formData.get("mobile").trim(),
        role: formData.get("role"),
    };

    try {
        setError("");

        if (editingStaff) {
        const result = await updateStaff(editingStaff._id, staffData);

        const updatedStaff = result.staff || result.data || result;

        setStaff((previous) =>
            previous.map((person) =>
            person._id === editingStaff._id
                ? updatedStaff
                : person
            )
        );
        
      } else {
        const result = await createStaff(staffData);

        const newStaff =
          result.staff ||
          result.data?.staff ||
          result.data ||
          result;

        setStaff((previous) => [newStaff, ...previous]);

        setActivationUrl("");

        setActivationMessage(
          result.message || "Staff created successfully. Activation email sent."
        );
      }


        setShowModal(false);
        setEditingStaff(null);
    } catch (err) {
        setError(
        err.response?.data?.message ||
            "Unable to save staff member. Please try again."
        );
    }
    };


    
    const toggleStatus = async (person) => {
    try {
        setError("");

        const result = await updateStaffStatus(
        person._id,
        !person.isActive
        );

        const updatedStaff = result.staff || result.data || result;

        setStaff((previous) =>
        previous.map((item) =>
            item._id === person._id
            ? updatedStaff
            : item
        )
        );
    } catch (err) {
        setError(
        err.response?.data?.message ||
            "Unable to update staff status."
        );
    }
    };


  return (
    <div className="staff-page">
      
      {activationMessage && (
        <div className="staff-activation-notice">
          <strong>{activationMessage}</strong>

          {activationUrl && (
            <>
              <input
                type="text"
                readOnly
                value={activationUrl}
                aria-label="Staff activation link"
              />

              <button
                type="button"
                className="staff-primary-button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(activationUrl);
                    setActivationMessage("Activation link copied successfully!");
                  } catch {
                    setActivationMessage(
                      "Copy failed. Select the link and copy it manually."
                    );
                  }
                }}
              >
                Copy activation link
              </button>
            </>
          )}

          <button
            type="button"
            className="staff-icon-button"
            onClick={() => {
              setActivationUrl("");
              setActivationMessage("");
            }}
            aria-label="Dismiss activation notice"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">PEOPLE & ACCESS</p>
          <h1>Staff Management</h1>
          <p>Manage your Sales and Support team members.</p>
        </div>

        <button className="staff-primary-button" onClick={openCreateModal}>
          <Plus size={18} />
          Add staff
        </button>
      </div>

      <div className="staff-summary-grid">
        <article className="staff-summary-card">
          <div className="staff-summary-icon purple">
            <Users size={20} />
          </div>
          <div>
            <p>Total staff</p>
            <h2>{staff.length}</h2>
          </div>
        </article>

        <article className="staff-summary-card">
          <div className="staff-summary-icon green">
            <UserRound size={20} />
          </div>
          <div>
            <p>Active staff</p>
            <h2>{staff.filter((person) => person.isActive).length}</h2>
          </div>
        </article>

        <article className="staff-summary-card">
          <div className="staff-summary-icon orange">
            <Mail size={20} />
          </div>
          <div>
            <p>Pending activation</p>
            <h2>{staff.filter((person) => !person.isActive).length}</h2>
          </div>
        </article>
      </div>

      <section className="staff-table-panel">
        <div className="staff-toolbar">
          <div>
            <h2>All staff members</h2>
            <p>View and manage staff accounts.</p>
          </div>

          <div className="staff-filters">
            <label className="staff-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search staff..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">All roles</option>
              <option value="sales">Sales</option>
              <option value="support">Support</option>
            </select>
          </div>
        </div>

        
        {loading && (
        <p className="staff-feedback">
            Loading staff members...
        </p>
        )}

        {error && (
        <div className="staff-error" role="alert">
            <p>{error}</p>

            <button
            type="button"
            className="staff-secondary-button"
            onClick={() => window.location.reload()}
            >
            Retry
            </button>
        </div>
        )}


        {!loading && !error &&(
                    <div className="staff-table-wrapper">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStaff.map((person) => (
                <tr key={person._id}>
                  <td>
                    <div className="staff-person">
                      <div className="staff-person-avatar">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <strong>{person.name}</strong>
                    </div>
                  </td>

                  <td>
                    <div className="staff-contact">
                      <span><Mail size={14} /> {person.email}</span>
                      <span><Phone size={14} /> {person.mobile}</span>
                    </div>
                  </td>

                  <td>
                    <span className={`staff-role ${person.role}`}>
                      {person.role}
                    </span>
                  </td>

                  <td>
                    <span className={`staff-status ${person.isActive ? "active" : "pending"}`}>
                      <span />
                      {person.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    <div className="staff-row-actions">
                      <button
                        className="staff-icon-button"
                        title="Edit staff"
                        aria-label={`Edit ${person.name}`}
                        onClick={() => openEditModal(person)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="staff-status-button"
                        onClick={() => toggleStatus(person)}
                      >
                        {person.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="staff-empty-state">
                      <div><Users size={25} /></div>
                      <h3>No staff members found</h3>
                      <p>Add a staff member or change your search filters.</p>
                      <button
                        className="staff-primary-button"
                        onClick={openCreateModal}
                      >
                        <Plus size={17} /> Add staff
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </section>

      {showModal && (
        <div
          className="staff-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <section
            className="staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-modal-title"
          >
            <div className="staff-modal-heading">
              <div>
                <h2 id="staff-modal-title">
                  {editingStaff ? "Edit staff member" : "Add staff member"}
                </h2>
                <p>
                  {editingStaff
                    ? "Update this staff member's details."
                    : "Create a Sales or Support account."}
                </p>
              </div>

              <button
                className="staff-icon-button"
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>

            <form className="staff-form" onSubmit={handleSaveStaff}>
              <label>
                Full name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  defaultValue={editingStaff?.name ?? ""}
                  placeholder="Enter full name"
                />
              </label>

              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editingStaff?.email ?? ""}
                  placeholder="name@example.com"
                />
              </label>

              <label>
                Mobile number
                <input
                  name="mobile"
                  type="tel"
                  required
                  pattern="\+[1-9][0-9]{7,14}"
                  title="Enter a number in international format, for example +919876543210"
                  defaultValue={editingStaff?.mobile ?? ""}
                  placeholder="+919876543210"
                />
              </label>

              <label>
                Staff role
                <select
                  name="role"
                  required
                  defaultValue={editingStaff?.role ?? "support"}
                >
                  <option value="support">Support</option>
                  <option value="sales">Sales</option>
                </select>
              </label>

              <div className="staff-form-actions">
                <button
                  type="button"
                  className="staff-secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="staff-primary-button">
                  {editingStaff ? "Save changes" : "Create staff"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default StaffManagement;
