// 1. КЛАСИ ДЛЯ ТЕСТУ (Question, Quiz) - БЕЗ ЗМІН
// Базовий клас для всіх питань (Крок 6)
class Question {
    constructor(text, options, correct, points = 1) {
        this.text = text;
        this.options = options; 
        this.correct = correct; 
        this.points = points;
    }

    // Метод для перемішування варіантів відповідей (Крок 9)
    shuffleOptions() {
        for (let i = this.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.options[i], this.options[j]] = [this.options[j], this.options[i]];
        }
    }
}

// 1.1. Питання з однією правильною відповіддю (Radio buttons)
class RadioQuestion extends Question {
    constructor(text, options, correctIndex, points) {
        super(text, options, correctIndex, points);
        this.type = 'radio';
    }

    checkAnswer(userAnswerIndex) {
        // У F1-питаннях я використовую рядок для відповіді,
        // щоб зробити код чистішим і уникнути плутанини з індексами.
        // Ми порівнюємо, чи збігається текст правильної відповіді з текстом обраного варіанту (userAnswerIndex тут - індекс обраного варіанта)
        // Для спрощення тестування:
        // У RadioQuestion correct має бути ІНДЕКС правильної відповіді!
        // Я коригую це нижче у банку питань для RadioQuestion.
        return this.correct === userAnswerIndex;
    }
}

// 1.2. Питання з множинним вибором (Checkbox)
class CheckboxQuestion extends Question {
    constructor(text, options, correctIndices, points) {
        super(text, options, correctIndices, points); 
        this.type = 'checkbox';
    }

    checkAnswer(userAnswerIndices) {
        if (userAnswerIndices.length !== this.correct.length) {
            return false;
        }
        const sortedUser = userAnswerIndices.sort((a, b) => a - b);
        const sortedCorrect = this.correct.sort((a, b) => a - b);

        return sortedUser.every((value, index) => value === sortedCorrect[index]);
    }
}

// 1.3. Питання Drag & Drop (Крок 6, 10)
class DragDropQuestion extends Question {
    constructor(text, draggableItems, correctMapping, points) {
        // correctMapping: об'єкт { 'Текст елемента': 'Назва зони' }
        super(text, draggableItems, correctMapping, points); 
        this.type = 'dragdrop';
    }

    // Перевіряє відповідь Drag & Drop. userAnswer - об'єкт { 'Текст елемента': 'Назва зони' }
    checkAnswer(userAnswer) {
        let correctCount = 0;
        let totalItems = Object.keys(this.correct).length;
        
        for (const itemText in this.correct) {
            const userSlot = userAnswer[itemText];
            const correctSlot = this.correct[itemText];

            if (userSlot === correctSlot) {
                correctCount++;
            }
        }
        // Зарахуємо бал, якщо всі елементи розміщені правильно
        return correctCount === totalItems;
    }
    // D&D не перемішуємо, бо це порушить логіку відповідності
    shuffleOptions() { } 
}


// Клас для управління тестом (Крок 7)
class Quiz {
    constructor(questions, name, group) {
        this.name = name;
        this.group = group;
        this.questions = questions; 
        this.score = 0;
        this.maxScore = this.questions.reduce((sum, q) => sum + q.points, 0);
    }
    
    // Перемішуємо питання всього тесту та його варіанти (Крок 9)
    static selectRandomQuestions(bank, count) {
        const shuffled = bank.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        selected.forEach(q => {
             // Викликаємо перемішування варіантів відповідей
             q.shuffleOptions(); 
        });
        return selected;
    }

