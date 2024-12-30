document.addEventListener("DOMContentLoaded", () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', 
                                registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }

    const audioElement = document.getElementById('audio-element');
    const playPauseButton = document.getElementById('play-pause-button');
    const prevButton = document.getElementById('previous-button');  // New Previous button
    const nextButton = document.getElementById('next-button');  // New Next button
    const playerIcon = document.getElementById('player-icon');
    const currentSongTitle = document.getElementById('song-title');
    const currentSongArtist = document.getElementById('song-artist');
    const progressBar = document.getElementById('progress-bar');
    const volumeSlider = document.getElementById('volume-slider');
    const currentTimeElement = document.getElementById('current-time');
    const totalDurationElement = document.getElementById('total-duration');
    const downloadButton = document.getElementById('download-button');
    const userId = document.getElementById('user-id').getAttribute('data-user-id');

    let isPlaying = false;
    let currentIndex = -1; // Track current song index
    const songs = []; // Array to hold downloaded songs information

    const dbName = 'music_app';
    const storeName = 'audioFiles';

    // Open IndexedDB
    let dbPromise;

    function openDatabase() {
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName, 2);  // Incremented version to 2 (or higher if needed)
    
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    // Check if the object store exists, if not, create it
                    if (!db.objectStoreNames.contains(storeName)) {
                        const objectStore = db.createObjectStore(storeName, { keyPath: 'id' });
                        // Create an index on `userId` to allow filtering by user
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

    async function loadDownloadedSongs() {
        try {
            const db = await openDatabase();
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);
    
            // Use the index on `userId` to filter songs by the logged-in user
            const index = objectStore.index('userId');
            const request = index.getAll(userId); // Filter songs by userId
    
            request.onsuccess = (event) => {
                const result = event.target.result;
                result.forEach((song, index) => {
                    songs.push(song);
                    createSongRow(song, index);
                });
            };
    
            request.onerror = (event) => {
                console.error('Error fetching songs from IndexedDB:', event.target.error);
            };
        } catch (error) {
            console.error('Error loading downloaded songs:', error);
        }
    }

    // Create a row in the song list for downloaded songs
    function createSongRow(song, index) {
        const tableBody = document.getElementById('downloaded-songs-table-body');
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <button 
                    class="play-button" 
                    data-song-id="${song.id}"
                    data-file-url="${song.blob}"
                    data-title="${song.title}" 
                    data-artist="${song.artist}"
                >
                    <i class="fa-solid fa-play"></i>
                </button>
            </td>
            <td>
                <strong>
                    ${song.title}
                </strong><br>
                <small>
                    ${song.artist}
                </small>
            </td>
            <td class="text-end">
                <button class="btn btn-danger btn-sm delete-button" data-song-id="${song.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);

        // Add event listener to play button
        row.querySelector('.play-button').addEventListener('click', () => {
            playSong(index);
        });

        row.querySelector('.delete-button').addEventListener('click', () => {
            deleteSong(song.id, row);
        });
    }

    async function deleteSong(songId, row) {
        try {
            const db = await openDatabase();
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
    
            const deleteRequest = objectStore.delete(songId);
    
            deleteRequest.onsuccess = () => {
                console.log(`Song with ID ${songId} deleted successfully`);
                row.remove(); // Remove the row from the table
            };
    
            deleteRequest.onerror = (event) => {
                console.error('Error deleting the song from IndexedDB:', event.target.error);
            };
        } catch (error) {
            console.error('Error in deleting song:', error);
        }
    }

    // Play a song based on its index
    function playSong(index) {
        currentIndex = index;
        const song = songs[currentIndex];
        const songBlobUrl = URL.createObjectURL(song.blob); // Create a URL for the blob
    
        audioElement.src = songBlobUrl;
        currentSongTitle.textContent = song.title;
        currentSongArtist.textContent = song.artist;
        downloadButton.href = songBlobUrl; // Set the download button to download the current song
    
        // Play the audio after user interaction
        audioElement.play().then(() => {
            isPlaying = true; // Set the playing state to true
            updatePlayerIcon(); // Update icon after playing the song
        }).catch(error => {
            console.error('Error playing the audio:', error);
        });
    
        // Highlight the active row in the table
        document.querySelectorAll('#downloaded-songs-table-body tr').forEach((row, rowIndex) => {
            row.classList.toggle('table-active', rowIndex === currentIndex);
        });
    }

    // Play/Pause functionality
    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            audioElement.pause();
            isPlaying = false;
        } else {
            audioElement.play().then(() => {
                isPlaying = true;
            }).catch(error => {
                console.error('Error resuming the audio:', error);
            });
        }
        updatePlayerIcon();
    });

    // Previous song functionality
    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;  // Move to the previous song in the list
        } else {
            currentIndex = songs.length - 1;  // If first song, loop to the last song
        }
        playSong(currentIndex);
    });

    // Next song functionality
    nextButton.addEventListener('click', () => {
        if (currentIndex < songs.length - 1) {
            currentIndex++;  // Move to the next song in the list
        } else {
            currentIndex = 0;  // If last song, loop back to the first song
        }
        playSong(currentIndex);
    });

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

    // Update progress bar and time display as audio plays
    audioElement.addEventListener('timeupdate', () => {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressBar.value = progress;
        currentTimeElement.textContent = formatTime(audioElement.currentTime);
    });

    // When metadata is loaded, display total duration
    audioElement.addEventListener('loadedmetadata', () => {
        totalDurationElement.textContent = formatTime(audioElement.duration);
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

    // Automatically play the next song when the current one ends
    audioElement.addEventListener('ended', () => {
        currentIndex = (currentIndex + 1) % songs.length; // Loop back to the first song if at the end
        playSong(currentIndex);
    });

    // Format time as minutes and seconds
    function formatTime(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    // Load downloaded songs on page load
    loadDownloadedSongs();
});
