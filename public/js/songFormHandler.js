document.addEventListener('DOMContentLoaded', function () { 
    document.getElementById('createSongForm').addEventListener('submit', async (event) => {
        event.preventDefault();
    
        const formData = new FormData(event.target);

        try {
            const response = await fetch('/admin/songs', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert('Song saved successfully!'); 
                window.location.reload()
            } else {
                alert(result.error || 'Adding song failed');
            }
        } catch (error) {
            alert('An unexpected error occurred: ' + error.message);
            console.error('Error submitting form:', error);
        }
    });

    // Handle Edit button clicks
    const updateSongModal = new bootstrap.Modal(document.getElementById('updateSongModal'));

    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', async (event) => {
            const songID = event.target.dataset.song_id;

            try {
                const response = await fetch(`/admin/songs/${songID}`);
                const song =  await response.json();

                document.getElementById('updateSongID').value = song.song_id; 
                document.getElementById('updateTitle').value = song.title; 
                document.getElementById('updateArtist').value = song.artist; 
                document.getElementById('updateAlbum').value = song.album || ''; 
                document.getElementById('updateTag').value = song.tags || '';
                document.getElementById('updateDuration').value = song.duration || ''; 
                
                document.getElementById('existingFileUrl').innerText = song.file_url || 'No file uploaded';
                document.getElementById('existingCoverImageUrl').innerText = song.cover_image_url || 'No cover image uploaded';

                document.getElementById('updateSongUrl').value = `/admin/songs/${song.song_id}`;

                updateSongModal.show();
            } catch (error) {
                alert('Error fetching song data.');
            }
        });
    });

    // Handle form submission
    document.getElementById('updateSongForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);

        const url = document.getElementById('updateSongUrl').value;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                const updatedSong = await response.json();
                // Optionally update the table or refresh the page
                alert('Data saved successfully!');
                location.reload();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            alert('Error updating song.');
        }
    });

    // Confirm delete function
    window.confirmDelete = function() {
        return confirm('Are you sure you want to delete this song? This action cannot be undone.');
    };
});

function filterSongs() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const table = document.querySelector('table tbody');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let showRow = false;

        // Check each cell in the row for a match
        for (let j = 0; j < cells.length - 1; j++) { // -1 to skip the Action column
            if (cells[j]) {
                const txtValue = cells[j].textContent || cells[j].innerText;
                if (txtValue.toLowerCase().indexOf(filter) > -1) {
                    showRow = true;
                    break;
                }
            }
        }

        rows[i].style.display = showRow ? '' : 'none'; // Show or hide the row
    }
}

function validateMusicFile(inputId) {
    const input = document.getElementById(inputId);
    const filePath = input.value;
    const allowedExtensions = /(\.mp3|\.wav|\.ogg)$/i;

    if (!allowedExtensions.exec(filePath)) {
        alert('Invalid file type for music. Please upload an audio file (mp3, wav, or ogg).');
        input.value = '';
    } 
}

function validateCoverImage(inputId) {
    const input = document.getElementById(inputId);
    const filePath = input.value;
    const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;

    if (!allowedExtensions.exec(filePath)) {
        alert('Invalid file type for cover image. Please upload a JPG or PNG image.');
        input.value = ''; 
    }
}