    // Перевірити всі відповіді та підрахувати бали (Крок 11)
    calculateScore() {
        this.score = 0;
        const container = document.getElementById('questions-container');

        this.questions.forEach((question, index) => {
            const questionElement = container.querySelector(`.question[data-index="${index}"]`);

            if (question.type === 'radio') {
                const checkedRadio = questionElement.querySelector(`input[name="q${index}"]:checked`);
                if (checkedRadio) {
                    const userAnswerIndex = parseInt(checkedRadio.value); 
                    if (question.checkAnswer(userAnswerIndex)) {
                        this.score += question.points;
                    }
                }
            } else if (question.type === 'checkbox') {
                const checkedBoxes = questionElement.querySelectorAll(`input[name="q${index}"]:checked`);
                if (checkedBoxes.length > 0) {
                    const userAnswerIndices = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
                    if (question.checkAnswer(userAnswerIndices)) {
                        this.score += question.points;
                    }
                }
            } else if (question.type === 'dragdrop') {
                const userAnswer = {}; 
                
                // Збираємо відповіді для Drag & Drop
                const dropAreas = questionElement.querySelectorAll('.droppable-area');
                dropAreas.forEach(area => {
                    const draggableItem = area.querySelector('.draggable-item');
                    if (draggableItem) {
                        const slotName = area.dataset.slot; 
                        const itemText = draggableItem.textContent.trim();
                        userAnswer[itemText] = slotName; 
                    }
                });
                
                if (question.checkAnswer(userAnswer)) {
                    this.score += question.points;
                }
            }
        });
        return this.score;
    }
}


// 2. БАНК ПИТАНЬ - ПОВНІСТЮ ЗМІНЕНО НА F1 (Крок 8)
// *Зверніть увагу: правильна відповідь для RadioQuestion - це ІНДЕКС (0, 1, 2, 3), а не текст.
const beginnerQuestionsBank = [
    // Питання про F1/Ферстаппена (Початковий Рівень)
    new RadioQuestion(
        "Яка команда є поточною (2025) командою Макса Ферстаппена?",
        ["Ferrari", "Red Bull Racing", "Mercedes", "Aston Martin"],
        1 // Індекс правильної відповіді: "Red Bull Racing"
    ),
    new RadioQuestion(
        "У якому році Макс Ферстаппен вперше став Чемпіоном Світу F1?",
        ["2020", "2021", "2022", "2019"],
        1 // Індекс правильної відповіді: "2021"
    ),
    new RadioQuestion(
        "Який гоночний номер використовує Макс Ферстаппен у Формулі-1?",
        ["33", "1", "10", "44"],
        1 // Індекс правильної відповіді: "1" (як чинний чемпіон)
    ),
    new RadioQuestion(
        "Який тип шин зазвичай використовується для їзди по мокрій трасі?",
        ["Soft", "Medium", "Hard", "Wet"],
        3 // Індекс правильної відповіді: "Wet"
    ),
    new RadioQuestion(
        "Який елемент автомобіля F1 відкривається за допомогою DRS?",
        ["Переднє крило", "Заднє крило", "Бортові понтони", "Дифузор"],
        1 // Індекс правильної відповіді: "Заднє крило"
    ),
    new RadioQuestion(
        "Скільки пілотів стартує у гонці Формули-1 (при повній сітці)?",
        ["18", "20", "22", "24"],
        1 // Індекс правильної відповіді: "20"
    ),
];

const intermediateQuestionsBank = [
    // Питання про F1/Ферстаппена (Середній Рівень)
    new CheckboxQuestion(
        "Які з цих подій відбуваються під час Гран-прі F1 (оберіть дві правильні)?",
        ["Вільна практика", "Супербоул", "Кваліфікація", "Спринтерська гонка"],
        [0, 2], // Індекси правильних відповідей: "Вільна практика", "Кваліфікація"
        2
    ),
    new CheckboxQuestion(
        "Які з цих команд є постачальниками двигунів для F1 (оберіть дві правильні)?",
        ["Mercedes", "Lamborghini", "Ferrari", "Toyota"],
        [0, 2], // Індекси правильних відповідей: "Mercedes", "Ferrari"
        2
    ),
    new DragDropQuestion(
        "З'єднайте пілота з його національністю (Балів: 3)",
        ["Макс Ферстаппен", "Серхіо Перес", "Льюїс Гамільтон"],
        { 
            "Макс Ферстаппен": "Нідерланди", 
            "Серхіо Перес": "Мексика", 
            "Льюїс Гамільтон": "Велика Британія"
        },
        3 // Більше балів за складне питання
    ),
    new RadioQuestion(
        "Скільки кіл зазвичай проходить гонка F1, якщо не враховувати особливі випадки?",
        ["До 305 км", "До 250 км", "Мінімум 400 км"],
        0, // Індекс правильної відповіді: "До 305 км" (або 2 години)
        1
    ),
    new DragDropQuestion(
        "Перетягніть команду до її логотипу (уявно) (Балів: 3)",
        ["McLaren", "Alpine", "Visa Cash App RB F1 Team"],
        { 
            "McLaren": "Помаранчевий/Чорний", 
            "Alpine": "Синій/Рожевий", 
            "Visa Cash App RB F1 Team": "Синій/Червоний"
        },
        3
    ),
    new CheckboxQuestion(
        "Які з цих трас приймали Гран-прі F1 (оберіть три)?",
        ["Монца", "Нюрбургринг", "Ле-Ман", "Спа-Франкоршам", "Індіанаполіс"],
        [0, 1, 3], // Індекси правильних відповідей: "Монца", "Нюрбургринг", "Спа-Франкоршам"
        3
    ),
];

