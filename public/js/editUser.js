document.addEventListener('DOMContentLoaded', function () {
    const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));

    // Handle Edit button clicks in admin side
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', async (event) => {
            const username = event.target.dataset.username;

            try {
                const response = await fetch(`/admin/users/${username}`);
                const user = await response.json();

                document.getElementById('editUsername').value = user.username;
                document.getElementById('editEmail').value = user.email;
                document.getElementById('age').value = user.age;
                document.getElementById('role').value = user.role;
                document.getElementById('editUserUrl').value = `/admin/users/${user.username}`;

                editUserModal.show();
            } catch (error) {
                alert('Error fetching user data.');
            }
        });
    });

    // Handle Edit button clicks in user side
    document.querySelectorAll('.btn-edit-user').forEach(button => {
        button.addEventListener('click', async (event) => {
            const username = event.target.dataset.username;

            try {
                const response = await fetch(`/users/${username}`);
                const user = await response.json();

                document.getElementById('editUsername').value = user.username;
                document.getElementById('editEmail').value = user.email;
                document.getElementById('age').value = user.age;
                document.getElementById('role').value = user.role;
                document.getElementById('editUserUrl').value = `/users/${user.username}`;

                editUserModal.show();
            } catch (error) {
                alert('Error fetching user data.');
            }
        });
    });

    // Handle form submission
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = {
                email: document.getElementById('editEmail').value,
                age: document.getElementById('age').value,
                role: document.getElementById('role').value
            };

            const url = document.getElementById('editUserUrl').value;

            console.log(url);
            try {
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const message = await response.text();  

                if (response.ok) {
                    alert(message); 
                    location.reload();  
                } else {
                    alert(`Error: ${message}`); 
                }
            } catch (error) {
                alert('Error updating user: ' + error.message);  
            }
        });
    }
    
    // Confirm delete function
    window.confirmDelete = function() {
        return confirm('Are you sure you want to delete this user? This action cannot be undone.');
    };
});

function filterUser() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const table = document.querySelector('table tbody');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let showRow = false;

        for (let j = 0; j < cells.length - 1; j++) { // -1 to skip the Action column
            if (cells[j]) {
                const txtValue = cells[j].textContent || cells[j].innerText;
                if (txtValue.toLowerCase().indexOf(filter) > -1) {
                    showRow = true;
                    break;
                }
            }
        }

        rows[i].style.display = showRow ? '' : 'none';
    }
}

function confirmDeactivate() {
    return window.confirm("Are you sure you want to deactivate this user?");
}

function confirmActivate() {
    return window.confirm("Are you sure you want to activate this user?");
}