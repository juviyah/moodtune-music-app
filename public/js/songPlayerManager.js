document.addEventListener('DOMContentLoaded', () => {
    const audioPlayers = document.querySelectorAll('.song-player');

    audioPlayers.forEach(player => {
        player.addEventListener('play', () => {
            audioPlayers.forEach(p => {
                if (p !== player) {
                    p.pause();
                    p.currentTime = 0;  // Reset playback position
                }
            });
        });
    });
});