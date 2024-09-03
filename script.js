document.querySelectorAll('.player, #shuttlecock-start, #shuttlecock-end').forEach(item => {
    item.addEventListener('mousedown', dragStart);
});

let selectedElement = null;
let offsetX = 0;
let offsetY = 0;
let stateContentMap = {};
let entireContentList = [];

function updatePlayerVisibility() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const isDoubles = mode === 'doubles';

    document.getElementById('yellow2').style.display = isDoubles ? 'block' : 'none';
    document.getElementById('red2').style.display = isDoubles ? 'block' : 'none';
}

document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', updatePlayerVisibility);
});

updatePlayerVisibility();

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

    // 드래그가 끝났을 때 드래그 중인 요소가 shuttlecock-start일 경우에만 위치를 설정합니다.
    if (selectedElement && selectedElement.id === 'shuttlecock-start') {
        positionShuttlecockEnd();
    }

    selectedElement = null;
    checkState();
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

function getCurrentState() {
    const yellow1 = document.getElementById('yellow1');
    const yellow2 = document.getElementById('yellow2');
    const red1 = document.getElementById('red1');
    const red2 = document.getElementById('red2');
    const shuttlecockStart = document.getElementById('shuttlecock-start');
    const shuttlecockEnd = document.getElementById('shuttlecock-end');

    return {
        yellow1: { left: yellow1.style.left, top: yellow1.style.top },
        yellow2: { left: yellow2.style.left, top: yellow2.style.top },
        red1: { left: red1.style.left, top: red1.style.top },
        red2: { left: red2.style.left, top: red2.style.top },
        shuttlecockStart: { left: shuttlecockStart.style.left, top: shuttlecockStart.style.top },
        shuttlecockEnd: { left: shuttlecockEnd.style.left, top: shuttlecockEnd.style.top }
    };
}

function setState(state) {
    for (const id in state) {
        const element = document.getElementById(id);
        element.style.left = state[id].left;
        element.style.top = state[id].top;
    }
}

function saveContent() {
    const contentText = document.getElementById('content-text').value.trim();
    const videoUrl = document.getElementById('video-url').value.trim();
    const hashtag = document.getElementById('hashtag-input').value.trim();

    if (!contentText && !videoUrl && !hashtag) {
        alert('Please enter at least one of content, video URL, or hashtag.');
        return;
    }

    const state = getCurrentState();
    const contentData = {
        contentText,
        videoUrl,
        hashtag,
        state
    };

    const contentId = Date.now();
    stateContentMap[contentId] = contentData;
    entireContentList.push(contentId);

    updateContentDisplay();
}

document.getElementById('save-content-button').addEventListener('click', saveContent);

function updateContentDisplay() {
    const matchingContentsDiv = document.getElementById('matching-contents');
    const entireContentsDiv = document.getElementById('entire-contents');
    
    matchingContentsDiv.innerHTML = '';
    entireContentsDiv.innerHTML = '';

    const currentState = getCurrentState();
    let matchingContentFound = false;

    entireContentList.forEach(contentId => {
        const contentData = stateContentMap[contentId];
        const contentDiv = createContentDiv(contentData, contentId);

        if (JSON.stringify(contentData.state) === JSON.stringify(currentState)) {
            matchingContentsDiv.appendChild(contentDiv);
            matchingContentFound = true;
        }

        entireContentsDiv.appendChild(contentDiv);
    });

    if (!matchingContentFound) {
        matchingContentsDiv.innerHTML = '<p>No matching content found for the current configuration.</p>';
    }
}

function createContentDiv(contentData, contentId) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content-item';

    if (contentData.videoUrl) {
        const videoFrame = document.createElement('iframe');
        videoFrame.src = `https://www.youtube.com/embed/${getYouTubeVideoId(contentData.videoUrl)}`;
        videoFrame.className = 'youtube-player';
        contentDiv.appendChild(videoFrame);
    }

    if (contentData.contentText) {
        const textParagraph = document.createElement('p');
        textParagraph.textContent = contentData.contentText;
        contentDiv.appendChild(textParagraph);
    }

    if (contentData.hashtag) {
        const hashtagParagraph = document.createElement('p');
        hashtagParagraph.textContent = contentData.hashtag;
        contentDiv.appendChild(hashtagParagraph);
    }

    contentDiv.addEventListener('click', () => {
        setState(contentData.state);
    });

    return contentDiv;
}

function getYouTubeVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)|(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] || match[2] : null;
}

function checkState() {
    const currentState = getCurrentState();
    let stateFound = false;

    entireContentList.forEach(contentId => {
        const contentData = stateContentMap[contentId];

        if (JSON.stringify(contentData.state) === JSON.stringify(currentState)) {
            stateFound = true;
            updateContentDisplay();
        }
    });

    if (!stateFound) {
        updateContentDisplay();
    }
}
