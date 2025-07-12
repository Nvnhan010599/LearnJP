// --- LOGIC CHÍNH CỦA ỨNG DỤNG ---

let allWords = new Map();
let currentLesson = null;
let quizMode = "multipleChoice";
let isShowingResult = false;
let currentDirection = "jpToVn";
let sessionWords = [];
let usedWords = [];
let currentCard = null;

let currentPackageIndex = 0;
const PACKAGE_SIZE = 10; 
const BASE_QUIZ_TIMER_DURATION = 6; // Thời gian cơ bản
const CHAR_PER_SECOND_RATE = 0.5; // Tốc độ tăng thời gian theo ký tự

let quizTimer = null;
let timerInterval = null; // Biến này không còn được dùng cho hiển thị, nhưng giữ lại để clear
let isTimedOut = false; // Biến cờ để theo dõi trạng thái hết giờ ẩn
// let skipNextQuestionSpeech = false; // Cờ này không còn cần thiết khi bỏ tính năng phát âm

// BỔ SUNG: Hàm phát âm thanh sử dụng Web Speech API (ĐÃ BỊ LOẠI BỎ)
/*
function speakText(text, applySplitLogic = true) { 
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            console.warn('Rất tiếc, trình duyệt của bạn không hỗ trợ tính năng phát âm thanh.');
            resolve(); 
            return;
        }

        window.speechSynthesis.cancel(); 

        let partsToSpeak = [text]; 
        if (applySplitLogic) {
            partsToSpeak = text.split(/(I|II|III)/); 
        }
        
        let currentPartIndex = 0;

        const speakNextPart = () => {
            if (currentPartIndex >= partsToSpeak.length) {
                resolve(); 
                return;
            }

            const part = partsToSpeak[currentPartIndex].trim();

            if (applySplitLogic && (part === 'I' || part === 'II' || part === 'III')) {
                currentPartIndex++; 
                setTimeout(() => {
                    speakNextPart(); 
                }, 2000); 
            } else if (part) {
                const utterance = new SpeechSynthesisUtterance(part);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.9;

                utterance.onend = () => {
                    currentPartIndex++;
                    speakNextPart(); 
                };
                utterance.onerror = (event) => {
                    console.error('SpeechSynthesisUtterance.onerror', event);
                    reject(event); 
                };

                window.speechSynthesis.speak(utterance);
            } else {
                currentPartIndex++;
                speakNextPart();
            }
        };

        speakNextPart(); 
    });
}
*/

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
    // Đã sửa các ký tự Hiragana bị sai chính tả
    const romajiMap = { 'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お', 'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ', 'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ', 'ta': 'た', 'chi': 'ち', 'tsu': 'tsu', 'te': 'て', 'to': 'と', 'na': 'な', 'ni': 'ni', 'nu': 'ぬ', 'ne': 'ね', 'no': 'no', 'ha': 'ha', 'hi': 'hi', 'fu': 'ふ', 'he': 'he', 'ho': 'ほ', 'ma': 'ま', 'mi': 'mi', 'mu': 'む', 'me': 'め', 'mo': 'も', 'ya': 'ya', 'yu': 'yu', 'yo': 'yo', 'ra': 'ら', 'ri': 'ri', 'ru': 'る', 're': 'れ', 'ro': 'ろ', 'wa': 'わ', 'wo': 'を', 'n': 'ん', 'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご', 'za': 'ざ', 'ji': 'じ', 'zu': 'zu', 'ze': 'ze', 'zo': 'ぞ', 'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど', 'ba': 'ba', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ', 'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ', 'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ', 'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ', 'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ', 'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ', 'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ', 'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ', 'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ', 'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ', 'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ', 'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ', 'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ', '-': 'ー' };
    let result = '';
    text = text.toLowerCase();
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        // Xử lý âm ngắt 'っ'
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
            const term = (row[JP_WORD_COLUMN] || '').trim();
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
        localStorage.setItem('vocabData', JSON.stringify(Array.from(allWords.entries())));
        resetToHome();
        console.log('Dữ liệu từ Excel đã được tải và lưu vào allWords:', allWords);
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
}

