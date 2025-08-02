// --- PHẦN KHỞI TẠO VÀ CẤU HÌNH FIREBASE ---
let currentUser = null;

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch(error => {
            console.error("Lỗi khi đăng nhập:", error);
            alert("Đăng nhập thất bại. Vui lòng thử lại.");
        });
}

function signOut() {
    auth.signOut().catch(error => console.error("Lỗi khi đăng xuất:", error));
}

// THEO DÕI TRẠNG THÁI ĐĂNG NHẬP
auth.onAuthStateChanged(user => {
    const menuContainer = document.getElementById('user-menu-container');
    const mainControls = document.querySelector('.main-controls');
    const lessonControls = document.querySelector('.lesson-controls');
    const statsContainer = document.getElementById('stats');
    const cardContainer = document.getElementById('cardContainer');
    const footer = document.querySelector('footer');

    if (user) {
        // --- NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP ---
        currentUser = user;
        menuContainer.innerHTML = `
            <div id="user-avatar-menu">
                <img id="userAvatar" src="${user.photoURL}" alt="User Avatar" class="avatar-btn" title="Mở menu">
                <div id="userDropdown" class="dropdown-content">
                    <div class="dropdown-header">
                        <img src="${user.photoURL}" alt="User Avatar" class="avatar-in-menu">
                        <div>
                            <strong>${user.displayName}</strong>
                            <span class="email-text">${user.email}</span>
                        </div>
                    </div>
                    <a href="#" id="themeToggleBtn" class="dropdown-item">
                        <!-- Icon và text sẽ được JS cập nhật -->
                    </a>
                    <a href="#" id="logoutBtn" class="dropdown-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                          <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                        </svg>
                        <span>Đăng xuất</span>
                    </a>
                </div>
            </div>
        `;

        document.getElementById('userAvatar').addEventListener('click', toggleUserMenu);
        document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); signOut(); });
        document.getElementById('themeToggleBtn').addEventListener('click', (e) => { e.preventDefault(); toggleTheme(); });
        
        updateThemeButton();

        mainControls.style.display = 'block';
        lessonControls.style.display = 'flex';
        statsContainer.style.display = 'block';
        footer.style.display = 'flex';

        loadDataFromFirebase();

    } else {
        // --- NGƯỜI DÙNG CHƯA ĐĂNG NHẬP ---
        currentUser = null;
        menuContainer.innerHTML = `<button id="loginBtn" class="auth-btn login">🔑 Đăng nhập với Google</button>`;
        document.getElementById('loginBtn').addEventListener('click', signInWithGoogle);
        
        allWords = new Map();
        resetToHome();
        updateLessonDropdown();
        
        mainControls.style.display = 'none';
        lessonControls.style.display = 'none';
        statsContainer.style.display = 'none';
        footer.style.display = 'none';
        
        cardContainer.innerHTML = '<p class="placeholder-text">Vui lòng đăng nhập để bắt đầu học và đồng bộ tiến trình của bạn.</p>';
    }
});

// --- LOGIC ĐIỀU KHIỂN MENU DROPDOWN ---
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

