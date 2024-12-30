document.addEventListener('DOMContentLoaded', function () {

    const searchInput = document.getElementById('searchInput');
    let currentPlaylistId = null;
    let currentSongId = null;

    document.getElementById('createPlaylistForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const playlistData = {
            playlist_name: formData.get('playlistName'),
            playlist_type: formData.get('playlistType'),
            playlist_icon: formData.get('playlistIcon'),
            created_by: formData.get('createdBy'),
            official_playlist: formData.get('officialPlaylist')
        };

        try {
            const response = await fetch('/admin/playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(playlistData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Playlist created successfully!');
                window.location.reload(); 
            } else {
                console.error(result); // Log the response for debugging
                alert(result.error || 'Adding playlist failed');
            }
        } catch (error) {
            alert('An unexpected error occurred: ' + error.message);
            console.error('Error submitting form:', error);
        }
    });

     // Set current playlist ID
    window.setCurrentPlaylist = function(playlistId) {
        currentPlaylistId = playlistId; // Set the current playlist ID
    };

    window.setCurrentSongId = function(songId) {
        currentSongId = songId; // Set the current playlist ID
    };

    // Assign playlist to a song
    window.assignPlaylistToSong = async function(songId) {
        if (!currentPlaylistId) {
            alert('Please select a playlist first.');
            return;
        }

        try {
            const response = await fetch('/admin/assignSong', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ songId, playlistId: currentPlaylistId })
            });
    
            const result = await response.json();
    
            if (response.ok) {
                // alert(result.message || 'Song added to playlist successfully!');
                fetchSongsByPlaylist(currentPlaylistId);
            } else {
                alert(result.error || 'Adding song to playlist failed');
            }
        } catch (error) {
            alert('An unexpected error occurred: ' + error.message);
            console.error('Error adding song to playlist:', error);
        }
    };

    // Assign song to a playlist
    window.assignSongToPlaylist = async function(playlistId) {
        if (!currentSongId) {
            alert('Please select a playlist first.');
            return;
        }

        try {
            const response = await fetch('/assignSong', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ songId: currentSongId, playlistId })
            });
    
            const result = await response.json();
    
            if (response.ok) {
                alert(result.message);
            } else {
                alert(result.error || 'Adding song to playlist failed');
            }
        } catch (error) {
            alert('An unexpected error occurred: ' + error.message);
            console.error('Error adding song to playlist:', error);
        }
    };
    
    document.getElementById('searchIconBtn').addEventListener('click', async () => {
        const query = document.getElementById('iconSearch').value;
        const response = await fetch(`/icons?query=${encodeURIComponent(query)}`);
    
        if (!response.ok) {
            console.error('Failed to fetch icons');
            return;
        }
    
        const data = await response.json();
        const resultsDiv = document.getElementById('iconResults');
        resultsDiv.innerHTML = '';

        resultsDiv.style.height = '230px';
        resultsDiv.style.overflowY = 'auto';
    
        if (data && data.icons && data.icons.length) {
            data.icons.forEach(icon => {
                const iconElement = document.createElement('div');
                iconElement.className = 'icon-result';
                iconElement.innerHTML = `
                    <div class="col">
                        <div class="card h-100">
                            <img src="${icon.thumbnail_url}" class="card-img-top" alt="${icon.term}">
                            <div class="card-body">
                                <h5 class="card-title">${icon.term}</h5>
                            </div>
                        </div>
                    </div>
                `;
                iconElement.onclick = () => {
                    document.getElementById('playlistIcon').value = icon.thumbnail_url; // Set the selected icon URL
                    resultsDiv.innerHTML = ''; // Clear results
                    resultsDiv.style.height = '';
        resultsDiv.style.overflowY = '';
                };
                resultsDiv.appendChild(iconElement);
            });
        } else {
            resultsDiv.style.display = 'none'; 
            resultsDiv.innerHTML = 'No icons found.';
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchValue = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('#songsTable tbody tr');
    
            tableRows.forEach(row => {
                const title = row.cells[0].textContent.toLowerCase(); // Title cell
                const artist = row.cells[1].textContent.toLowerCase(); // Artist cell
    
                // Check if the title or artist includes the search value
                if (title.includes(searchValue) || artist.includes(searchValue)) {
                    row.style.display = ''; // Show row
                } else {
                    row.style.display = 'none'; // Hide row
                }
            });
        });
    }
});

async function fetchSongsByPlaylist(playlistId) {
    try {
        const response = await fetch(`/admin/playlist/${playlistId}/songs`); // Adjust the endpoint as needed
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const songs = await response.json();

        const tableBody = document.querySelector('#tbleSongs tbody');
        tableBody.innerHTML = '';

        if (songs.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="4" class="text-center">No songs found in this playlist.</td>
            `;
            tableBody.appendChild(emptyRow);
        } else {
            songs.forEach(song => {
                const row = document.createElement('tr');
                row.classList.add('align-middle');
                row.innerHTML = `
                    <td>${song.title}</td>
                    <td>${song.artist}</td>
                    <td>${song.album}</td>
                    <td class="text-end">
                        <form action="#" method="POST" style="display:inline;" onsubmit="return confirmDelete(event, ${playlistId}, ${song.song_id})">
                            <button type="submit" class="btn btn-danger btn-sm">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </form>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error fetching songs:', error);
    }
}

async function confirmDelete(event, playlistId, songId) {
    event.preventDefault(); // Prevent the default form submission

    const confirmed = confirm('Are you sure you want to delete this song?');
    if (!confirmed) return false; // Exit if not confirmed

    try {
        const response = await fetch(`/admin/playlist/${playlistId}/songs/${songId}?_method=DELETE`, {
            method: 'POST',
        });

        const result = await response.json();
        if (result.success) {
            // Refresh the songs list after deletion
            await fetchSongsByPlaylist(playlistId);
        } else {
            alert(result.message || 'Error deleting the song.');
        }
    } catch (error) {
        console.error('Error deleting song:', error);
    }
}

async function confirmDeletePlaylist(event, playlistId) {
    event.preventDefault();

    const confirmed = confirm('Are you sure you want to delete this playlist?');
    if (!confirmed) return false; 

    try {
        const response = await fetch(`/admin/playlist/${playlistId}?_method=DELETE`, {
            method: 'POST',
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            window.location.href = '/admin/playlist';
        } else {
            alert(result.message || 'Error deleting the song.');
        }
    } catch (error) {
        console.error('Error deleting song:', error);
    }
}

// Placeholder function for playing a song
function playSong(fileUrl) {
    console.log(`Playing song from URL: ${fileUrl}`);
}

// Placeholder function for deleting a song
function deleteSong(songId) {
    console.log(`Deleting song with ID: ${songId}`);
}