let selectedElement = null;
let offsetX = 0;
let offsetY = 0;
let stateContentMap = loadStateContentMap(); // 로컬 스토리지에서 상태를 로드합니다.

document.querySelectorAll('.player, #shuttlecock-start, #shuttlecock-end').forEach(item => {
    item.addEventListener('mousedown', dragStart);
});

/*
document.querySelectorAll('.player').forEach(player => {
    if (player.id) { // Ensure that the player has an id
        console.log(`Saving position for ${player.id}: (${parseInt(player.style.left, 10)}, ${parseInt(player.style.top, 10)})`); // 디버깅 메시지
        positions.push({
            id: player.id,
            x: parseInt(player.style.left, 10),
            y: parseInt(player.style.top, 10)
        });
    }
});
*/

function updatePlayerVisibility() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const isDoubles = mode === 'doubles';

    document.getElementById('yellow2').style.display = isDoubles ? 'block' : 'none';
    document.getElementById('red2').style.display = isDoubles ? 'block' : 'none';
}

// 모드 전환 이벤트 리스너 추가
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', updatePlayerVisibility);
});

// 페이지 로드 시 초기 모드 설정
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

function checkState() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    let key = '';

    document.querySelectorAll('.player').forEach(player => {
        key += `${player.style.left}-${player.style.top}-`;
    });

    key += `${document.getElementById('shuttlecock-start').style.left}-${document.getElementById('shuttlecock-start').style.top}`;
    key += `-${mode}`; // 현재 모드를 키에 추가

    console.log("Checking state for key:", key); // 디버깅 메시지
    console.log("Current stateContentMap:", stateContentMap); // 디버깅 메시지

    if (stateContentMap[key]) {
        displayMatchingContent(stateContentMap[key]);
    } else {
        document.getElementById('matching-contents').innerHTML = '<p>No matching contents found.</p>';
    }
}

