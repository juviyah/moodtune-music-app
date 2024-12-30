document.addEventListener("DOMContentLoaded", () => {
    const resetPlayCount =  document.getElementById('reset-play-count');

    if (resetPlayCount) {
        resetPlayCount.addEventListener('click', async () => {
            const isConfirmed = confirm('Are you sure you want to reset the play count for all songs?');

            if (!isConfirmed) {
                return; 
            }

            try {
                const response = await fetch('/admin/dashboard/reset-play-count', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
        
                if (!response.ok) {
                    throw new Error('Failed to reset play count');
                }
        
                const data = await response.json();
                alert(data.message); 
                window.location.reload()
            } catch (error) {
                console.error(error);
                alert('Error resetting play count'); 
            }
        });
    }
});

