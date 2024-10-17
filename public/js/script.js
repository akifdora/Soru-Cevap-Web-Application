    const toggleButton = document.getElementById('toggleButton');
    const body = document.body;
    const currentMode = localStorage.getItem('mode');

    if (currentMode === 'dark') {
        body.classList.add('dark-mode');
        toggleButton.textContent = '☀️';
    }

    toggleButton.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            toggleButton.textContent = '☀️';
            localStorage.setItem('mode', 'dark');
        } else {
            toggleButton.textContent = '🌙';
            localStorage.setItem('mode', 'light');
        }
    });
