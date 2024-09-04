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

// 기존 Edit Content 버튼을 최상단으로 이동
document.addEventListener('DOMContentLoaded', function() {
    // Move Edit Content button to the top of the right panel
    const editorForm = document.getElementById('editor-form');
    const rightPanel = document.getElementById('right-panel');
    const editContentButton = document.getElementById('edit-content-button');
    
    if (editorForm && rightPanel && editContentButton) {
        rightPanel.insertBefore(editContentButton, rightPanel.firstChild);
    }

    // Attach event listeners to Edit and Delete buttons
    document.querySelectorAll('.edit-button, .delete-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const actionType = event.target.classList.contains('edit-button') ? 'edit' : 'delete';
            const password = prompt('Please enter the password:');
            
            if (password === 'song') {
                const key = event.target.getAttribute('data-key');
                const index = parseInt(event.target.getAttribute('data-index'), 10);
                
                if (actionType === 'edit') {
                    editContent(key, index);
                } else if (actionType === 'delete') {
                    deleteContent(key, index);
                }
            } else {
                alert('Incorrect password.');
            }
        });
    });
});

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

// Matching Content의 YouTube 영상 크기를 50% 키움
function displayMatchingContent(content) {
    const matchingContents = document.getElementById('matching-contents');
    matchingContents.innerHTML = '';
    content.forEach(item => {
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content-item');

        contentDiv.innerHTML = `
            <div class="text">${item.text}</div>
            <iframe width="600" height="337.5" src="https://www.youtube.com/embed/${item.videoId}?start=${item.startTime}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <div class="hashtags">${item.hashtags.map(tag => `<a href="#" class="hashtag-link">${tag}</a>`).join(', ')}</div>
            <button class="view-position-button" onclick="viewPosition('${item.key}')">View Position</button>
            <button class="edit-button" data-key="${item.key}" data-index="${content.indexOf(item)}">Edit</button>
            <button class="delete-button" data-key="${item.key}" data-index="${content.indexOf(item)}">Delete</button>`;
        
        matchingContents.appendChild(contentDiv);
    });

    // Re-attach event listeners for edit and delete buttons after rendering
    document.querySelectorAll('.edit-button, .delete-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const actionType = event.target.classList.contains('edit-button') ? 'edit' : 'delete';
            const password = prompt('Please enter the password:');
            
            if (password === 'song') {
                const key = event.target.getAttribute('data-key');
                const index = parseInt(event.target.getAttribute('data-index'), 10);
                
                if (actionType === 'edit') {
                    editContent(key, index);
                } else if (actionType === 'delete') {
                    deleteContent(key, index);
                }
            } else {
                alert('Incorrect password.');
            }
        });
    });
}

document.getElementById('edit-content-button').addEventListener('click', () => {
    const form = document.getElementById('editor-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

// 수정 시 저장 버튼 클릭 리스너 추가
document.getElementById('save-content-button').addEventListener('click', () => {
    const key = document.getElementById('edit-key').value;
    const index = document.getElementById('edit-index').value;

    if (key && index !== '') {
        stateContentMap[key][index] = {
            text: document.getElementById('content-text').value,
            videoId: extractVideoId(document.getElementById('video-url').value),
            startTime: extractStartTime(document.getElementById('video-url').value),
            hashtags: document.getElementById('hashtag-input').value.split(',').map(tag => tag.trim()),
            key: key,
            positions: stateContentMap[key][index].positions
        };
    } else {
        // 새 콘텐츠 추가 시
        const contentText = document.getElementById('content-text').value;
        const videoUrl = document.getElementById('video-url').value;
        const hashtags = document.getElementById('hashtag-input').value.split(',').map(tag => tag.trim());
        const videoId = extractVideoId(videoUrl);
        const startTime = extractStartTime(videoUrl);
        const key = getCurrentStateKey();

        if (!stateContentMap[key]) {
            stateContentMap[key] = [];
        }

        const positions = [];
        document.querySelectorAll('.player').forEach(player => {
            if (player.id) {
                positions.push({
                    id: player.id,
                    x: parseInt(player.style.left, 10),
                    y: parseInt(player.style.top, 10)
                });
            }
        });

        stateContentMap[key].unshift({
            text: contentText,
            videoId: videoId,
            startTime: startTime,
            hashtags: hashtags,
            key: key,
            positions: positions
        });
    }

    saveStateContentMap();
    updateEntireContents();
    checkState();

    // 폼 초기화 및 숨기기
    document.getElementById('editor-form').reset();
    document.getElementById('editor-form').style.display = 'none';
    document.getElementById('edit-key').value = '';
    document.getElementById('edit-index').value = '';
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
        contentDiv.classList.add('content-item-small');

        contentDiv.innerHTML = `
            <div class="text">${item.text}</div>
            <iframe width="200" height="112.5" src="https://www.youtube.com/embed/${item.videoId}?start=${item.startTime}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <div class="hashtags">${item.hashtags.map(tag => `<a href="#" class="hashtag-link">${tag}</a>`).join(', ')}</div>
            <button class="view-position-button" onclick="viewPosition('${item.key}')">View Position</button>
            <button class="edit-button" onclick="editContent('${item.key}', ${allContents.indexOf(item)})">Edit</button>
            <button class="delete-button" onclick="deleteContent('${item.key}', ${allContents.indexOf(item)})">Delete</button>`;
        
        entireContents.appendChild(contentDiv);
    });
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

function editContent(key, index) {
    const item = stateContentMap[key][index];
    if (item) {
        document.getElementById('content-text').value = item.text;
        document.getElementById('video-url').value = `https://www.youtube.com/watch?v=${item.videoId}&t=${item.startTime}`;
        document.getElementById('hashtag-input').value = item.hashtags.join(', ');
        document.getElementById('edit-key').value = key;
        document.getElementById('edit-index').value = index;

        // Automatically show the edit form
        document.getElementById('editor-form').style.display = 'block';
    }
}

function deleteContent(key, index) {
    if (confirm('Are you sure you want to delete this content?')) {
        stateContentMap[key].splice(index, 1);
        if (stateContentMap[key].length === 0) {
            delete stateContentMap[key];
        }
        saveStateContentMap();
        updateEntireContents();
        checkState();
    }
}
