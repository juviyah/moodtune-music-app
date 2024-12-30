function refreshTopHits() {
    $.ajax({
        url: '/getTopSongs',  
        method: 'GET',        
        success: function(data) {
            $('#topHitsList').empty();
            
            if (data.length === 0) {
                $('#topHitsList').append('<strong>No Songs Found</strong>');
            } else {
                data.forEach((topSong, index) => {
                    $('#topHitsList').append(`
                        <a href="/songs/${topSong.song_id}" class="list-group-item list-group-item-action">
                            <strong>${index + 1}. ${topSong.title}</strong><br>
                            ${topSong.artist}
                        </a>
                    `);
                });
            }
        },
        error: function(err) {
            console.error('Error fetching data:', err);
        }
    });
}

function refreshMostPlayed() {
    $.ajax({
        url: '/getTopSongsUsers',  
        method: 'GET',            
        success: function(data) {
            $('#mostPlayedList').empty();
            
            if (data.length === 0) {
                $('#mostPlayedList').append('<strong>No Songs Found</strong>');
            } else {
                data.forEach((topSongUser, index) => {
                    $('#mostPlayedList').append(`
                        <a href="/songs/${topSongUser.song_id}" class="list-group-item list-group-item-action">
                            <strong>${index + 1}. ${topSongUser.title}</strong><br>
                            ${topSongUser.artist}
                        </a>
                    `);
                });
            }
        },
        error: function(err) {
            console.error('Error fetching data:', err);
        }
    });
}

setInterval(function() {
    refreshTopHits();   
    refreshMostPlayed();
}, 5000); 

$(document).ready(function() {
    refreshTopHits();   
    refreshMostPlayed(); 
});