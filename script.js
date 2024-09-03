document.querySelectorAll('.player, #shuttlecock-start, #shuttlecock-end').forEach(item => {
    item.addEventListener('mousedown', dragStart);
});

let selectedElement = null;
let offsetX = 0;
let offsetY = 0;
let stateContentMap = {};

// 복식 모드와 관련된 플레이어를 표시합니다
function updatePlayerVisibility() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const isDoubles = mode === 'doubles';

    document.getElementById('yellow2').style.display = isDoubles ? 'block' : 'none';
    document.getElementById('red2').style.display = isDoubles ? 'block' : 'none';
}

document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', updatePlayerVisibility);
});

updatePlayerVisibility(); // 초기 상태 설정

function dragStart(e) {
    e.preventDefault();
    selectedElement = e.target;
    offsetX = e.clientX - selectedElement.getBoundingClientRect().left;
    offsetY = e.clientY - selectedElement.getBoundingClientRect().top;
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
}

function drag(e) {
    if (selectedElement) {
        const court = document.getElementById('court');
        const rect = court.getBoundingClientRect();

        let x = e.clientX - rect.left - offsetX;
        let y = e.clientY - rect.top - offsetY;

        x = Math.max(0, Math.min(x, rect.width - selectedElement.offsetWidth));
        y = Math.max(0, Math.min(y, rect.height - selectedElement.offsetHeight));

        selectedElement.style.left = `${x}px`;
        selectedElement.style.top = `${y}px`;
    }
}

function dragEnd() {
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);

    if (selectedElement) {
        if (selectedElement.id === 'shuttlecock-start') {
            positionShuttlecockEnd();
        } else if (selectedElement.id === 'shuttlecock-end') {
            // 필요에 따라 추가 작업
        }
        
        checkState();
    }

    selectedElement = null;
}

function positionShuttlecockEnd() {
    const court = document.getElementById('court');
    const courtHeight = court.getBoundingClientRect().height;

    const shuttleStart = document.getElementById('shuttlecock-start');
    const shuttleEnd = document.getElementById('shuttlecock-end');

    const shuttleStartTop = shuttleStart.getBoundingClientRect().top - court.getBoundingClientRect().top;

    if (shuttleStartTop < courtHeight / 2) {
        // 위쪽 코트에 있을 때
        shuttleEnd.style.left = `${court.offsetWidth / 2 - shuttleEnd.offsetWidth / 2}px`;
        shuttleEnd.style.top = `${courtHeight * 0.75 - shuttleEnd.offsetHeight / 2}px`;
    } else {
        // 아래쪽 코트에 있을 때
        shuttleEnd.style.left = `${court.offsetWidth / 2 - shuttleEnd.offsetWidth / 2}px`;
        shuttleEnd.style.top = `${courtHeight * 0.25 - shuttleEnd.offsetHeight / 2}px`;
    }

    shuttleEnd.style.display = 'block';
}

function checkState() {
    const state = getCurrentState();
    if (stateContentMap[state]) {
        displayContent(stateContentMap[state]);
    } else {
        displayNoContentMessage();
    }
}

function getCurrentState() {
    const yellow1 = document.getElementById('yellow1');
    const yellow2 = document.getElementById('yellow2');
    const red1 = document.getElementById('red1');
    const red2 = document.getElementById('red2');
    const shuttlecockStart = document.getElementById('shuttlecock-start');
    const shuttlecockEnd = document.getElementById('shuttlecock-end');

    return JSON.stringify({
        yellow1: { left: yellow1.style.left, top: yellow1.style.top },
        yellow2: { left: yellow2.style.left, top: yellow2.style.top },
        red1: { left: red1.style.left, top: red1.style.top },
        red2: { left: red2.style.left, top: red2.style.top },
        shuttlecockStart: { left: shuttlecockStart.style.left, top: shuttlecockStart.style.top },
        shuttlecockEnd: { left: shuttlecockEnd.style.left, top: shuttlecockEnd.style.top }
    });
}

function displayContent(content) {
    const contentDisplay = document.getElementById('content-display');
    contentDisplay.innerHTML = ''; // Clear previous content

    if (content.type === 'text') {
        const textElement = document.createElement('p');
        textElement.textContent = content.data;
        contentDisplay.appendChild(textElement);
    } else if (content.type === 'video') {
        const thumbnail = document.createElement('img');
        thumbnail.src = `https://img.youtube.com/vi/${content.data}/hqdefault.jpg`;
        thumbnail.className = 'video-thumbnail';
        thumbnail.style.cursor = 'pointer';
        thumbnail.addEventListener('click', () => showVideo(content.data));

        contentDisplay.appendChild(thumbnail);
    } else if (content.type === 'hashtag') {
        const hashtagElement = document.createElement('p');
        hashtagElement.textContent = content.data;
        contentDisplay.appendChild(hashtagElement);
    }
}

function showVideo(videoId) {
    const contentDisplay = document.getElementById('content-display');
    contentDisplay.innerHTML = ''; // Clear previous content

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    iframe.className = 'youtube-player';
    iframe.width = '560';
    iframe.height = '315';
    contentDisplay.appendChild(iframe);
}

function displayNoContentMessage() {
    const contentDisplay = document.getElementById('content-display');
    contentDisplay.innerHTML = '<p>No content available for this state. Click "Edit Content" to add.</p>';
}

document.getElementById('edit-content-button').addEventListener('click', function () {
    document.getElementById('editor-form').style.display = 'block';
});

document.getElementById('save-content-button').addEventListener('click', function () {
    const state = getCurrentState();
    const textContent = document.getElementById('content-text').value;
    const videoUrl = document.getElementById('video-url').value;
    const hashtag = document.getElementById('hashtag-input').value;

    if (textContent) {
        stateContentMap[state] = { type: 'text', data: textContent };
    } else if (videoUrl) {
        const videoId = extractVideoId(videoUrl);
        if (videoId) {
            stateContentMap[state] = { type: 'video', data: videoId };
        } else {
            alert('Invalid YouTube URL');
        }
    } else if (hashtag) {
        stateContentMap[state] = { type: 'hashtag', data: hashtag };
    }

    document.getElementById('editor-form').style.display = 'none';
    checkState();
});

function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length == 11) ? match[2] : null;
}