function displayMatchingContent(content) {
    const matchingContents = document.getElementById('matching-contents');
    matchingContents.innerHTML = '';
    content.forEach((item, index) => {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
            <div class="text">${item.text}</div>
            <iframe width="600" height="337.5" src="https://www.youtube.com/embed/${item.videoId}?start=${item.startTime}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <div class="hashtags">${item.hashtags.join(', ')}</div>
            <div class="edit-delete-buttons">
                <button class="view-position-button" onclick="viewPosition('${item.key}')">View Position</button>
                <button class="edit-button" onclick="editContent('${item.key}', ${index})">Edit</button>
                <button class="delete-button delete" onclick="deleteContent('${item.key}', ${index})">Delete</button>
            </div>`;
        matchingContents.appendChild(contentDiv);
    });
}

document.getElementById('edit-content-button').addEventListener('click', () => {
    const form = document.getElementById('editor-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('save-content-button').addEventListener('click', () => {
    const contentText = document.getElementById('content-text').value.trim();
    const videoUrl = document.getElementById('video-url').value.trim();
    const hashtags = document.getElementById('hashtag-input').value.split(',').map(tag => tag.trim());
    const videoId = extractVideoId(videoUrl);
    const startTime = extractStartTime(videoUrl);

    const key = getCurrentStateKey();

    if (!stateContentMap[key]) {
        stateContentMap[key] = [];
    }

    // 현재 모드 확인
    const mode = document.querySelector('input[name="mode"]:checked').value;

    // Save positions with ids
    const positions = [];

    if (mode === 'singles') {
        // 싱글스 모드에서는 yellow1과 red1만 저장
        ['yellow1', 'red1'].forEach(id => {
            const player = document.getElementById(id);
            if (player) {
                const playerPosition = {
                    id: player.id,
                    x: parseInt(player.style.left, 10),
                    y: parseInt(player.style.top, 10)
                };
                positions.push(playerPosition);
                console.log(`Saving position for ${player.id}: (${playerPosition.x}, ${playerPosition.y})`);
            }
        });
    } else if (mode === 'doubles') {
        // 복식 모드에서는 모든 플레이어 저장
        document.querySelectorAll('.player').forEach(player => {
            if (player.id) {
                const playerPosition = {
                    id: player.id,
                    x: parseInt(player.style.left, 10),
                    y: parseInt(player.style.top, 10)
                };
                positions.push(playerPosition);
                console.log(`Saving position for ${player.id}: (${playerPosition.x}, ${playerPosition.y})`);
            }
        });
    }

    // 셔틀콕 위치 저장
    const shuttlecockStart = {
        x: parseInt(document.getElementById('shuttlecock-start').style.left, 10),
        y: parseInt(document.getElementById('shuttlecock-start').style.top, 10)
    };
    const shuttlecockEnd = {
        x: parseInt(document.getElementById('shuttlecock-end').style.left, 10),
        y: parseInt(document.getElementById('shuttlecock-end').style.top, 10)
    };

    console.log("Saving shuttlecock positions:", shuttlecockStart, shuttlecockEnd);

    // 콘텐츠 데이터에 저장
    stateContentMap[key].unshift({
        text: contentText,
        videoId: videoId,
        startTime: startTime,
        hashtags: hashtags,
        key: key,
        positions: positions,
        shuttlecockStart: shuttlecockStart,
        shuttlecockEnd: shuttlecockEnd
    });

    saveStateContentMap(); // 로컬 스토리지에 저장
    updateEntireContents(); // 전체 콘텐츠 목록 업데이트
    checkState(); // 상태 확인
});

function extractVideoId(url) {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|(?:youtu\.be\/))([^&\n?#]+)/;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : null;
}

function extractStartTime(url) {
    const startTimeMatch = url.match(/[?&]t=(\d+)/);
    return startTimeMatch ? startTimeMatch[1] : 0;
}

function viewPosition(key) {
    console.log(`Viewing position for key: ${key}`); // 디버깅 메시지
    const contents = stateContentMap[key];
    console.log("StateContent for key:", contents); // 디버깅 메시지

    if (contents && contents.length > 0) {
        const firstContent = contents[0]; // 첫 번째 콘텐츠를 기반으로 모드 전환
        const mode = firstContent.key.includes('singles') ? 'singles' : 'doubles';

        // 모드 변경
        document.querySelector(`input[name="mode"][value="${mode}"]`).checked = true;
        updatePlayerVisibility(); // 플레이어 가시성 업데이트

        // 플레이어 위치 설정
        const positions = firstContent.positions;
        positions.forEach(item => {
            const player = document.getElementById(item.id);
            if (player) {
                player.style.left = `${item.x}px`;
                player.style.top = `${item.y}px`;
                console.log(`Setting position for ${item.id}: (${item.x}, ${item.y})`);
            } else {
                console.warn(`Element with ID ${item.id} not found`);
            }
        });

        // 셔틀콕 위치 설정
        const shuttlecockStart = document.getElementById('shuttlecock-start');
        const shuttlecockEnd = document.getElementById('shuttlecock-end');

        if (firstContent.shuttlecockStart) {
            shuttlecockStart.style.left = `${firstContent.shuttlecockStart.x}px`;
            shuttlecockStart.style.top = `${firstContent.shuttlecockStart.y}px`;
            shuttlecockStart.style.display = 'block';
            console.log(`Setting position for shuttlecock-start: (${firstContent.shuttlecockStart.x}, ${firstContent.shuttlecockStart.y})`);
        } else {
            shuttlecockStart.style.display = 'none';
        }

        if (firstContent.shuttlecockEnd) {
            shuttlecockEnd.style.left = `${firstContent.shuttlecockEnd.x}px`;
            shuttlecockEnd.style.top = `${firstContent.shuttlecockEnd.y}px`;
            shuttlecockEnd.style.display = 'block';
            console.log(`Setting position for shuttlecock-end: (${firstContent.shuttlecockEnd.x}, ${firstContent.shuttlecockEnd.y})`);
        } else {
            shuttlecockEnd.style.display = 'none';
        }

        // 일치하는 콘텐츠 표시
        displayMatchingContent(contents);

    } else {
        console.warn(`No content found for key: ${key}`);
    }
}

function getCurrentStateKey() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    let key = '';

    // 단식 모드일 경우 yellow1, red1만 키에 추가
    if (mode === 'singles') {
        const player1 = document.getElementById('yellow1');
        const player2 = document.getElementById('red1');
        key += `${Math.round(parseFloat(player1.style.left))}px${Math.round(parseFloat(player1.style.top))}px-`;
        key += `${Math.round(parseFloat(player2.style.left))}px${Math.round(parseFloat(player2.style.top))}px-`;
    } else if (mode === 'doubles') {
        // 복식 모드일 경우 모든 플레이어를 키에 추가
        document.querySelectorAll('.player').forEach(player => {
            key += `${Math.round(parseFloat(player.style.left))}px${Math.round(parseFloat(player.style.top))}px-`;
        });
    }

    // 셔틀콕 시작과 종료 위치를 항상 추가
    const shuttlecockStart = document.getElementById('shuttlecock-start');
    const shuttlecockEnd = document.getElementById('shuttlecock-end');
    key += `${Math.round(parseFloat(shuttlecockStart.style.left))}px${Math.round(parseFloat(shuttlecockStart.style.top))}px-`;
    key += `${Math.round(parseFloat(shuttlecockEnd.style.left))}px${Math.round(parseFloat(shuttlecockEnd.style.top))}px-`;

    // 마지막에 모드 정보를 추가
    key += `${mode}`;

    // 디버깅 메시지
    console.log("Generated key:", key);
    return key;
}

function updateEntireContents() {
    const entireContents = document.getElementById('entire-contents');
    entireContents.innerHTML = '';
    const allContents = Object.values(stateContentMap).flat();
    allContents.sort(() => Math.random() - 0.5);  // Randomize content order

    allContents.forEach(item => {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
            <div class="text">${item.text}</div>
            <iframe width="320" height="180" src="https://www.youtube.com/embed/${item.videoId}?start=${item.startTime}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <div class="hashtags">${item.hashtags.join(', ')}</div>
            <button class="view-position-button" onclick="viewPosition('${item.key}')">View Position</button>`;
        entireContents.appendChild(contentDiv);
    });
}