// Мапа для вибору банку
const questionBanks = {
    // Збільшено count, щоб було більше питань F1
    beginner: { bank: beginnerQuestionsBank, count: 6 }, 
    intermediate: { bank: intermediateQuestionsBank, count: 6 },
    advanced: { bank: beginnerQuestionsBank.concat(intermediateQuestionsBank), count: 12 }, 
};



// 3. РОБОТА З DOM ТА ОБРОБКА ПОДІЙ - БЕЗ ЗМІН

let currentQuiz = null; 

// 3.1 Функція для відображення питань 
function renderQuiz(quiz) {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    quiz.questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');
        questionDiv.dataset.index = index; 
        
        let optionsHtml = '';
        
        if (question.type === 'radio' || question.type === 'checkbox') {
            const inputType = question.type;
            
            question.options.forEach((option, optionIndex) => {
                optionsHtml += `
                    <label>
                        <input type="${inputType}" name="q${index}" value="${optionIndex}">
                        ${option}
                    </label>
                `;
            });
            optionsHtml = `<div class="options-group">${optionsHtml}</div>`;
        
        } else if (question.type === 'dragdrop') {
            
            // 1. Елементи для перетягування (Draggables)
            let draggableItemsHtml = '';
            question.options.forEach(itemText => {
                draggableItemsHtml += `
                    <div class="draggable-item" draggable="true">${itemText}</div>
                `;
            });
            
            // 2. Зони для скидання (Droppables)
            let droppableAreasHtml = '';
            // question.correct - це об'єкт { 'Елемент': 'Зона' }
            // Нам потрібні лише унікальні назви зон
            const slotNames = new Set(Object.values(question.correct)); 
            
            slotNames.forEach(slotName => {
                droppableAreasHtml += `
                    <div class="droppable-area" data-slot="${slotName}">
                        <span>${slotName}</span>
                    </div>
                `;
            });
            
            optionsHtml = `
                <h4>Елементи для перетягування (Source):</h4>
                <div class="dnd-container" id="draggable-source-${index}">
                    ${draggableItemsHtml}
                </div>
                <h4>Зони для відповіді (Targets):</h4>
                <div class="dnd-container" id="droppable-targets-${index}">
                    ${droppableAreasHtml}
                </div>
            `;
        }

        questionDiv.innerHTML = `
            <h3>${index + 1}. ${question.text} (Балів: ${question.points})</h3>
            ${optionsHtml}
        `;
        
        container.appendChild(questionDiv);
    });
    
    // Ініціалізуємо Drag & Drop після додавання елементів
    initializeDragAndDrop();
    document.getElementById('submit-quiz').disabled = false;
}

//  3.2 Функція для відображення результатів 
function showResults(score) {
    document.getElementById('quiz-screen').classList.add('hidden');
    const resultsScreen = document.getElementById('results-screen');
    resultsScreen.classList.remove('hidden');

    const percentage = ((score / currentQuiz.maxScore) * 100).toFixed(1);
    const resultMessage = `Ваш результат: ${score} з ${currentQuiz.maxScore} балів (${percentage}%).`;
    document.getElementById('final-score').textContent = resultMessage;
    
    // Збереження результатів у localStorage (Крок 12)
    const resultData = {
        name: currentQuiz.name,
        group: currentQuiz.group,
        score: score,
        maxScore: currentQuiz.maxScore,
        level: document.getElementById('level-select').value,
        date: new Date().toLocaleString()
    };

    const allResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    allResults.push(resultData);
    localStorage.setItem('quizResults', JSON.stringify(allResults));
}


