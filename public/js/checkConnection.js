function checkInternetConnection() {    
    if (navigator.onLine) {
        fetch('https://jsonplaceholder.typicode.com/todos/1')
            .then(() => {
                console.log("Online");
            })
            .catch(() => {
                window.location.href = '/downloads';
            });
    } else {
        window.location.href = '/downloads';
    }
}

window.addEventListener('load', checkInternetConnection);
setInterval(checkInternetConnection, 3000);
