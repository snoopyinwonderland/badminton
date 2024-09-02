// Local Storage key
const STORAGE_KEY = 'badmintonAppData';

// 현재 상태에 대한 고유 키 생성
function generateUniqueKey() {
    // 모든 플레이어와 셔틀콕의 위치를 포함하여 고유한 키를 생성합니다.
    const positions = [
        document.getElementById('yellow1').style.left + ',' + document.getElementById('yellow1').style.top,
        document.getElementById('yellow2').style.left + ',' + document.getElementById('yellow2').style.top,
        document.getElementById('red1').style.left + ',' + document.getElementById('red1').style.top,
        document.getElementById('red2').style.left + ',' + document.getElementById('red2').style.top,
        document.getElementById('shuttlecock-start').style.left + ',' + document.getElementById('shuttlecock-start').style.top,
        document.getElementById('shuttlecock-end').style.left + ',' + document.getElementById('shuttlecock-end').style.top
    ];

    return positions.join('|'); // 고유한 문자열 생성
}

// 데이터 저장 함수
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 데이터 로드 함수
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

// 콘텐츠를 저장하는 함수
function saveContent() {
    const key = generateUniqueKey(); // 현재 상태에 대한 고유 키 생성
    const textContent = document.getElementById('textContent').value;
    const videoContent = document.getElementById('videoContent').value;
    const hashtagContent = document.getElementById('hashtagContent').value;

    if (!textContent && !videoContent && !hashtagContent) {
        alert('콘텐츠를 입력해 주세요.');
        return;
    }

    const newContent = {
        text: textContent,
        video: videoContent,
        hashtag: hashtagContent
    };

    const savedData = loadData();
    if (!savedData[key]) {
        savedData[key] = [];
    }
    savedData[key].push(newContent);

    saveData(savedData);
    displayContentForCurrentState(); // 저장 후 콘텐츠 표시

    // 입력 필드 초기화
    document.getElementById('textContent').value = '';
    document.getElementById('videoContent').value = '';
    document.getElementById('hashtagContent').value = '';
}

// 현재 상태에 맞는 콘텐츠 표시
function displayContentForCurrentState() {
    const key = generateUniqueKey();
    const savedData = loadData();
    const contentDisplay = document.getElementById('contentDisplay');
    contentDisplay.innerHTML = '';

    if (savedData[key]) {
        savedData[key].forEach(content => {
            const contentItem = document.createElement('div');
            contentItem.innerHTML = `
                <div>${content.text || ''}</div>
                <div>${content.video ? `<iframe src="${content.video}" width="100%" height="200"></iframe>` : ''}</div>
                <div>${content.hashtag || ''}</div>
                <hr>
            `;
            contentDisplay.appendChild(contentItem);
        });
    } else {
        contentDisplay.innerHTML = '이 조합에 대한 콘텐츠가 없습니다.';
    }
}

// 페이지 로드 시 기존 데이터 로드
document.addEventListener('DOMContentLoaded', () => {
    displayContentForCurrentState();
});

// 저장 버튼 이벤트 리스너 설정
document.getElementById('saveContentButton').addEventListener('click', saveContent);

