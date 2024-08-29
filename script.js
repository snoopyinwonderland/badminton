// script.js

document.querySelectorAll('.player, #shuttlecock-start, #shuttlecock-end').forEach(item => {
    item.addEventListener('mousedown', dragStart);
});

let selectedElement = null;
let offsetX = 0;
let offsetY = 0;

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

    if (selectedElement && selectedElement.id === 'shuttlecock-start') {
        // shuttlecock-start가 드래그된 후 shuttlecock-end 표시
        positionShuttlecockEnd();
    } else if (selectedElement && selectedElement.id === 'shuttlecock-end') {
        // shuttlecock-end가 드래그된 후 체크박스 표시
        // showCheckboxes(selectedElement);
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

/*
function showCheckboxes(shuttlecock) {
    // 기존 체크박스가 있으면 제거
    const existingCheckboxContainer = document.querySelector('.checkbox-container');
    if (existingCheckboxContainer) {
        existingCheckboxContainer.remove();
    }

    const checkboxContainer = document.createElement('div');
    checkboxContainer.classList.add('checkbox-container');

    const rallyLabel = document.createElement('label');
    rallyLabel.innerHTML = '<input type="radio" name="rally-point" value="rally"> <span class="label-text">RALLY</span>';
    rallyLabel.style.marginRight = '10px';

    const pointLabel = document.createElement('label');
    pointLabel.innerHTML = '<input type="radio" name="rally-point" value="point"> <span class="label-text">POINT</span>';

    const confirmButton = document.createElement('button');
    confirmButton.textContent = '확인';
    confirmButton.addEventListener('click', confirmSelection);

    checkboxContainer.appendChild(rallyLabel);
    checkboxContainer.appendChild(pointLabel);
    checkboxContainer.appendChild(confirmButton);

    document.body.appendChild(checkboxContainer);

    checkboxContainer.style.left = `${shuttlecock.getBoundingClientRect().right + 10}px`;
    checkboxContainer.style.top = `${shuttlecock.getBoundingClientRect().top}px`;

    // 체크박스 이벤트 리스너
    document.querySelectorAll('input[name="rally-point"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // 옵션 선택 시 처리 (선택된 값을 확인 버튼 클릭 후에 사용)
        });
    });
}
*/

/*
function confirmSelection() {
    const selectedOption = document.querySelector('input[name="rally-point"]:checked');
    const shuttleEnd = document.getElementById('shuttlecock-end');

    if (selectedOption) {
        // 기존 선택 텍스트가 있으면 제거
        const existingLabel = document.querySelector('.shuttlecock-label');
        if (existingLabel) {
            existingLabel.remove();
        }

        // 검은 상자에 선택된 텍스트 표시
        const label = document.createElement('div');
        label.classList.add('shuttlecock-label');
        label.textContent = selectedOption.value.toUpperCase();
        shuttleEnd.parentNode.insertBefore(label, shuttleEnd.nextSibling);

        // 검은 상자로 스타일링 및 고정된 위치 설정
        label.style.position = 'absolute';
        label.style.left = `${shuttleEnd.offsetLeft + shuttleEnd.offsetWidth + 5}px`; // 셔틀콕에서 20px 오른쪽으로 고정
        label.style.top = `${shuttleEnd.offsetTop}px`;
        label.style.backgroundColor = 'black';
        label.style.color = 'white';
        label.style.padding = '5px';

        // 체크박스 메뉴 숨김
        const checkboxContainer = document.querySelector('.checkbox-container');
        if (checkboxContainer) {
            checkboxContainer.remove();
        }
    }
}
*/

// 라디오 버튼을 통해 단식/복식 모드 선택
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const isSingles = this.value === 'singles';
        document.getElementById('yellow1').style.display = 'block';
        document.getElementById('red1').style.display = 'block';

        if (isSingles) {
            document.getElementById('yellow2').style.display = 'none';
            document.getElementById('red2').style.display = 'none';
        } else {
            document.getElementById('yellow2').style.display = 'block';
            document.getElementById('red2').style.display = 'block';
        }
    });
});

// Edit Content 버튼 이벤트 핸들러
document.getElementById('edit-content-button').addEventListener('click', function() {
    const editorForm = document.getElementById('editor-form');
    if (editorForm.style.display === 'none' || editorForm.style.display === '') {
        editorForm.style.display = 'block';
    } else {
        editorForm.style.display = 'none';
    }
});

const hashtagList = {};

// Hashtag 추가
document.getElementById('add-hashtag-btn').addEventListener('click', function() {
    const input = document.getElementById('hashtag-input').value.trim();
    if (input && input.startsWith('#')) {
        if (!hashtagList[input]) {
            hashtagList[input] = [];
        }
        const currentState = {
            yellow1: { left: document.getElementById('yellow1').style.left, top: document.getElementById('yellow1').style.top },
            yellow2: { left: document.getElementById('yellow2').style.left, top: document.getElementById('yellow2').style.top },
            red1: { left: document.getElementById('red1').style.left, top: document.getElementById('red1').style.top },
            red2: { left: document.getElementById('red2').style.left, top: document.getElementById('red2').style.top },
            shuttlecockStart: { left: document.getElementById('shuttlecock-start').style.left, top: document.getElementById('shuttlecock-start').style.top },
            shuttlecockEnd: { left: document.getElementById('shuttlecock-end').style.left, top: document.getElementById('shuttlecock-end').style.top, display: document.getElementById('shuttlecock-end').style.display }
        };
        hashtagList[input].push(currentState);
        updateHashtagList();
        document.getElementById('hashtag-input').value = '';
    }
});

// Hashtag 목록 업데이트
function updateHashtagList() {
    const listContainer = document.getElementById('hashtag-list');
    listContainer.innerHTML = '';
    for (let tag in hashtagList) {
        const button = document.createElement('button');
        button.textContent = tag;
        button.addEventListener('click', function() {
            displayHashtagContent(tag);
        });
        listContainer.appendChild(button);
    }
}

// Hashtag 관련 콘텐츠 표시
function displayHashtagContent(tag) {
    if (hashtagList[tag]) {
        const content = hashtagList[tag];
        // 예를 들어, hashtag 관련 오브젝트 위치를 설정
        restoreState(content[0]); // 첫 번째 저장된 상태 복원
    }
}