function editContent(key, index) {
    const password = prompt("Enter password to edit:");
    if (password === "song") {
        const content = stateContentMap[key][index];
        document.getElementById('content-text').value = content.text;
        document.getElementById('video-url').value = `https://www.youtube.com/watch?v=${content.videoId}&t=${content.startTime}`;
        document.getElementById('hashtag-input').value = content.hashtags.join(', ');
        document.getElementById('editor-form').style.display = 'block';

        document.getElementById('save-content-button').onclick = function() {
            saveEditedContent(key, index);
        };
    } else {
        alert("Incorrect password.");
    }
}

function saveEditedContent(key, index) {
    const contentText = document.getElementById('content-text').value.trim();
    const videoUrl = document.getElementById('video-url').value.trim();
    const hashtags = document.getElementById('hashtag-input').value.split(',').map(tag => tag.trim());
    const videoId = extractVideoId(videoUrl);
    const startTime = extractStartTime(videoUrl);

    stateContentMap[key][index] = {
        ...stateContentMap[key][index],
        text: contentText,
        videoId: videoId,
        startTime: startTime,
        hashtags: hashtags
    };

    saveStateContentMap();
    updateEntireContents();
    checkState();
    document.getElementById('editor-form').style.display = 'none';
}

function deleteContent(key, index) {
    const password = prompt("Enter password to delete:");
    if (password === "song") {
        stateContentMap[key].splice(index, 1);
        if (stateContentMap[key].length === 0) {
            delete stateContentMap[key];
        }
        saveStateContentMap();
        updateEntireContents();
        checkState();
    } else {
        alert("Incorrect password.");
    }
}

function saveStateContentMap() {
    console.log("Saving stateContentMap:", stateContentMap); // 디버깅 메시지
    localStorage.setItem('stateContentMap', JSON.stringify(stateContentMap));
}

function loadStateContentMap() {
    const savedMap = localStorage.getItem('stateContentMap');
    const parsedMap = savedMap ? JSON.parse(savedMap) : {};
    console.log("Loaded stateContentMap:", parsedMap); // 디버깅 메시지
    return parsedMap;
}

window.addEventListener('load', () => {
    // Ensure that the map is loaded and matching contents are updated
    stateContentMap = loadStateContentMap();
    updateEntireContents();
    checkState();
});