function displayPackageSelection(lesson) {
    console.log('Đang hiển thị gói từ vựng cho bài:', lesson);
    clearTimeout(quizTimer);
    clearInterval(timerInterval);
    const wordsInLesson = allWords.get(lesson) || [];
    const totalWords = wordsInLesson.length;
    console.log('Tổng số từ trong bài này:', totalWords);

    document.getElementById('cardContainer').innerHTML = '';
    if (totalWords === 0) {
        document.getElementById('cardContainer').innerHTML = '<p>Bài học này không có từ vựng.</p>';
        return;
    }
    const numPackages = Math.ceil(totalWords / PACKAGE_SIZE);
    let packageHtml = `<h3 class="package-title">Chọn gói từ vựng cho Bài ${lesson}</h3><div class="package-container">`;
    for (let i = 0; i < numPackages; i++) {
        const startWordIndex = i * PACKAGE_SIZE;
        // Sửa lỗi: Đảm bảo endIndex được sử dụng đúng trong chuỗi template
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

    // Thêm nút "Thử thách vô hạn" nếu tất cả các gói trong bài đã hoàn thành
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
    usedWords = [];
    showNextCard();
    updateBackButton();
}

// Hàm mới để bắt đầu Thử thách vô hạn
function startInfiniteChallenge(lessonNum) {
    currentLesson = `infinite_challenge_${lessonNum}`; // Đặt tên đặc biệt để phân biệt
    sessionWords = allWords.get(lessonNum) || []; // Lấy tất cả từ của bài đó
    usedWords = []; // Reset used words
    if (sessionWords.length === 0) {
        document.getElementById('cardContainer').innerHTML = `<p class="placeholder-text">Bài ${lessonNum} không có từ vựng để thử thách vô hạn.</p>`;
        return;
    }
    showNextCard();
    updateBackButton();
    updateStats(); // Cập nhật thống kê cho toàn bài
}


function updateSRS(card, isCorrect, directionKey) {
    if (isCorrect) {
        if (card.srs[directionKey] < 3) card.srs[directionKey]++;
    } else {
        // Reset cả hai chiều nếu trả lời sai hoặc hết giờ
        card.srs.jpToVn = 0;
        card.srs.vnToJp = 0;
    }
    card.mastered = card.srs.jpToVn >= 3 && card.srs.vnToJp >= 3;
    localStorage.setItem('vocabData', JSON.stringify(Array.from(allWords.entries())));
}

function showNextCard() {
    isShowingResult = false;
    isTimedOut = false; // Reset cờ hết giờ cho thẻ mới
    clearTimeout(quizTimer); // Xóa bất kỳ bộ đếm thời gian nào đang chạy
    clearInterval(timerInterval); // Xóa bất kỳ interval nào đang chạy (không còn dùng cho hiển thị)

    const container = document.getElementById('cardContainer');
    if (!sessionWords || sessionWords.length === 0) return;

    let availableWords;
    // Logic cho Thử thách vô hạn và Tổng kết
    if (currentLesson === 'summary' || currentLesson.startsWith('infinite_challenge_')) {
        availableWords = sessionWords.filter(word => !usedWords.slice(-3).includes(word));
        if (availableWords.length === 0 && sessionWords.length > 0) {
            usedWords = [];
            availableWords = sessionWords;
        }
        // Nếu không có từ nào khả dụng sau khi reset, hiển thị thông báo hoàn thành
        if (!availableWords || availableWords.length === 0) {
            container.innerHTML = `<p>🎉 Bạn đã ôn tập hết các từ trong phiên này.</p>`;
            return;
        }
    } 
    // Logic cho học theo gói thông thường
    else {
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
    }

    if (!availableWords || availableWords.length === 0) {
        if (currentLesson !== 'summary' && !currentLesson.startsWith('infinite_challenge_')) {
            displayPackageSelection(currentLesson);
        } else {
            container.innerHTML = `<p>🎉 Bạn đã ôn tập hết các từ trong phiên này.</p>`;
        }
        return;
    }
    
    currentCard = availableWords[Math.floor(Math.random() * availableWords.length)];
    usedWords.push(currentCard);
    if (quizMode === "input") {
        showInputCard(currentCard);
    } else {
        showMultipleChoiceCard(currentCard);
        // Tính toán thời gian động
        const termToMeasure = currentCard.kanji ? `${currentCard.term} (${currentCard.kanji})` : currentCard.term;
        const dynamicQuizDuration = BASE_QUIZ_TIMER_DURATION + Math.max(0, termToMeasure.length - 4) * CHAR_PER_SECOND_RATE;
        console.log(`Từ: "${termToMeasure}" (${termToMeasure.length} ký tự), Thời gian: ${dynamicQuizDuration.toFixed(2)} giây`); // Log thời gian động

        // Thiết lập bộ đếm thời gian ẩn với thời gian động
        const directionKey = currentDirection === 'vnToJp' ? 'vnToJp' : 'jpToVn'; // Xác định chiều để reset SRS
        quizTimer = setTimeout(() => {
            isTimedOut = true;
            updateSRS(currentCard, false, directionKey); // Đặt lại SRS một cách ẩn nếu hết giờ
        }, dynamicQuizDuration * 1000);
    }
}


function showMultipleChoiceCard(card) {
    let isReverse;
    const { jpToVn, vnToJp } = card.srs;
    const needsJpVn = jpToVn < 3;
    const needsVnJp = vnToJp < 3;
    
    // Cải thiện logic trộn câu hỏi:
    if (needsJpVn && needsVnJp) {
        // Nếu cả hai chiều đều cần ôn tập, chọn ngẫu nhiên
        isReverse = Math.random() < 0.5; // 50% VN->JP, 50% for JP->VN
    } else if (needsVnJp) {
        isReverse = true; // Chỉ cần ôn tập VN->JP
    } else {
        isReverse = false; // Chỉ cần ôn tập JP->VN, hoặc từ đã thuộc hoàn toàn
    }

    const displayText = isReverse ? card.meaning : (card.kanji ? `${card.term} (${card.kanji})` : card.term);
    const correctAnswer = isReverse ? (card.kanji ? `${card.term} (${card.kanji})` : card.term) : card.meaning;
    const choices = generateChoices(isReverse, card);
    const statusTag = card.mastered ? '<span class="mastered-tag">✓ Đã thuộc</span>' : (jpToVn > 0 || vnToJp > 0 ? '<span class="review-tag">⏳ Đang học...</span>' : '');
    
    // CẢI TIẾN: Thêm nút loa khi hiển thị từ tiếng Nhật (ĐÃ BỊ LOẠI BỎ CHỨC NĂNG)
    // const speakButton = !isReverse ? `<button class="speak-btn" onclick="speakText('${card.term}', true)">🔊</button>` : ''; 

    document.getElementById('cardContainer').innerHTML = `
        <div class="card">
            <h2>${displayText} ${statusTag}</h2>
            <div class="choices-container">${choices.map(choice => `<button class="choice-btn" onclick="handleChoiceClick(this, '${choice.replace(/'/g, "\\'")}', '${correctAnswer.replace(/'/g, "\\'")}', ${isReverse})">${choice}</button>`).join('')}</div>
            <div id="keyGuide">Bấm phím số 1-4 để chọn</div>
        </div>`;
    
    // Tự động phát âm khi hiển thị câu hỏi tiếng Nhật (ĐÃ BỊ LOẠI BỎ CHỨC NĂNG)
    /*
    if (!isReverse && !skipNextQuestionSpeech) { 
        speakText(card.term, true); 
    }
    skipNextQuestionSpeech = false; 
    */
}

function generateChoices(isReverse, currentCard) {
    // Xác định câu trả lời đúng
    const correctAnswer = isReverse
        ? (currentCard.kanji ? `${currentCard.term} (${currentCard.kanji})` : currentCard.term)
        : currentCard.meaning;
        
    const allPossibleWords = Array.from(allWords.values()).flat();
    let choices = [correctAnswer];
    const uniqueAnswers = new Set(choices);

    // Lấy các đáp án nhiễu đã được định nghĩa trước trong file Excel
    const currentDummies = isReverse ? currentCard.jpDummies : currentCard.vnDummies;
    currentDummies.forEach(dummy => {
        if (choices.length >= 4) return;
        let processedDummy = dummy;
        // Nếu các lựa chọn là tiếng Nhật, thêm kanji cho các từ nhiễu nếu có
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

    // Lấy thêm các từ khác trong toàn bộ từ vựng để làm đáp án nhiễu
    const otherWords = allPossibleWords.filter(word => word.term !== currentCard.term);
    shuffleArray(otherWords);

    while (choices.length < 4 && otherWords.length > 0) {
        const word = otherWords.pop();
        
        // SỬA LỖI: Đảm bảo "candidate" (đáp án nhiễu) luôn là ngôn ngữ đúng
        // Nếu isReverse (hỏi tiếng Việt), các lựa chọn phải là tiếng Nhật.
        // Nếu không (hỏi tiếng Nhật), các lựa chọn phải là tiếng Việt.
        const candidate = isReverse
            ? (word.kanji ? `${word.term} (${word.kanji})` : word.term) // Lựa chọn tiếng Nhật
            : word.meaning; // Lựa chọn tiếng Việt

        if (!uniqueAnswers.has(candidate)) {
            choices.push(candidate);
            uniqueAnswers.add(candidate);
        }
    }
    
    return shuffleArray(choices);
}

function handleChoiceClick(button, selectedValue, correctAnswer, isReverse) {
    if (isShowingResult) return; // Ngăn chặn xử lý nhiều lần nếu click nhanh
    clearTimeout(quizTimer); // Dừng bộ đếm thời gian ẩn
    clearInterval(timerInterval); // Dừng interval (nếu có, mặc dù không còn dùng cho hiển thị)
    isShowingResult = true; // Đánh dấu rằng một câu trả lời đã được xử lý

    const isCorrectAttempt = selectedValue === correctAnswer; // User's current selection is correct
    const directionKey = isReverse ? 'vnToJp' : 'jpToVn';

    // Áp dụng phản hồi trực quan ngay lập tức
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = true; // Vô hiệu hóa tất cả các nút sau khi chọn
        if (btn.textContent.trim() === correctAnswer) btn.classList.add('correct');
    });
    if (!isCorrectAttempt) button.classList.add('incorrect');

    // Cập nhật SRS chỉ khi KHÔNG hết giờ.
    // Nếu hết giờ (isTimedOut là true), SRS đã được reset bởi quizTimer.
    if (!isTimedOut) { 
        updateSRS(currentCard, isCorrectAttempt, directionKey);
    } 

    // Determine what text to speak and when to transition
    // let speechPromise = Promise.resolve(); // Mặc định là Promise đã giải quyết nếu không có phát âm (ĐÃ BỊ LOẠI BỎ)
    let delayBeforeNextAction = 1000; // Độ trễ mặc định cho phản hồi tích cực

    if (isCorrectAttempt) { // Nếu người dùng trả lời đúng (dù trong hay ngoài thời gian)
        // if (isReverse) { // Nếu câu hỏi là tiếng Việt, đáp án đúng là tiếng Nhật (ĐÃ BỊ LOẠI BỎ CHỨC NĂNG PHÁT ÂM)
        //     speechPromise = speakText(correctAnswer, true); 
        //     delayBeforeNextAction = 1000; 
        //     skipNextQuestionSpeech = true; 
        // } else { 
            delayBeforeNextAction = 1000; 
            // skipNextQuestionSpeech = false; // Đảm bảo cờ là false nếu không cần bỏ qua (ĐÃ BỊ LOẠI BỎ)
        // }
    } else if (currentLesson === 'summary' && !isCorrectAttempt) { 
        const originalLesson = currentCard.lesson;
        sessionWords = sessionWords.filter(word => word.term !== currentCard.term); 
        setTimeout(() => {
            document.getElementById('cardContainer').innerHTML = `<div class="card result-feedback"><p class="feedback-incorrect">🔴 Trả lời sai!</p><p>Từ này đã được chuyển về <strong>Bài ${originalLesson}</strong> để ôn tập lại.</p></div>`;
            setTimeout(() => { showNextCard(); updateStats(); updateLessonDropdown(); }, 2500);
        }, 1500);
        return; 
    } else { 
        delayBeforeNextAction = 2000; 
        // speechPromise = Promise.resolve(); // Không phát âm cho câu trả lời sai (ĐÃ BỊ LOẠI BỎ)
        // skipNextQuestionSpeech = false; // Đảm bảo cờ là false nếu không cần bỏ qua (ĐÃ BỊ LOẠI BỎ)
    }

    // Chờ cho việc phát âm hoàn tất (nếu có), sau đó thực hiện bước tiếp theo (ĐÃ BỊ LOẠI BỎ)
    // speechPromise.then(() => {
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
    // }).catch(error => {
    //     console.error("Lỗi trong quá trình phát âm hoặc chuyển đổi:", error);
    //     // Fallback: tiếp tục mà không phát âm nếu có lỗi
    //     setTimeout(() => {
    //         if (isCorrectAttempt) {
    //             showNextCard();
    //         } else {
    //             isShowingResult = false;
    //             if (quizMode === 'input') {
    //                 showInputCard(currentCard);
    //             } else {
    //                 showMultipleChoiceCard(currentCard);
    //             }
    //         }
    //         updateStats();
    //         updateLessonDropdown();
    //     }, delayBeforeNextAction);
    // });
}

// Hàm handleTimeout và startChoiceTimer đã được loại bỏ vì không còn hiển thị bộ đếm giờ

function showInputCard(card) {
    const isReverse = currentDirection === 'vnToJp';
    const displayText = isReverse ? card.meaning : (card.kanji ? `${card.term} (${card.kanji})` : card.term);
    const placeholder = isReverse ? "Nhập tiếng Nhật..." : "Nhập nghĩa tiếng Việt...";
    const correctAnswer = isReverse ? card.term : card.meaning;
    const statusTag = card.mastered ? '<span class="mastered-tag">✓ Đã thuộc</span>' : (card.srs.jpToVn > 0 || card.srs.vnToJp > 0 ? '<span class="review-tag">⏳ Đang học...</span>' : '');
    
    // CẢI TIẾN: Thêm nút loa khi hiển thị từ tiếng Nhật (ĐÃ BỊ LOẠI BỎ CHỨC NĂNG)
    // const speakButton = !isReverse ? `<button class="speak-btn" onclick="speakText('${card.term}', true)">🔊</button>` : ''; 

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
    showNextCard();
}

function onLessonChange() {
    console.log('onLessonChange được gọi. Giá trị đã chọn:', document.getElementById('lessonSelect').value);
    clearTimeout(quizTimer);
    clearInterval(timerInterval);
    currentPackageIndex = 0; // Reset package index
    sessionWords = []; // Clear session words

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
    if (sessionWords.length > 0) showNextCard();
}

function onDirectionChange() {
    currentDirection = document.getElementById('direction').value;
    if (sessionWords.length > 0) showNextCard();
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
    updateBackButton();
    document.getElementById('cardContainer').innerHTML = '<p class="placeholder-text">Vui lòng chọn một bài học để bắt đầu.</p>';
    updateStats();
}

function exportData() {
    const data = localStorage.getItem('vocabData');
    if (!data) return alert('Không có dữ liệu để xuất!');
    const blob = new Blob([data], { type: 'application/json' });
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
                        word.srs = { jpToVn: word.repetitions >= 3 ? 3 : 0, vnToJp: word.repetitions >= 3 ? 3 : 0 };
                        delete word.repetitions;
                    }
                });
            }
            localStorage.setItem('vocabData', JSON.stringify(Array.from(allWords.entries())));
            updateLessonDropdown();
            resetToHome();
            alert('Nhập dữ liệu thành công! Dữ liệu cũ đã được cập nhật.');
            console.log('Dữ liệu từ JSON đã được nhập và lưu vào allWords:', allWords);
        } catch (error) {
            alert('File không hợp lệ!');
            console.error(error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
        toggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
        toggleButton.title = theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
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
    if (savedTheme) setTheme(savedTheme);
    else if (prefersDark) setTheme('dark');
    else setTheme('light');
}

window.onload = () => {
    initTheme();
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    const savedData = localStorage.getItem('vocabData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData)) {
                allWords = new Map(parsedData);
                for(const words of allWords.values()){
                    words.forEach(word => {
                        if(word.repetitions !== undefined) {
                            word.srs = { jpToVn: 0, vnToJp: 0 };
                            if(word.mastered) {
                                word.srs.jpToVn = 3;
                                word.srs.vnToJp = 3;
                            }
                            delete word.repetitions;
                        }
                    });
                }
            }
            else localStorage.removeItem('vocabData');
        } catch (e) {
            console.error("Could not parse vocabData from localStorage", e);
            localStorage.removeItem('vocabData');
        }
    }
    updateLessonDropdown();
    resetToHome();
    onQuizModeChange();
    console.log('Ứng dụng đã tải xong. Dữ liệu allWords ban đầu:', allWords);
};

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
}
body[data-theme='dark'] {
    --primary-gradient: linear-gradient(135deg, #82aaff 0%, #2575fc 100%);
    --bg-main: #121212; --bg-content: #1e1e1e; --bg-card: rgba(42, 42, 62, 0.7);
    --border-color: rgba(255, 255, 255, 0.1); --text-primary: #ffffff; --text-secondary: #a0a0b0;
    --text-accent: #82aaff; --shadow-light: rgba(0, 0, 0, 0.2); --shadow-heavy: rgba(0, 0, 0, 0.4);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-body); background-color: var(--bg-main); color: var(--text-primary); line-height: 1.6; padding: 15px; transition: background-color 0.3s, color 0.3s; }
.container { max-width: 700px; margin: 0 auto; padding: 20px; background: var(--bg-content); border-radius: 24px; border: 1px solid var(--border-color); box-shadow: 0 16px 40px var(--shadow-heavy); transition: background-color 0.3s, border-color 0.3s; }
header { text-align: center; margin-bottom: 25px; }
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
h1 { font-family: var(--font-heading); font-weight: 700; color: var(--text-primary); font-size: 1.8rem; }
header p { color: var(--text-secondary); }
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
#timer { position: absolute; top: 15px; right: 15px; width: 40px; height: 40px; border-radius: 50%; background-color: var(--text-accent); color: var(--bg-content); font-size: 1.2em; font-weight: bold; transition: all 0.5s; border: 2px solid var(--bg-main); display: flex; align-items: center; justify-content: center; }
#theme-toggle { font-size: 1.5rem; background: none; border: none; cursor: pointer; color: var(--text-secondary); transition: transform 0.3s ease, color 0.3s; }
#theme-toggle:hover { transform: scale(1.2) rotate(15deg); color: var(--warning-color); }
.placeholder-text { text-align: center; color: var(--text-secondary); padding: 40px 20px; }
/* BỔ SUNG: CSS cho nút phát âm (ĐÃ BỊ LOẠI BỎ) */
/*
.speak-btn { background: none; border: none; cursor: pointer; font-size: 1.5rem; color: var(--text-secondary); transition: all 0.2s ease; vertical-align: middle; padding: 0 5px;}
.speak-btn:hover { color: var(--text-accent); transform: scale(1.2); }
*/
/* CSS cho phần thử thách vô hạn */
.infinite-challenge-section { margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border-color); text-align: center; }
@media (max-width: 600px) {
    body { padding: 5px; }
    .container { padding: 15px; }
    .card h2 { font-size: 1.8rem; }
    .choice-btn, #answerInput { font-size: 16px; }
    .lesson-controls { flex-direction: column; }
    .header-top h1 { font-size: 1.5rem; }
}
`;
document.head.appendChild(style);
