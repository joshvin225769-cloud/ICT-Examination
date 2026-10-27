const API_URL = '/api/employeelist';

const employeeForm = document.getElementById('employeeForm');
const employeeIdInput = document.getElementById('employeeId');
const nameInput = document.getElementById('name');
const positionInput = document.getElementById('position');
const locationInput = document.getElementById('location');
const salaryInput = document.getElementById('salary');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const employeeTableBody = document.getElementById('employeeTableBody');
const employeeCount = document.getElementById('employeeCount');
const emptyState = document.getElementById('emptyState');
const toastEl = document.getElementById('notificationToast');
const toastMessage = document.getElementById('toastMessage');
const toast = new bootstrap.Toast(toastEl);

let employees = [];

function showToast(message) {
  toastMessage.textContent = message;
  toast.show();
}

async function fetchEmployees() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch employees');
    employees = await response.json();
    renderEmployees();
  } catch (error) {
    showToast('Error loading employees');
    console.error(error);
  }
}

function renderEmployees() {
  employeeTableBody.innerHTML = '';
  employeeCount.textContent = employees.length;

  if (employees.length === 0) {
    emptyState.classList.remove('d-none');
    return;
  }

  emptyState.classList.add('d-none');

  employees.forEach(employee => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(employee.name)}</td>
      <td>${escapeHtml(employee.position)}</td>
      <td>${escapeHtml(employee.location)}</td>
      <td>$${Number(employee.salary).toLocaleString()}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editEmployee('${employee._id}')">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${employee._id}')">Delete</button>
      </td>
    `;
    employeeTableBody.appendChild(row);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

employeeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const employeeData = {
    name: nameInput.value.trim(),
    position: positionInput.value.trim(),
    location: locationInput.value.trim(),
    salary: Number(salaryInput.value)
  };

  const employeeId = employeeIdInput.value;

  try {
    if (employeeId) {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...employeeData, _id: employeeId })
      });
      if (!response.ok) throw new Error('Failed to update employee');
      showToast('Employee updated successfully');
    } else {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      });
      if (!response.ok) throw new Error('Failed to add employee');
      showToast('Employee added successfully');
    }
    resetForm();
    fetchEmployees();
  } catch (error) {
    showToast('Error saving employee');
    console.error(error);
  }
});

window.editEmployee = async (id) => {
  const employee = employees.find(emp => emp._id === id);
  if (!employee) return;

  employeeIdInput.value = employee._id;
  nameInput.value = employee.name;
  positionInput.value = employee.position;
  locationInput.value = employee.location;
  salaryInput.value = employee.salary;

  formTitle.textContent = 'Edit Employee';
  submitBtn.textContent = 'Update Employee';
  cancelBtn.classList.remove('d-none');

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteEmployee = async (id) => {
  if (!confirm('Are you sure you want to delete this employee?')) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete employee');
    showToast('Employee deleted successfully');
    fetchEmployees();
  } catch (error) {
    showToast('Error deleting employee');
    console.error(error);
  }
};

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  employeeForm.reset();
  employeeIdInput.value = '';
  formTitle.textContent = 'Add New Employee';
  submitBtn.textContent = 'Add Employee';
  cancelBtn.classList.add('d-none');
}

fetchEmployees();
