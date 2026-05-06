
let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let isCurrentSelectionCorrect = false;

const quizCard = document.getElementById('quiz-card');
const resultCard = document.getElementById('result-card');
const questionText = document.getElementById('question-text');
const questionImage = document.getElementById('question-image');
const optionsList = document.getElementById('options-list');
const progressText = document.getElementById('progress');
const nextBtn = document.getElementById('next-btn');
const finalScoreText = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Pobieranie pytań z pliku JSON
async function loadQuizData() {
    try {
        const response = await fetch('pytania.json');
        quizData = await response.json();
        startQuiz();
    } catch (error) {
        questionText.innerText = "Błąd podczas ładowania pytań. Upewnij się, że plik pytania.json istnieje.";
        console.error(error);
    }
}

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    resetState();
    const currentQuestion = quizData[currentQuestionIndex];
    
    progressText.innerText = `Pytanie ${currentQuestionIndex + 1} z ${quizData.length}`;
    questionText.innerText = currentQuestion.question;

    // Obsługa opcjonalnego obrazka
    if (currentQuestion.image && currentQuestion.image.trim() !== "") {
        questionImage.src = currentQuestion.image;
        questionImage.classList.remove('hidden');
    } else {
        questionImage.classList.add('hidden');
    }

    // Wyświetlanie opcji odpowiedzi
    currentQuestion.options.forEach((option) => {
        const button = document.createElement('button');
        button.innerText = option.content;
        button.classList.add('option-btn');
        button.addEventListener('click', () => selectOption(option.isCorrect, button));
        optionsList.appendChild(button);
    });
}

function resetState() {
    isCurrentSelectionCorrect = false;
    nextBtn.disabled = true;
    while (optionsList.firstChild) {
        optionsList.removeChild(optionsList.firstChild);
    }
}

function selectOption(isCorrect, button) {
    // Odznacz poprzednie
    const allButtons = document.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Zaznacz bieżące
    button.classList.add('selected');
    isCurrentSelectionCorrect = isCorrect;
    nextBtn.disabled = false;
}

nextBtn.addEventListener('click', () => {
    // Jeśli wybrana opcja była poprawna (isCorrect === true), dodaj punkt
    if (isCurrentSelectionCorrect) {
        score++;
    }

    currentQuestionIndex++;

    if (currentQuestionIndex < quizData.length) {
        showQuestion();
    } else {
        showResult();
    }
});

function showResult() {
    quizCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
    finalScoreText.innerText = `${score} / ${quizData.length}`;
}

restartBtn.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    startQuiz();
});

// Inicjalizacja
loadQuizData();
