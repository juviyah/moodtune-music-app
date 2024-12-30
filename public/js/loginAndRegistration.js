document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent default form submission

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData);

            if (data.password !== data.confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            delete data.confirmPassword;

            try {
                const response = await fetch('/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const responseData = await response.json();

                if (response.ok) {
                    alert(responseData.message);
                    window.location.reload(); 
                } else {
                    alert(responseData.message);
                }
            } catch (error) {
                alert('Error:', error);
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    window.location.href = data.redirectUrl;
                } else {
                    alert(data.message); 
                }
            } catch (error) {
                alert('Error:', error);
            }
        });
    }

    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(resetPasswordForm);
            const token = formData.get('token');
            const newPassword = formData.get('newPassword');

            try {
                const response = await fetch('/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token, newPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    window.location.href = '/login';
                } else {
                    alert(data.message);
                }
            } catch (error) {
                alert('Error:', error);
            }
        });
    }

    const reqResetPassword = document.getElementById('reqResetPassword');
    if (reqResetPassword) {
        reqResetPassword.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = event.target.email.value;

            try {
                const response = await fetch('/request-password-reset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    window.location.href = '/login';
                } else {
                    alert(data.message);
                }
            } catch (error) {
                alert('Error:', error);
            }
        });
    }

    const searchForm = document.getElementById('search-form');
    const resultTableBody = document.getElementById('result-table-body');

    if (searchForm) {
        searchForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const searchInput = document.getElementById('search-input').value.trim();

            if (searchInput === '') {
                resultTableBody.innerHTML = '';  
                return; 
            }

            resultTableBody.innerHTML = '';

            try {
                const response = await fetch('/suggest-song', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ search: searchInput }), 
                });

                const data = await response.json();

                if (data.message) {
                    resultTableBody.innerHTML = `<h2 class="text-center mb-4">${data.message}</h2>`;
                } else {
                    let tableHTML = `
                        <thead>
                            <tr>
                                <th></th>
                                <th>Title</th>
                                <th>Album</th>
                                <th class="text-end">Duration</th>
                            </tr>
                        </thead>
                        <tbody class="table-group-divider">
                    `;

                    data.songs.forEach((song, index) => {
                        tableHTML += `
                            <tr class="align-middle">
                                <td>${index + 1}</td>
                                <td>
                                    <a href="/songs/${searchInput}/${song.song_id}" class="text-decoration-none">
                                        <strong>${song.title}</strong><br>
                                        <small>${song.artist}</small>
                                    </a>
                                </td>
                                <td>${song.album || 'N/A'}</td>
                                <td class="text-end">${song.duration || 'N/A'}</td>
                            </tr>
                        `;
                    });

                    tableHTML += '</tbody>';
                    resultTableBody.innerHTML = tableHTML;
                }
            } catch (error) {
                resultTableBody.innerHTML = `<tr class="align-middle"><td colspan="5" class="text-center">Something went wrong. Please try again later.</td></tr>`;
                console.error(error);
            }
        });

        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', () => {
            const searchValue = searchInput.value.trim();

            if (searchValue === '') {
                resultTableBody.innerHTML = ''; 
            }
        });
    }
});
