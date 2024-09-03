let selectedElement = null;
let offsetX = 0;
let offsetY = 0;
let stateContentMap = {};

document.querySelectorAll('.player, #shuttlecock-start, #shuttlecock-end').forEach(item => {
    item.addEventListener('mousedown', dragStart);
});


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

function checkState() {
    let key = '';

    document.querySelectorAll('.player').forEach(player => {
        key += player.style.left + player.style.top + '-';
    });

    key += document.getElementById('shuttlecock-start').style.left + document.getElementById('shuttlecock-start').style.top;

    if (stateContentMap[key]) {
        displayMatchingContent(stateContentMap[key]);
    } else {
        document.getElementById('matching-contents').innerHTML = '<p>No matching contents found.</p>';
    }
}

function setState(state) {
    for (const id in state) {
        const element = document.getElementById(id);
        element.style.left = state[id].left;
        element.style.top = state[id].top;
    }
}

function displayMatchingContent(content) {
    const matchingContents = document.getElementById('matching-contents');
    matchingContents.innerHTML = '';
    content.forEach(item => {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `<img src="${item.thumbnail}" class="video-thumbnail"><div class="text">${item.text}</div><div class="hashtags">${item.hashtag}</div>`;
        matchingContents.appendChild(contentDiv);
    });
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

document.getElementById('edit-content-button').addEventListener('click', () => {
    const form = document.getElementById('editor-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

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

document.getElementById('save-content-button').addEventListener('click', () => {
    const contentText = document.getElementById('content-text').value;
    const videoUrl = document.getElementById('video-url').value;
    const hashtag = document.getElementById('hashtag-input').value;
    const thumbnail = `http://img.youtube.com/vi/${extractVideoId(videoUrl)}/0.jpg`;

    const key = getCurrentStateKey();

    if (!stateContentMap[key]) {
        stateContentMap[key] = [];
    }

    stateContentMap[key].unshift({ text: contentText, thumbnail: thumbnail, hashtag: hashtag });

    updateEntireContents();
    checkState();
});

function extractVideoId(url) {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|(?:youtu\.be\/))([^&\n?#]+)/;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : null;
}

function getCurrentStateKey() {
    let key = '';
    document.querySelectorAll('.player').forEach(player => {
        key += player.style.left + player.style.top + '-';
    });

    key += document.getElementById('shuttlecock-start').style.left + document.getElementById('shuttlecock-start').style.top;

    return key;
}

function updateEntireContents() {
    const entireContents = document.getElementById('entire-contents');
    entireContents.innerHTML = '';
    const allContents = Object.values(stateContentMap).flat();
    allContents.sort(() => Math.random() - 0.5);  // Randomize content order

    allContents.forEach(item => {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `<img src="${item.thumbnail}" class="video-thumbnail"><div class="text">${item.text}</div><div class="hashtags">${item.hashtag}</div>`;
        entireContents.appendChild(contentDiv);
    });
}