window.onclick = function(event) {
    if (!event.target.matches('.avatar-btn')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

// --- LOGIC LƯU VÀ TẢI DỮ LIỆU VỚI FIRESTORE ---
async function saveDataToFirebase() {
    if (!currentUser) return; 
    const dataToSave = Object.fromEntries(allWords.entries());
    try {
        await db.collection('users').doc(currentUser.uid).set({
            vocabData: dataToSave,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Dữ liệu đã được đồng bộ lên Firebase!');
    } catch (error) {
        console.error("Lỗi khi lưu dữ liệu lên Firebase:", error);
        alert("Không thể đồng bộ dữ liệu. Vui lòng kiểm tra kết nối mạng.");
    }
}

async function loadDataFromFirebase() {
    if (!currentUser) return;
    const docRef = db.collection('users').doc(currentUser.uid);
    try {
        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data().vocabData;
            allWords = new Map(Object.entries(data));
            console.log('Dữ liệu đã được tải từ Firebase.');
        } else {
            console.log('Không tìm thấy dữ liệu cũ, bắt đầu một phiên học mới.');
            allWords = new Map();
        }
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Firebase:", error);
        allWords = new Map();
    }
    updateLessonDropdown();
    resetToHome();
}

// --- LOGIC CHÍNH CỦA ỨNG DỤNG ---
let allWords = new Map();
let currentLesson = null;
let quizMode = "multipleChoice";
let isShowingResult = false;
let currentDirection = "jpToVn";
let sessionWords = [];
let quizQueue = []; // <-- BIẾN MỚI: Hàng đợi câu hỏi cho chế độ Tổng kết và Thử thách
let usedWords = [];
let currentCard = null;
let currentPackageIndex = 0;
const PACKAGE_SIZE = 10;
const BASE_QUIZ_TIMER_DURATION = 6;
const CHAR_PER_SECOND_RATE = 0.5;
let quizTimer = null;
let timerInterval = null;
let isTimedOut = false;

// --- CÁC HÀM TIỆN ÍCH ---

function shuffleArray(array) {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function romajiToHiragana(text) {
    const romajiMap = { 'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お', 'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ', 'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ', 'ta': 'た', 'chi': 'ち', 'tsu': 'tsu', 'te': 'て', 'to': 'と', 'na': 'な', 'ni': 'ni', 'nu': 'ぬ', 'ne': 'ね', 'no': 'no', 'ha': 'ha', 'hi': 'hi', 'fu': 'ふ', 'he': 'he', 'ho': 'ほ', 'ma': 'ま', 'mi': 'mi', 'mu': 'む', 'me': 'め', 'mo': 'も', 'ya': 'ya', 'yu': 'yu', 'yo': 'yo', 'ra': 'ら', 'ri': 'ri', 'ru': 'る', 're': 'れ', 'ro': 'ろ', 'wa': 'わ', 'wo': 'を', 'n': 'ん', 'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご', 'za': 'ざ', 'ji': 'じ', 'zu': 'zu', 'ze': 'ze', 'zo': 'ぞ', 'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど', 'ba': 'ba', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ', 'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ', 'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ', 'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ', 'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ', 'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ', 'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ', 'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ', 'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ', 'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ', 'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ', 'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ', 'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ', '-': 'ー' };
    let result = '';
    text = text.toLowerCase();
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        if (nextChar && 'aiueo'.indexOf(nextChar) < 0 && char === nextChar && char !== 'n') { 
            result += 'っ'; 
            continue; 
        }
        let romaji = text.substr(i, 3);
        if (romajiMap[romaji]) { 
            result += romajiMap[romaji]; 
            i += 2; 
            continue; 
        }
        romaji = text.substr(i, 2);
        if (romajiMap[romaji]) { 
            result += romajiMap[romaji]; 
            i += 1; 
            continue; 
        }
        romaji = text.substr(i, 1);
        if (romajiMap[romaji]) { 
            result += romajiMap[romaji]; 
        }
        else { 
            result += romaji; 
        }
    }
    return result;
}

function cleanJapaneseTerm(rawTerm) {
    if (!rawTerm) return '';

    let prefix = '';
    let mainPart = rawTerm.trim();

    const bracketMatch = mainPart.match(/^(\[.*?\]\s*)/);
    if (bracketMatch) {
        prefix = bracketMatch[1];
        mainPart = mainPart.substring(prefix.length).trim();
    }

    const parts = mainPart.split(/\s+/).filter(p => p);
    const politeForm = parts.find(p => p.endsWith('ます'));

    if (politeForm) {
        return (prefix + politeForm).trim();
    } else {
        const filteredParts = parts.filter(p => !/^(I|II|III)$/.test(p.trim()));
        return (prefix + filteredParts.join(' ')).trim();
    }
}


// --- XỬ LÝ FILE VÀ LOGIC HỌC ---

const LESSON_COLUMN = 0, JP_WORD_COLUMN = 2, KANJI_COLUMN = 3, VN_WORD_COLUMN = 4;
const JP_DUMMY_COLUMNS = [9, 10, 11], VN_DUMMY_COLUMNS = [12, 13, 14];

document.getElementById('excelFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        allWords = new Map();
        jsonData.slice(1).forEach(row => {
            const lesson = (row[LESSON_COLUMN]?.toString() || '0').trim();
            const rawTerm = (row[JP_WORD_COLUMN] || '').trim();
            const term = cleanJapaneseTerm(rawTerm);
            const kanji = (row[KANJI_COLUMN] || '').trim();
            const meaning = (row[VN_WORD_COLUMN] || '').trim();

            if (!lesson || !term || !meaning) return;

            const vocab = { 
                term, kanji, meaning, lesson, mastered: false,
                srs: { jpToVn: 0, vnToJp: 0 },
                jpDummies: JP_DUMMY_COLUMNS.map(col => (row[col] || '').trim()).filter(d => d !== ''),
                vnDummies: VN_DUMMY_COLUMNS.map(col => (row[col] || '').trim()).filter(d => d !== '')
            };
            if (!allWords.has(lesson)) allWords.set(lesson, []);
            allWords.get(lesson).push(vocab);
        });
        updateLessonDropdown();
        saveDataToFirebase();
        resetToHome();
        console.log('Dữ liệu từ Excel đã được tải và xử lý.', allWords);
    };
    reader.readAsArrayBuffer(file);
});

function updateLessonDropdown() {
    const lessonSelect = document.getElementById('lessonSelect');
    const currentSelectedValue = lessonSelect.value;
    lessonSelect.innerHTML = `<option value="">-- Chọn bài học --</option>`;
    
    const masteredWords = getMasteredWords();
    const summaryOption = document.createElement('option');
    summaryOption.value = 'summary';
    summaryOption.textContent = `📚 Tổng Kết (${masteredWords.length} từ đã thuộc)`;
    lessonSelect.appendChild(summaryOption);
    
    if (allWords && allWords.size > 0) {
        const sortedLessons = Array.from(allWords.keys()).sort((a, b) => parseInt(a) - parseInt(b));

        sortedLessons.forEach(lesson => {
            const wordsInLesson = allWords.get(lesson) || [];
            const total = wordsInLesson.length;
            if (total === 0) return;
            const mastered = wordsInLesson.filter(word => word.mastered).length;
            
            const option = document.createElement('option');
            option.value = lesson;
            let text = `Bài ${lesson} (${mastered}/${total})`;
            if (mastered === total) { text += ' ✓'; }
            option.textContent = text;
            lessonSelect.appendChild(option);
        });
        lessonSelect.value = currentSelectedValue;
        lessonSelect.disabled = false;
    } else {
        lessonSelect.disabled = true;
    }
}

function displayPackageSelection(lesson) {
    clearTimeout(quizTimer);
    clearInterval(timerInterval);
    const wordsInLesson = allWords.get(lesson) || [];
    const totalWords = wordsInLesson.length;

    document.getElementById('cardContainer').innerHTML = '';
    if (totalWords === 0) {
        document.getElementById('cardContainer').innerHTML = '<p>Bài học này không có từ vựng.</p>';
        return;
    }
    const numPackages = Math.ceil(totalWords / PACKAGE_SIZE);
    let packageHtml = `<h3 class="package-title">Chọn gói từ vựng cho Bài ${lesson}</h3><div class="package-container">`;
    for (let i = 0; i < numPackages; i++) {
        const startWordIndex = i * PACKAGE_SIZE;
        const currentEndIndex = Math.min(startWordIndex + PACKAGE_SIZE, totalWords); 
        const packageWords = wordsInLesson.slice(startWordIndex, currentEndIndex);
        const masteredInPackage = packageWords.filter(w => w.mastered).length;
        const isCompleted = masteredInPackage === packageWords.length;
        packageHtml += `
            <button class="package-btn ${isCompleted ? 'completed' : ''}" onclick="startPackage('${lesson}', ${i})">
                <div class="package-btn-name">Gói ${i + 1} <small>(Từ ${startWordIndex + 1} - ${currentEndIndex})</small></div>
                <div class="package-btn-progress">
                    <span class="progress-text">${masteredInPackage} / ${packageWords.length}</span>
                    ${isCompleted ? '<span class="completed-check">✓</span>' : ''}
                </div>
            </button>`;
    }
    packageHtml += '</div>';

    const allMasteredInLesson = wordsInLesson.every(word => word.mastered);
    if (allMasteredInLesson && totalWords > 0) {
        packageHtml += `
            <div class="infinite-challenge-section">
                <button class="action-btn" onclick="startInfiniteChallenge('${lesson}')">
                    ⚡ Thử thách vô hạn Bài ${lesson}
                </button>
            </div>`;
    }

    document.getElementById('cardContainer').innerHTML = packageHtml;
}

function startPackage(lesson, packageIndex) {
    currentLesson = lesson;
    currentPackageIndex = packageIndex;
    const wordsInLesson = allWords.get(lesson) || [];
    const startIndex = packageIndex * PACKAGE_SIZE;
    const endIndex = startIndex + PACKAGE_SIZE;
    sessionWords = wordsInLesson.slice(startIndex, endIndex);
    quizQueue = []; // Xóa hàng đợi cũ
    usedWords = [];
    showNextCard();
    updateBackButton();
}

function startInfiniteChallenge(lessonNum) {
    currentLesson = `infinite_challenge_${lessonNum}`;
    sessionWords = allWords.get(lessonNum) || [];
    usedWords = [];

    if (sessionWords.length === 0) {
        document.getElementById('cardContainer').innerHTML = `<p class="placeholder-text">Bài ${lessonNum} không có từ vựng để thử thách vô hạn.</p>`;
        return;
    }
    
    // **THAY ĐỔI**: Tạo hàng đợi câu hỏi ban đầu
    quizQueue = shuffleArray([...sessionWords]);

    showNextCard();
    updateBackButton();
    updateStats();
}


function updateSRS(card, isCorrect, directionKey) {
    if (isCorrect) {
        if (card.srs[directionKey] < 3) card.srs[directionKey]++;
    } else {
        card.srs.jpToVn = 0;
        card.srs.vnToJp = 0;
    }
    card.mastered = card.srs.jpToVn >= 3 && card.srs.vnToJp >= 3;
    saveDataToFirebase();
}

function showNextCard() {
    isShowingResult = false;
    isTimedOut = false; 
    clearTimeout(quizTimer);
    clearInterval(timerInterval);

    const container = document.getElementById('cardContainer');
    let availableWords;

    // **THAY ĐỔI**: Logic mới cho chế độ Tổng kết và Thử thách vô hạn
    if (currentLesson === 'summary' || currentLesson.startsWith('infinite_challenge_')) {
        // Nếu hàng đợi rỗng, tạo lại một vòng mới
        if (!quizQueue || quizQueue.length === 0) {
            // Nếu không còn từ nào trong phiên (ví dụ: mục tổng kết bị trả lời sai hết)
            if (sessionWords.length === 0) {
                 container.innerHTML = `<p class="placeholder-text">🎉 Bạn đã ôn tập hết các từ trong phiên này.</p>`;
                 return;
            }
            console.log("Hết vòng! Xáo trộn và bắt đầu lại...");
            container.innerHTML = `<div class="card result-feedback"><p class="feedback-correct">🎉 Hết vòng! Bắt đầu lại...</p></div>`;
            quizQueue = shuffleArray([...sessionWords]);
            setTimeout(() => showNextCard(), 1500); // Chờ một chút rồi hiển thị thẻ mới
            return;
        }
        
        // Lấy từ tiếp theo từ hàng đợi
        currentCard = quizQueue.shift();

    } else { // Logic cũ cho chế độ học theo gói
        if (!sessionWords || sessionWords.length === 0) return;

        const allMasteredInPackage = sessionWords.every(word => word.mastered);
        if (allMasteredInPackage) {
            const totalWordsInLesson = (allWords.get(currentLesson) || []).length;
            const totalPackages = Math.ceil(totalWordsInLesson / PACKAGE_SIZE);
            let completionHtml = `<div class="card result-feedback"><p class="feedback-correct">🎉 Chúc mừng! Bạn đã hoàn thành Gói ${currentPackageIndex + 1}.</p>`;
            if (currentPackageIndex + 1 < totalPackages) {
                completionHtml += `<button class="action-btn" onclick="startPackage('${currentLesson}', ${currentPackageIndex + 1})">Học Gói tiếp theo</button>`;
            } else {
                completionHtml += `<p>Bạn đã hoàn thành tất cả các gói cho Bài ${currentLesson}!</p>`;
            }
            completionHtml += `<button class="back-button" onclick="displayPackageSelection('${currentLesson}')">Quay lại chọn gói</button></div>`;
            container.innerHTML = completionHtml;
            updateStats();
            return;
        }
        availableWords = sessionWords.filter(word => !word.mastered && !usedWords.slice(-3).includes(word));
        if (availableWords.length === 0) {
            usedWords = [];
            availableWords = sessionWords.filter(word => !word.mastered);
        }
        
        if (!availableWords || availableWords.length === 0) {
            displayPackageSelection(currentLesson);
            return;
        }

        currentCard = availableWords[Math.floor(Math.random() * availableWords.length)];
        usedWords.push(currentCard);
    }
    
    // Phần hiển thị thẻ không đổi
    if (quizMode === "input") {
        showInputCard(currentCard);
    } else {
        showMultipleChoiceCard(currentCard);
        const termToMeasure = currentCard.kanji ? `${currentCard.term} (${currentCard.kanji})` : currentCard.term;
        const dynamicQuizDuration = BASE_QUIZ_TIMER_DURATION + Math.max(0, termToMeasure.length - 4) * CHAR_PER_SECOND_RATE;
        
        const directionKey = currentDirection === 'vnToJp' ? 'vnToJp' : 'jpToVn';
        quizTimer = setTimeout(() => {
            isTimedOut = true;
            updateSRS(currentCard, false, directionKey);
        }, dynamicQuizDuration * 1000);
    }
}


function showMultipleChoiceCard(card) {
    let isReverse;
    const { jpToVn, vnToJp } = card.srs;
    const needsJpVn = jpToVn < 3;
    const needsVnJp = vnToJp < 3;
    
    if (needsJpVn && needsVnJp) {
        isReverse = Math.random() < 0.5;
    } else if (needsVnJp) {
        isReverse = true;
    } else {
        isReverse = false;
    }

    const displayText = isReverse ? card.meaning : (card.kanji ? `${card.term} (${card.kanji})` : card.term);
    const correctAnswer = isReverse ? (card.kanji ? `${card.term} (${card.kanji})` : card.term) : card.meaning;
    const choices = generateChoices(isReverse, card);
    const statusTag = card.mastered ? '<span class="mastered-tag">✓ Đã thuộc</span>' : (jpToVn > 0 || vnToJp > 0 ? '<span class="review-tag">⏳ Đang học...</span>' : '');
    
    document.getElementById('cardContainer').innerHTML = `
        <div class="card">
            <h2>${displayText} ${statusTag}</h2>
            <div class="choices-container">${choices.map(choice => `<button class="choice-btn" onclick="handleChoiceClick(this, '${choice.replace(/'/g, "\\'")}', '${correctAnswer.replace(/'/g, "\\'")}', ${isReverse})">${choice}</button>`).join('')}</div>
            <div id="keyGuide">Bấm phím số 1-4 để chọn</div>
        </div>`;
}

function generateChoices(isReverse, currentCard) {
    const correctAnswer = isReverse
        ? (currentCard.kanji ? `${currentCard.term} (${currentCard.kanji})` : currentCard.term)
        : currentCard.meaning;
        
    const allPossibleWords = (allWords && allWords.size > 0) ? Array.from(allWords.values()).flat() : [];
    let choices = [correctAnswer];
    const uniqueAnswers = new Set(choices);

    const currentDummies = isReverse ? currentCard.jpDummies : currentCard.vnDummies;
    currentDummies.forEach(dummy => {
        if (choices.length >= 4) return;
        let processedDummy = dummy;
        if (isReverse) {
            const kanjiData = allPossibleWords.find(w => w.term === dummy);
            if (kanjiData && kanjiData.kanji) {
                processedDummy = `${dummy} (${kanjiData.kanji})`;
            }
        }
        if (!uniqueAnswers.has(processedDummy)) {
            choices.push(processedDummy);
            uniqueAnswers.add(processedDummy);
        }
    });

    const otherWords = allPossibleWords.filter(word => word.term !== currentCard.term);
    shuffleArray(otherWords);

    while (choices.length < 4 && otherWords.length > 0) {
        const word = otherWords.pop();
        const candidate = isReverse
            ? (word.kanji ? `${word.term} (${word.kanji})` : word.term)
            : word.meaning;

        if (!uniqueAnswers.has(candidate)) {
            choices.push(candidate);
            uniqueAnswers.add(candidate);
        }
    }
    
    return shuffleArray(choices);
}

function handleChoiceClick(button, selectedValue, correctAnswer, isReverse) {
    if (isShowingResult) return;
    clearTimeout(quizTimer);
    clearInterval(timerInterval);
    isShowingResult = true;

    const isCorrectAttempt = selectedValue === correctAnswer;
    const directionKey = isReverse ? 'vnToJp' : 'jpToVn';

    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent.trim() === correctAnswer) btn.classList.add('correct');
    });
    if (!isCorrectAttempt) button.classList.add('incorrect');

    if (!isTimedOut) { 
        updateSRS(currentCard, isCorrectAttempt, directionKey);
    } 

    let delayBeforeNextAction = 1000;

    // **THAY ĐỔI**: Logic khi trả lời sai trong mục Tổng kết
    if (currentLesson === 'summary' && !isCorrectAttempt) { 
        const originalLesson = currentCard.lesson;
        // Xóa từ khỏi phiên tổng kết hiện tại
        sessionWords = sessionWords.filter(word => word.term !== currentCard.term); 
        // Không cần xóa khỏi quizQueue vì nó sẽ được tạo lại từ sessionWords ở vòng sau
        
        setTimeout(() => {
            document.getElementById('cardContainer').innerHTML = `<div class="card result-feedback"><p class="feedback-incorrect">🔴 Trả lời sai!</p><p>Từ này đã được chuyển về <strong>Bài ${originalLesson}</strong> để ôn tập lại.</p></div>`;
            setTimeout(() => { showNextCard(); updateStats(); updateLessonDropdown(); }, 2500);
        }, 1500);
        return; 
    } else if (!isCorrectAttempt) { 
        delayBeforeNextAction = 2000;
    }

    setTimeout(() => {
        if (isCorrectAttempt) { 
            showNextCard();
        } else { 
            isShowingResult = false; 
            if (quizMode === 'input') {
                showInputCard(currentCard);
            } else {
                showMultipleChoiceCard(currentCard);
            }
        }
        updateStats(); 
        updateLessonDropdown(); 
    }, delayBeforeNextAction);
}

function showInputCard(card) {
    const isReverse = currentDirection === 'vnToJp';
    const displayText = isReverse ? card.meaning : (card.kanji ? `${card.term} (${card.kanji})` : card.term);
    const placeholder = isReverse ? "Nhập tiếng Nhật..." : "Nhập nghĩa tiếng Việt...";
    const correctAnswer = isReverse ? card.term : card.meaning;
    const statusTag = card.mastered ? '<span class="mastered-tag">✓ Đã thuộc</span>' : (card.srs.jpToVn > 0 || card.srs.vnToJp > 0 ? '<span class="review-tag">⏳ Đang học...</span>' : '');
    
    document.getElementById('cardContainer').innerHTML = `
        <div class="card">
            <h2>${displayText} ${statusTag}</h2>
            <input type="text" id="answerInput" onkeypress="handleKeyPress(event, '${correctAnswer.replace(/'/g, "\\'")}')" placeholder="${placeholder}" autocomplete="off" autocapitalize="off">
            <button onclick="checkAnswer('${correctAnswer.replace(/'/g, "\\'")}')">Kiểm tra</button>
        </div>`;
    setTimeout(() => document.getElementById('answerInput')?.focus(), 50);
}

function checkAnswer(correctAnswer) {
    if (isShowingResult) return;
    isShowingResult = true;
    const inputField = document.getElementById('answerInput');
    let userAnswer = inputField.value.trim();
    let isCorrect = false;
    const directionKey = currentDirection === 'vnToJp' ? 'vnToJp' : 'jpToVn';
    if (directionKey === 'vnToJp') {
        isCorrect = (romajiToHiragana(userAnswer) === correctAnswer);
    } else {
        isCorrect = (userAnswer.toLowerCase() === correctAnswer.toLowerCase());
    }
    updateSRS(currentCard, isCorrect, directionKey);
    inputField.disabled = true;
    inputField.nextElementSibling.disabled = true;
    inputField.style.background = isCorrect ? 'var(--success-color)' : 'var(--error-color)';
    if (isCorrect) {
        setTimeout(() => { showNextCard(); updateStats(); updateLessonDropdown(); }, 1000);
    } else {
        setTimeout(() => {
            document.getElementById('cardContainer').innerHTML = `<div class="card result-feedback"><p class="feedback-incorrect">🔴 Trả lời sai!</p><p>Đáp án đúng là: <strong>${correctAnswer}</strong></p></div>`;
            setTimeout(() => { 
                isShowingResult = false; 
                if (quizMode === 'input') showInputCard(currentCard); else showMultipleChoiceCard(currentCard);
                updateStats(); updateLessonDropdown();
            }, 2500);
        }, 1500);
    }
}

function updateStats() {
    let wordsForStats = [];
    let title = "Tổng quan";
    if (allWords && allWords.size > 0) {
        if (currentLesson && currentLesson !== 'summary' && !currentLesson.startsWith('infinite_challenge_')) {
            wordsForStats = allWords.get(currentLesson) || [];
            title = `Bài ${currentLesson}`;
        } else if (currentLesson && currentLesson.startsWith('infinite_challenge_')) {
            const lessonNum = currentLesson.split('_')[2];
            wordsForStats = allWords.get(lessonNum) || [];
            title = `Thử thách vô hạn Bài ${lessonNum}`;
        }
        else {
            wordsForStats = Array.from(allWords.values()).flat();
        }
    }
    
    const statsHeader = document.querySelector('#stats h3');
    if (statsHeader) statsHeader.textContent = `📊 Thống kê (${title})`;
    const total = wordsForStats.length;
    const learned = wordsForStats.filter(word => word.mastered).length;
    const learning = wordsForStats.filter(word => !word.mastered && (word.srs.jpToVn > 0 || word.srs.vnToJp > 0)).length;
    const newWords = total - learned - learning;
    document.getElementById("totalWords").textContent = total;
    document.getElementById("learnedWords").textContent = learned;
    document.getElementById("learningWords").textContent = learning; 
    document.getElementById("newWords").textContent = newWords;
}

function getMasteredWords() {
    if (!allWords || allWords.size === 0) return [];
    return Array.from(allWords.values()).flat().filter(word => word.mastered);
}

function handleKeyPress(e, correctAnswer) {
    if (e.key === 'Enter') {
        e.preventDefault();
        checkAnswer(correctAnswer);
    }
}

document.addEventListener('keydown', (e) => {
    if (!isShowingResult && quizMode === 'multipleChoice' && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        const buttons = document.querySelectorAll('.choice-btn');
        if (buttons.length > index) buttons[index].click();
    }
});

function initSessionForSummary() {
    currentLesson = 'summary';
    sessionWords = getMasteredWords();
    usedWords = [];
    updateBackButton();
    if (sessionWords.length === 0) {
        document.getElementById('cardContainer').innerHTML = '<p class="placeholder-text">Chưa có từ nào được học thuộc để tổng kết.</p>';
        return;
    }
    
    // **THAY ĐỔI**: Tạo hàng đợi câu hỏi ban đầu
    quizQueue = shuffleArray([...sessionWords]);

    showNextCard();
}

function onLessonChange() {
    clearTimeout(quizTimer);
    clearInterval(timerInterval);
    currentPackageIndex = 0;
    sessionWords = [];
    quizQueue = []; // Xóa hàng đợi khi đổi bài

    const selectedValue = document.getElementById('lessonSelect').value;
    
    if (selectedValue && selectedValue !== 'summary') {
        currentLesson = selectedValue;
        displayPackageSelection(currentLesson);
    } else if (selectedValue === 'summary') {
        initSessionForSummary();
    } else {
        resetToHome();
    }
    updateBackButton();
    updateStats();
}

function onQuizModeChange() {
    quizMode = document.getElementById('quizMode').value;
    document.getElementById('direction').style.display = quizMode === "input" ? "inline-block" : "none";
    if (sessionWords.length > 0 || quizQueue.length > 0) showNextCard();
}

function onDirectionChange() {
    currentDirection = document.getElementById('direction').value;
    if (sessionWords.length > 0 || quizQueue.length > 0) showNextCard();
}

function updateBackButton() {
    const container = document.getElementById('backButtonContainer');
    if (currentLesson && currentLesson !== 'summary' && !currentLesson.startsWith('infinite_challenge_') && sessionWords.length > 0) {
        container.innerHTML = `<button class="back-button" onclick="displayPackageSelection('${currentLesson}')">← Quay lại chọn gói</button>`;
    } else if (currentLesson) {
        container.innerHTML = `<button class="back-button" onclick="resetToHome()">← Quay lại danh sách bài</button>`;
    } else {
        container.innerHTML = '';
    }
}

function resetToHome() {
    clearTimeout(quizTimer);
    clearInterval(timerInterval);
    document.getElementById('lessonSelect').value = '';
    currentLesson = null;
    sessionWords = [];
    quizQueue = [];
    updateBackButton();
    if (currentUser) {
        document.getElementById('cardContainer').innerHTML = '<p class="placeholder-text">Vui lòng chọn một bài học để bắt đầu.</p>';
    }
    updateStats();
}

function exportData() {
    if (!allWords || allWords.size === 0) return alert('Không có dữ liệu để xuất!');
    const dataToExport = JSON.stringify(Array.from(allWords.entries()));
    const blob = new Blob([dataToExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData)) throw new Error("Invalid format");
            allWords = new Map(importedData);
            for(const words of allWords.values()){
                words.forEach(word => {
                    if(!word.srs) {
                        word.srs = { jpToVn: 0, vnToJp: 0 };
                        if (word.mastered) {
                            word.srs.jpToVn = 3;
                            word.srs.vnToJp = 3;
                        }
                    }
                    delete word.repetitions;
                });
            }
            saveDataToFirebase();
            updateLessonDropdown();
            resetToHome();
            alert('Nhập dữ liệu thành công! Dữ liệu của bạn đang được đồng bộ hóa.');
        } catch (error) {
            alert('File không hợp lệ!');
            console.error(error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// --- LOGIC GIAO DIỆN (THEME) ---
function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
    updateThemeButton();
}

function updateThemeButton() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (!themeToggleBtn) return;

    const currentTheme = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    if (currentTheme === 'dark') {
        themeToggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="bi bi-sun-fill">
              <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
            </svg>
            <span>Giao diện Sáng</span>
        `;
    } else {
        themeToggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="bi bi-moon-stars-fill">
              <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
              <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162h1.212a.217.217 0 0 1 .134.386l-.979.713.387 1.162a.217.217 0 0 1-.316.242l-.979-.712-1.03.752a.217.217 0 0 1-.316-.242l.387-1.162-.979-.713a.217.217 0 0 1 .134-.386h1.212l.387-1.162zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a.715.715 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a.715.715 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774.258c.346-.115.617-.386.732-.732L13.863.1z"/>
            </svg>
            <span>Giao diện Tối</span>
        `;
    }
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme(prefersDark ? 'dark' : 'light');
    }
}

window.onload = () => {
    initTheme();
    onQuizModeChange();
    console.log('Ứng dụng đã sẵn sàng. Chờ trạng thái đăng nhập...');
};

// CSS được nhúng
const style = document.createElement('style');
style.textContent = `
:root {
    --font-body: 'Noto Sans JP', sans-serif; --font-heading: 'Montserrat', sans-serif;
    --success-color: #28a745; --error-color: #dc3545; --warning-color: #ffc107;
}
body[data-theme='light'] {
    --primary-gradient: linear-gradient(135deg, #2575fc 0%, #6a11cb 100%);
    --bg-main: #f4f7f9; --bg-content: #ffffff; --bg-card: rgba(255, 255, 255, 0.8);
    --border-color: #e0e6ed; --text-primary: #1e1e1e; --text-secondary: #5a6268;
    --text-accent: #0056b3; --shadow-light: rgba(0, 0, 0, 0.1); --shadow-heavy: rgba(0, 0, 0, 0.15);
    --bg-dropdown: #ffffff;
}
body[data-theme='dark'] {
    --primary-gradient: linear-gradient(135deg, #82aaff 0%, #2575fc 100%);
    --bg-main: #121212; --bg-content: #1e1e1e; --bg-card: rgba(42, 42, 62, 0.7);
    --border-color: rgba(255, 255, 255, 0.15); --text-primary: #ffffff; --text-secondary: #a0a0b0;
    --text-accent: #82aaff; --shadow-light: rgba(0, 0, 0, 0.2); --shadow-heavy: rgba(0, 0, 0, 0.4);
    --bg-dropdown: #2c2c3e;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-body); background-color: var(--bg-main); color: var(--text-primary); line-height: 1.6; padding: 15px; transition: background-color 0.3s, color 0.3s; }
.container { max-width: 700px; margin: 0 auto; padding: 20px; background: var(--bg-content); border-radius: 24px; border: 1px solid var(--border-color); box-shadow: 0 16px 40px var(--shadow-heavy); transition: background-color 0.3s, border-color 0.3s; }
header { text-align: center; margin-bottom: 25px; }
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
h1 { font-family: var(--font-heading); font-weight: 700; color: var(--text-primary); font-size: 1.8rem; }
header p { color: var(--text-secondary); }

/* --- CSS CHO MENU --- */
#user-menu-container { position: relative; }
.auth-btn.login { padding: 8px 16px; border-radius: 20px; border: none; font-weight: 700; cursor: pointer; transition: all 0.3s ease; background: var(--primary-gradient); color: white; }
.avatar-btn { width: 40px; height: 40px; border-radius: 50%; cursor: pointer; border: 2px solid var(--border-color); transition: transform 0.2s ease, box-shadow 0.2s ease; object-fit: cover; }
.avatar-btn:hover { transform: scale(1.1); box-shadow: 0 0 10px var(--text-accent); }
.dropdown-content { position: absolute; top: 50px; right: 0; background-color: var(--bg-dropdown); min-width: 220px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); border-radius: 12px; z-index: 1; border: 1px solid var(--border-color);
    visibility: hidden; opacity: 0; transform: translateY(-10px); transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s; }
.dropdown-content.show { visibility: visible; opacity: 1; transform: translateY(0); }
.dropdown-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border-color); }
.dropdown-header strong { font-size: 14px; }
.email-text { font-size: 12px; color: var(--text-secondary); word-break: break-all; }
.avatar-in-menu { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.dropdown-item { color: var(--text-primary); padding: 12px 16px; text-decoration: none; display: flex; align-items: center; gap: 12px; font-size: 14px; text-align: left; cursor: pointer; }
.dropdown-item:hover { background-color: rgba(128, 128, 128, 0.1); }
.dropdown-content > a:first-of-type:hover { border-radius: 12px 12px 0 0; }
.dropdown-item:last-of-type { border-top: 1px solid var(--border-color); }
.dropdown-item:last-of-type:hover { border-radius: 0 0 12px 12px; }
.dropdown-item svg { color: var(--text-secondary); min-width: 16px; }
/* --- KẾT THÚC CSS MENU --- */

h3 { font-family: var(--font-heading); font-weight: 700; margin-bottom: 15px; text-align: center; color: var(--text-accent); }
.main-controls { text-align: center; margin-bottom: 20px; }
.file-label { display: inline-block; padding: 12px 25px; background: var(--primary-gradient); color: white; border-radius: 8px; cursor: pointer; font-weight: 700; font-family: var(--font-heading); transition: all 0.3s ease; box-shadow: 0 4px 15px var(--shadow-light); }
.file-label:hover { transform: translateY(-3px) scale(1.05); }
.file-input { display: none; }
.lesson-controls { display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap; }
select { flex-grow: 1; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background-color: var(--bg-content); color: var(--text-primary); font-family: var(--font-body); font-size: 16px; cursor: pointer; min-width: 150px; transition: background-color 0.3s, border-color 0.3s, color 0.3s; }
select:focus { outline: 2px solid var(--text-accent); }
#stats { background: var(--bg-main); border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid var(--border-color); transition: background-color 0.3s, border-color 0.3s; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; text-align: center; }
.stat-item .stat-label { font-size: 14px; color: var(--text-secondary); }
.stat-item .stat-value { font-size: 24px; font-weight: 700; color: var(--text-accent); }
#learnedWords { color: var(--success-color); }
#learningWords { color: var(--warning-color); }
.card { background: var(--bg-card); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--border-color); padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px var(--shadow-light); text-align: center; position: relative; overflow: hidden; transition: background-color 0.3s, border-color 0.3s; }
.card h2 { font-size: clamp(1.8rem, 5vw, 2.5rem); font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 5px 15px;}
#answerInput { width: 100%; padding: 12px; font-size: 18px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-main); color: var(--text-primary); margin: 20px 0; text-align: center; transition: background-color 0.3s, border-color 0.3s, color 0.3s;}
#answerInput::placeholder { color: var(--text-secondary); }
#answerInput:focus { border-color: var(--text-accent); outline: none; }
.choices-container { display: grid; grid-template-columns: 1fr; gap: 12px; margin: 20px 0; }
.choice-btn { padding: 15px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: 500; text-align: center; transition: all 0.2s ease; }
.choice-btn:hover:not(:disabled) { transform: translateY(-3px); background: rgba(255, 255, 255, 0.1); color: var(--text-primary); border-color: var(--text-accent); }
.choice-btn.correct { background: var(--success-color) !important; color: white !important; border-color: var(--success-color) !important; }
.choice-btn.incorrect { background: var(--error-color) !important; color: white !important; border-color: var(--error-color) !important; }
#keyGuide { font-size: 14px; color: var(--text-secondary); margin-top: 15px; }
.package-title { margin-bottom: 20px; }
.package-container { display: flex; flex-direction: column; gap: 10px; }
.package-btn { display: flex; justify-content: space-between; align-items: center; padding: 15px; text-align: left; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 1em; color: var(--text-secondary); }
.package-btn:hover { transform: translateY(-3px); background: rgba(255, 255, 255, 0.1); color: var(--text-primary); border-color: var(--text-accent); }
.package-btn.completed { border-left: 5px solid var(--success-color); background: rgba(40, 167, 69, 0.1); color: var(--text-primary); }
.package-btn-name { color: var(--text-primary); }
.completed-check { color: var(--success-color); }
footer { padding-top: 20px; border-top: 1px solid var(--border-color); display: flex; gap: 15px; justify-content: center; }
.footer-btn { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 8px 15px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; }
.footer-btn:hover { background: var(--bg-card); color: var(--text-primary); }
.back-button, .action-btn { width: 100%; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; border: none; }
.back-button { background: rgba(108, 117, 125, 0.5); color: var(--text-primary); }
.action-btn { background: var(--primary-gradient); color: white; margin-top: 15px; }
.action-btn:hover { transform: scale(1.02); opacity: 0.9; }
.mastered-tag { color: var(--success-color); }
.review-tag { color: var(--text-accent); }
.mastered-tag, .review-tag { font-size: 0.8rem; vertical-align: middle; font-family: var(--font-heading); }
.placeholder-text { text-align: center; color: var(--text-secondary); padding: 40px 20px; }
.infinite-challenge-section { margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border-color); text-align: center; }
.card.result-feedback { text-align: center; }
.feedback-correct { font-size: 1.2rem; font-weight: bold; color: var(--success-color); }
.feedback-incorrect { font-size: 1.2rem; font-weight: bold; color: var(--error-color); }
@media (max-width: 600px) {
    body { padding: 5px; }
    .container { padding: 15px; }
    .header-top { flex-wrap: wrap; justify-content: center; gap: 15px; }
    #user-menu-container { order: -1; flex-basis: 100%; text-align: right; }
    .card h2 { font-size: 1.8rem; }
    .choice-btn, #answerInput { font-size: 16px; }
    .lesson-controls { flex-direction: column; }
    .header-top h1 { font-size: 1.5rem; }
}
/* Định dạng cho vùng chứa nút để căn lề trái và tạo khoảng cách */
.header-nav { 
    text-align: left; 
    margin-bottom: 15px; 
}

/* Định dạng cho chính liên kết "Quay lại trang chủ" */
.back-to-home { 
    text-decoration: none;      /* Bỏ gạch chân mặc định của liên kết */
    color: var(--text-accent);  /* Dùng màu nhấn của theme (xanh dương hoặc sáng hơn) */
    font-weight: 500;           /* Độ đậm vừa phải */
    font-size: 14px;            /* Cỡ chữ nhỏ */
    transition: color 0.2s ease;/* Hiệu ứng chuyển màu mượt mà */
}

/* Định dạng khi người dùng di chuột qua liên kết */
.back-to-home:hover { 
    color: var(--text-primary); /* Đổi sang màu chữ chính của theme */
    text-decoration: underline; /* Thêm lại gạch chân để báo hiệu có thể nhấn */
}
`;
document.head.appendChild(style);
