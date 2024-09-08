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

function generateRandomKey() {
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => dec.toString(36)).join('');
}

function displayMatchingContent(content) {
    const matchingContents = document.getElementById('matching-contents');
    matchingContents.innerHTML = '';
    content.forEach((item, index) => {
        const contentDiv = document.createElement('div');
        const hashtagsHtml = item.hashtags.map(tag => `<a href="#" class="hashtag-link" onclick="filterByHashtag('${tag}')">#${tag}</a>`).join(', ');
        contentDiv.innerHTML = `
            <div class="text">${item.text}</div>
            <iframe width="600" height="337.5" src="https://www.youtube.com/embed/${item.videoId}?start=${item.startTime}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <div class="hashtags">${hashtagsHtml}</div>
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

    const key = generateRandomKey(); // 난수화된 key 생성

    // 현재 모드 확인
    const mode = document.querySelector('input[name="mode"]:checked').value;

    // 플레이어 위치 저장
    const positions = [];

    if (mode === 'singles') {
        ['yellow1', 'red1'].forEach(id => {
            const player = document.getElementById(id);
            if (player) {
                positions.push({
                    id: player.id,
                    x: parseInt(player.style.left, 10),
                    y: parseInt(player.style.top, 10)
                });
            }
        });
    } else if (mode === 'doubles') {
        document.querySelectorAll('.player').forEach(player => {
            if (player.id) {
                positions.push({
                    id: player.id,
                    x: parseInt(player.style.left, 10),
                    y: parseInt(player.style.top, 10)
                });
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

    // 이전 데이터를 덮어쓰는 방식으로 업데이트
    stateContentMap[key] = [{
        text: contentText,
        videoId: videoId,
        startTime: startTime,
        hashtags: hashtags,
        key: key,
        timestamp: new Date().toISOString(),  // 추가된 부분
        positions: positions,
        shuttlecockStart: shuttlecockStart,
        shuttlecockEnd: shuttlecockEnd
    }];

    /*
    // stateContentMap 업데이트
    if (!stateContentMap[key]) {
        stateContentMap[key] = [];
    }
    stateContentMap[key].push(newContent);
    */

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
        // URL을 현재 창에서 변경 (history.pushState를 사용)
        window.history.pushState(null, '', `?key=${key}`);

        const firstContent = contents[0]; // 첫 번째 콘텐츠를 기반으로 모드 전환
                
        // 현재 상태 URL을 key를 사용하여 생성
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('key', key);
        
        // URL을 새 창으로 열도록 설정
        // window.open(currentUrl.toString(), '_blank');

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
        text: updatedText,
        videoId: updatedVideoId,
        startTime: updatedStartTime,
        hashtags: updatedHashtags,
        key: key,
        timestamp: new Date().toISOString(),
        positions: stateContentMap[key][index].positions,
        shuttlecockStart: stateContentMap[key][index].shuttlecockStart,
        shuttlecockEnd: stateContentMap[key][index].shuttlecockEnd
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
    stateContentMap = loadStateContentMap(); // 로컬 저장소에서 상태 맵을 로드
    updateEntireContents(); // 모든 콘텐츠 업데이트

    // URL에서 key 파라미터를 가져와서 상태를 불러옴
    const key = getContentKeyFromUrl();
    if (key && stateContentMap[key]) {
        viewPosition(key);  // 해당 키의 위치를 복원
    } else {
        checkState();  // URL에 키가 없으면 기본 상태 확인
    }
});

// URL에서 key 값을 추출하는 함수
function getContentKeyFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('key');
}

// Hashtag를 클릭하면 해당 Hashtag를 포함하는 콘텐츠를 필터링하여 최신순으로 나열
function filterByHashtag(hashtag) {
    const entireContentsDiv = document.getElementById('entire-contents');
    entireContentsDiv.innerHTML = ''; // 기존 콘텐츠 삭제

    // 최상단에 클릭한 Hashtag 표시
    const hashtagHeader = document.createElement('h2');
    hashtagHeader.textContent = `#${hashtag}`;
    entireContentsDiv.appendChild(hashtagHeader);

    // 모든 콘텐츠에서 Hashtag를 포함하는 항목 필터링
    const filteredContents = [];
    for (const key in stateContentMap) {
        stateContentMap[key].forEach(content => {
            if (content.hashtags.includes(hashtag)) {
                filteredContents.push(content);
            }
        });
    }

    // 최신순으로 정렬 (추가 시간 데이터를 사용하여 구현 가능)
    filteredContents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 필터링된 콘텐츠를 최신순으로 나열
    filteredContents.forEach(content => {
        const hashtagsHtml = content.hashtags.map(tag => `<a href="#" class="hashtag-link" onclick="filterByHashtag('${tag}')">#${tag}</a>`).join(', ');
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content-item';
        contentDiv.innerHTML = `
            <div class="text">${content.text}</div>
            <iframe width="600" height="337.5" src="https://www.youtube.com/embed/${content.videoId}?start=${content.startTime}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <div class="hashtags">${hashtagsHtml}</div>
        `;
        entireContentsDiv.appendChild(contentDiv);
    });
}

// Hashtag 링크에 대한 이벤트 리스너 설정
document.querySelectorAll('.hashtag-link').forEach(hashtagLink => {
    hashtagLink.addEventListener('click', event => {
        event.preventDefault();
        const hashtag = event.target.textContent.replace('#', '');
        filterByHashtag(hashtag);
    });
});

// URL에서 특정 키를 가져오는 함수
function getContentKeyFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('key');
}

// 특정 키를 가진 콘텐츠를 불러오는 함수
function loadContentFromUrl() {
    const key = getContentKeyFromUrl();
    if (key && stateContentMap[key]) {
        displayMatchingContent(stateContentMap[key]);
    }
}

