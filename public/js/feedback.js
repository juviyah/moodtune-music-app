async function submitFeedback(event) {
    event.preventDefault(); // Prevent form submission

    const feedbackText = document.getElementById('feedback_text').value;

    try {
        const response = await fetch('/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ feedback_text: feedbackText }),
        });

        if (response.ok) {
            const result = await response.json();
            alert('Feedback submitted: \nFeedback ID: ' + result.feedback_id);
            window.location.reload()
        } else {
            alert('Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error submitting feedback');
    }
}