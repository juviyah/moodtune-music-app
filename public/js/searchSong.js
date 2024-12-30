const searchInput = document.getElementById('song-search');
const suggestionsContainer = document.getElementById('suggestions');

let debounceTimer;
function debounce(func, delay) {
    return function (...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
}

async function fetchSuggestions(query) {
    if (query.length < 2) {
        suggestionsContainer.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`/search?q=${query}`);
        const suggestions = await response.json();

        if (suggestions.length === 0) {
            suggestionsContainer.innerHTML = '<div class="list-group-item">No results found</div>';
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(song => `
            <a href="/songs/${song.song_id}" class="list-group-item list-group-item-action" data-id="${song.song_id}">
                ${song.title} by ${song.artist}
            </a>
        `).join('');
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

searchInput.addEventListener('input', debounce((event) => {
    const query = event.target.value.trim();
    fetchSuggestions(query);
}, 300));
