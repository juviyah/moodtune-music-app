document.addEventListener("DOMContentLoaded", () => {  
    const audioElement = document.getElementById('audio-element');
    const playPauseButton = document.getElementById('play-pause-button');
    const playerIcon = document.getElementById('player-icon');
    const currentSongTitle = document.getElementById('song-title');
    const currentSongArtist = document.getElementById('song-artist');
    const progressBar = document.getElementById('progress-bar');
    const volumeSlider = document.getElementById('volume-slider');
    const downloadButton = document.getElementById('download-button');
    const userId = document.getElementById('user-id').getAttribute('data-user-id');
    const repeatButton = document.getElementById('repeat-button');
    const shuffleButton = document.getElementById('shuffle-button');
    const buttons = document.querySelectorAll('.play-button');
    const audio = document.getElementById('.play-button');
    let shuffledIndexes = [];
    let shuffleIndex = 0;
    let isPlaying = false;
    let isShuffle = false;  // Track shuffle state
    let repeatMode = 0;     // Track repeat mode (0: no repeat, 1: repeat one, 2: repeat all)
    let currentIndex = -1; // Track current song index
    const songs = []; // Array to hold songs information

    const dbName = 'music_app';
    const storeName = 'audioFiles';

    // Open IndexedDB
    let dbPromise;

    function openDatabase() {
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                // Increment the version number to trigger the onupgradeneeded event
                const request = indexedDB.open(dbName, 2);  // Incremented to version 2 (or higher if needed)
    
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    // Check if the object store exists, if not, create it
                    if (!db.objectStoreNames.contains(storeName)) {
                        const objectStore = db.createObjectStore(storeName, { keyPath: 'id' });
                        // Create an index on userId to allow filtering by user
                        objectStore.createIndex('userId', 'userId', { unique: false });
                    }
                };
    
                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };
    
                request.onerror = (event) => {
                    reject(event.target.error);
                };
            });
        }
        return dbPromise;
    }
    
    // Save audio file to IndexedDB with userId
    async function saveToIndexedDB(song) {
        try {
            const response = await fetch(song.url);
            if (!response.ok) throw new Error('Network response was not ok');
    
            const audioBlob = await response.blob(); // Get the audio file as a Blob
    
            const db = await openDatabase();
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
    
            // Now, use the userId index to check if the song already exists for this user
            const getRequest = objectStore.index('userId').get([userId, song.sngId]);
            getRequest.onsuccess = async (event) => {
                if (event.target.result) {
                    alert(`${song.title} already exists in downloads for this user.`);
                    return; // Song already exists for the user, skip saving
                }
    
                // Create the audio file data with userId
                const audioFileData = {
                    id: song.sngId,
                    blob: audioBlob,
                    title: song.title,
                    artist: song.artist,
                    userId: userId, // Include userId for filtering
                };
    
                // Store the data
                const request = objectStore.put(audioFileData); // Use put() to update or add
    
                request.onsuccess = () => {
                    alert(`Saved ${song.title} to Downloads for user ${userId}.`);
                };
    
                request.onerror = (event) => {
                    console.error('Error saving to IndexedDB:', event.target.error);
                };
    
                // Wait for the transaction to complete
                transaction.oncomplete = () => {
                    console.log('Transaction completed successfully.');
                };
    
                transaction.onerror = (event) => {
                    console.error('Transaction error:', event.target.error);
                };
            };
        } catch (error) {
            console.error('Error fetching audio file:', error);
        }
    }

    // Download button functionality
    downloadButton.addEventListener('click', (event) => {
        event.preventDefault();
        const song = songs[currentIndex]; // Get the current song
        
        if (song) {
            saveToIndexedDB(song); // Save the current song to IndexedDB
        }
    });

    // Update progress bar and time display as audio plays
    audioElement.addEventListener('timeupdate', () => {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressBar.value = progress;

        // Update current time display
        const currentTimeDisplay = document.getElementById('current-time');
        currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
    });

    // Function to format time from seconds to MM:SS
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
    }

    // Update total duration when song loads
    audioElement.addEventListener('loadedmetadata', () => {
        const totalDurationDisplay = document.getElementById('total-duration');
        totalDurationDisplay.textContent = formatTime(audioElement.duration);
    });

    // Seek functionality
    progressBar.addEventListener('input', () => {
        const seekTime = (progressBar.value / 100) * audioElement.duration;
        audioElement.currentTime = seekTime;
    });

    // Volume control
    volumeSlider.addEventListener('input', () => {
        audioElement.volume = volumeSlider.value;
    });

    // Play a song when a play button is clicked
    document.querySelectorAll('.play-button').forEach((button, index) => {
        songs.push({
            sngId: button.getAttribute('data-song-id'),
            url: button.getAttribute('data-file-url'),
            title: button.getAttribute('data-title'),
            artist: button.getAttribute('data-artist'),
            playlistId: button.getAttribute('data-playlistId') || 0
        });

        buttons.forEach((button, index) => {
            button.addEventListener('click', () => {
              currentIndex = index; // Set currentIndex to the clicked song index
              playSong(currentIndex);
          
              // Remove 'active' class from all buttons
              buttons.forEach(btn => btn.classList.remove('active'));
        

              button.classList.toggle('active');
            });
          });
          });



    // Play/Pause functionality
    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            audioElement.pause();
            isPlaying = false;
        } else {
            audioElement.play();
            isPlaying = true;
        }
        updatePlayerIcon();
    });


    // Update play and next/previous logic to account for shuffle
    document.getElementById('next-button').addEventListener('click', () => {
        nextSong();
    });

    document.getElementById('previous-button').addEventListener('click', () => {
        prevSong();
    });

    function nextSong() {
        if (isShuffle) {
            // If shuffle is on, move to the next song in the shuffled list
            shuffleIndex++;
            
            // If we are at the end of the shuffled list, restart from the first song
            if (shuffleIndex >= shuffledIndexes.length) {
                shuffleIndex = 0;
            }
            
            currentIndex = shuffledIndexes[shuffleIndex]; // Get the next shuffled song index
        } else {
            // In non-shuffle mode, move to the next song in the list
            currentIndex++;
        
            // If we are at the end of the list, go back to the first song
            if (currentIndex >= songs.length) {
                currentIndex = 0;
            }
        }
        
        // Play the next song
        playSong(currentIndex);
    }
    
    function prevSong() {
        if (isShuffle) {
            // If shuffle is on, move to the previous song in the shuffled list
            shuffleIndex--;
            
            // If we are at the beginning of the shuffled list, loop to the last song
            if (shuffleIndex < 0) {
                shuffleIndex = shuffledIndexes.length - 1;
            }
            
            currentIndex = shuffledIndexes[shuffleIndex]; // Get the previous shuffled song index
        } else {
            // In non-shuffle mode, move to the previous song in the list
            currentIndex--;
        
            // If we are at the beginning of the list, go to the last song
            if (currentIndex < 0) {
                currentIndex = songs.length - 1;
            }
        }
        
        // Play the previous song
        playSong(currentIndex);
    }

    // Function to play a song based on its index
    function playSong(index) {
        // Remove table-active class from all rows
        document.querySelectorAll('tbody tr').forEach(row => {
            row.classList.remove('table-active');
        });
    
        // Reset all play buttons to play icon
        document.querySelectorAll('.play-button').forEach(button => {
            button.innerHTML = '<i class="fas fa-play"></i>'; // Change to play icon
        });
    
        const song = songs[index];
        audioElement.src = song.url;
        currentSongTitle.textContent = song.title;
        currentSongArtist.textContent = song.artist;
        downloadButton.href = song.url; // Set download link
    
        // Send a POST request to increment the play count
        fetch(`/playlist/${song.playlistId}/songs/${song.sngId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error incrementing play count:', error); // Log any errors
        });
    
        audioElement.play();
        isPlaying = true;
        updatePlayerIcon();
    
        // Add table-active class to the current song's row
        const playlistTable = document.getElementById('songsTable');
        const currentRow = playlistTable.querySelector(`tbody tr:nth-child(${index + 1})`); // Ensure index is correct (1-based)
        if (currentRow) {
            currentRow.classList.add('table-active');
        }
    
        // Update the play button icon for the active row
        const currentPlayButton = currentRow ? currentRow.querySelector('.play-button') : null;
        if (currentPlayButton) {
            currentPlayButton.innerHTML = '<i class="fa-solid fa-pause fa-lg"></i>'; // Change to pause icon
        }
    }

    // Update the play/pause icon
    function updatePlayerIcon() {
        if (isPlaying) {
            playerIcon.classList.remove('fa-play');
            playerIcon.classList.add('fa-pause');
        } else {
            playerIcon.classList.remove('fa-pause');
            playerIcon.classList.add('fa-play');
        }
    }

    // Handle the next song logic
    audioElement.addEventListener('ended', () => {
        if (repeatMode === 1) {
            // Repeat current song if repeat one is enabled
            playSong(currentIndex);
        } else if (repeatMode === 2) {
            // Repeat the entire playlist
            currentIndex = (currentIndex + 1) % songs.length;
            playSong(currentIndex);
        } else if (isShuffle) {
            // Shuffle and play next random song
            currentIndex = Math.floor(Math.random() * songs.length);
            playSong(currentIndex);
        } else {
            // Default behavior (no repeat): Go to the next song
            currentIndex = (currentIndex + 1) % songs.length;
            playSong(currentIndex);
        }
    });

    const lyricsButton = document.querySelector('.lyrics-button');
    if (lyricsButton) {
        lyricsButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const title = lyricsButton.getAttribute('data-title');
            const artist = lyricsButton.getAttribute('data-artist');
            const lyricsContainer = document.getElementById('lyrics-container');
            lyricsContainer.innerHTML = 'Loading lyrics...';

            try {
                // Fetch lyrics from the server
                const response = await fetch(`/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
                const data = await response.json();
    
                if (data.lyrics) {
                    lyricsContainer.innerHTML = ''; // Clear the previous lyrics
                    data.lyrics.forEach(item => {
                        const span = document.createElement('span');
                        span.setAttribute('data-time', item.seconds); // Store the timestamp
                        span.textContent = item.lyrics;
                        lyricsContainer.appendChild(span);
                        lyricsContainer.appendChild(document.createElement('br')); // Add line break for readability
                    });
    
                    syncLyricsScroll(); // Call the sync function to handle scrolling with the song
                } else {
                    lyricsContainer.innerHTML = 'Lyrics not found.';
                }
            } catch (error) {
                console.error('Error fetching lyrics:', error);
                lyricsContainer.innerHTML = 'Error loading lyrics.';
            }
        });
    }

    function syncLyricsScroll() {
        const lyricsContainer = document.getElementById('lyrics-container');
        const lyricsSpans = lyricsContainer.querySelectorAll('span[data-time]');
    
        audioElement.addEventListener('timeupdate', () => {
            const currentTime = audioElement.currentTime;
    
            lyricsSpans.forEach(span => {
                const spanTime = parseFloat(span.getAttribute('data-time'));
    
                // Check if the current time matches the span's data-time
                if (currentTime >= spanTime) {
                    // Highlight the current lyric and scroll to it
                    span.classList.add('highlight'); // Add a highlight class
                    span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    span.classList.remove('highlight');
                }
            });
        });
    }
    
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchValue = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('#songsTable tbody tr');
        
            tableRows.forEach(row => {
                const title = row.cells[2].textContent.toLowerCase(); // Adjust this index as needed
                const artist = row.cells[1].textContent.toLowerCase(); // Adjust this index as needed
                if (title.includes(searchValue) || artist.includes(searchValue)) {
                    row.style.display = ''; // Show row
                } else {
                    row.style.display = 'none'; // Hide row
                }
            });
        });
    } 

    function shuffleSongs() {
        shuffledIndexes = [];
        while (shuffledIndexes.length < songs.length) {
            const randomIndex = Math.floor(Math.random() * songs.length);
            if (!shuffledIndexes.includes(randomIndex)) {
                shuffledIndexes.push(randomIndex);
            }
        }
        shuffleIndex = 0;
        playSong(shuffledIndexes[shuffleIndex]); // Play the first song in shuffled list
    }

    // Handle repeat button click
    repeatButton.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;  // Cycle through 0, 1, 2
        updateRepeatIcon();
    });

    shuffleButton.addEventListener('click', () => {
        isShuffle = !isShuffle; // Toggle shuffle state
        updateShuffleIcon();
    
        if (isShuffle) {
            shuffleSongs(); // Shuffle songs when shuffle is enabled
        } else {
            // If shuffle is disabled, reset to the original order and start from the first song
            currentIndex = 0;
            playSong(currentIndex);
        }
    });

     // Update the repeat icon based on repeatMode
    function updateRepeatIcon() {
        const repeatIcon = repeatButton.querySelector('i'); // Get the <i> element inside the repeat button

        // Remove the current repeat icon classes first to avoid conflicts
        repeatIcon.classList.remove('fa-repeat', 'repeat-one', 'repeat-all');

        // Apply the correct class based on repeatMode
        if (repeatMode === 0) {
            // No repeat: Just the default repeat icon
            repeatIcon.classList.add('fa-repeat');
        } else if (repeatMode === 1) {
            // Repeat current song: Add a specific class to visually indicate "repeat one"
            repeatIcon.classList.add('fa-repeat', 'repeat-one'); // Add a custom class like 'repeat-one' for styling
        } else if (repeatMode === 2) {
            // Repeat entire playlist: Add a specific class to visually indicate "repeat all"
            repeatIcon.classList.add('fa-repeat', 'repeat-all'); // Add a custom class like 'repeat-all' for styling
        }
    }

    // Update the shuffle icon based on isShuffle state
    function updateShuffleIcon() {
        const shuffleIcon = shuffleButton.querySelector('i');
        if (isShuffle) {
            shuffleIcon.classList.add('fa-shuffle-active');
        } else {
            shuffleIcon.classList.remove('fa-shuffle-active');
        }
    }
});