// 4. ЛОГІКА DRAG & DROP API (Крок 10) - БЕЗ ЗМІН

let draggedItem = null; // Глобальна змінна для елемента, що перетягується

function initializeDragAndDrop() {
    // 1. Обробка перетягуваних елементів
    document.querySelectorAll('.draggable-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            e.dataTransfer.setData('text/plain', e.target.textContent.trim()); 
            e.target.style.opacity = '0.5';
        });

        item.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
        });
    });

    // 2. Обробка зон скидання
    document.querySelectorAll('.droppable-area').forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Дозволяє скидання
            e.currentTarget.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            
            // Якщо зона вже містить елемент, ігноруємо
            if (e.currentTarget.querySelector('.draggable-item')) {
                return;
            }

            // Якщо draggedItem був у іншій droppable-area, видаляємо клас 'filled'
            if (draggedItem.parentNode && draggedItem.parentNode.classList.contains('droppable-area')) {
                 draggedItem.parentNode.classList.remove('filled');
            }
            
            // Додаємо елемент в нову зону
            e.currentTarget.appendChild(draggedItem);
            e.currentTarget.classList.add('filled');
            
            draggedItem = null; 
        });
        
        // 3. Додатковий drop-обробник для повернення елемента у вихідний контейнер
        const sourceContainer = document.getElementById(`draggable-source-${zone.closest('.question').dataset.index}`);
        sourceContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItem) {
                // Видаляємо клас .filled у старої droppable-area
                if (draggedItem.parentNode.classList.contains('droppable-area')) {
                    draggedItem.parentNode.classList.remove('filled');
                }
                e.currentTarget.appendChild(draggedItem);
                draggedItem = null;
            }
        });
        sourceContainer.addEventListener('dragover', (e) => { e.preventDefault() });
    });
}


// 5. ІНІЦІАЛІЗАЦІЯ ТА ОСНОВНІ ПОДІЇ (Крок 10, 13) - БЕЗ ЗМІН

document.addEventListener('DOMContentLoaded', () => {
    const startForm = document.getElementById('start-form');
    const submitQuizButton = document.getElementById('submit-quiz');
    const restartQuizButton = document.getElementById('restart-quiz');
    
    // 1. Обробка форми початку тесту (з валідацією)
    startForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Проста валідація
        if (!startForm.checkValidity()) {
             document.getElementById('error-message').textContent = "Будь ласка, заповніть коректно всі поля.";
             return;
        }

        document.getElementById('error-message').textContent = "";
        
        const userName = document.getElementById('name-input').value.trim();
        const userGroup = document.getElementById('group-input').value.trim();
        const selectedLevel = document.getElementById('level-select').value;
        
        const bankData = questionBanks[selectedLevel];
        
        document.getElementById('user-info-display').textContent = 
            `Студент: ${userName} | Група: ${userGroup}`;
        document.getElementById('quiz-level-display').textContent = 
            document.getElementById('level-select').options[document.getElementById('level-select').selectedIndex].text.split('(')[0];
        
        // Ініціалізація тесту
        const selectedQuestions = Quiz.selectRandomQuestions(bankData.bank, bankData.count);
        currentQuiz = new Quiz(selectedQuestions, userName, userGroup);
        
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.remove('hidden');
        
        renderQuiz(currentQuiz); 
    });

    // 2. Обробка кнопки завершення тесту
    submitQuizButton.addEventListener('click', () => {
        if (currentQuiz) {
            const finalScore = currentQuiz.calculateScore(); 
            showResults(finalScore);
        }
    });

    // 3. Обробка кнопки "Спробувати ще раз"
    restartQuizButton.addEventListener('click', () => {
        currentQuiz = null;
        document.getElementById('results-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('start-form').reset();
    });

});
