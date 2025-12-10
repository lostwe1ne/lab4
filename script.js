// 1. КЛАСИ ДЛЯ ТЕСТУ (Question, Quiz)

/** Базовий клас для всіх питань */
class Question {
    constructor(text, options, correct, points = 1) {
        this.text = text;
        this.options = options; 
        this.correct = correct; // ТЕКСТ або МАСИВ ТЕКСТІВ
        this.points = points;
    }

    /** Метод для перемішування варіантів відповідей (використовується map, деструктуризація) */
    shuffleOptions() {
        // Створюємо новий масив для перемішування, щоб уникнути зміни початкового банку
        const shuffled = [...this.options];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Деструктуризація для обміну
        }
        this.options = shuffled;
    }
}

/** 1.1. Питання з однією правильною відповіддю (Radio buttons) */
class RadioQuestion extends Question {
    constructor(text, options, correctValue, points = 1) {
        super(text, options, correctValue, points); 
        this.type = 'radio';
    }

    checkAnswer(userAnswerIndex) {
        // Оскільки options перемішуються, перевіряємо по тексту варіанта, а не по індексу
        const selectedOptionText = this.options[userAnswerIndex];
        return this.correct === selectedOptionText;
    }
}

/** 1.2. Питання з множинним вибором (Checkbox) */
class CheckboxQuestion extends Question {
    constructor(text, options, correctValues, points = 2) {
        super(text, options, correctValues, points); 
        this.type = 'checkbox';
    }

    /** Використовує Array.map, Array.sort, Array.every */
    checkAnswer(userAnswerIndices) {
        const userAnswerTexts = userAnswerIndices.map(index => this.options[index]);
        
        if (userAnswerTexts.length !== this.correct.length) {
            return false;
        }

        const sortedUser = userAnswerTexts.sort();
        const sortedCorrect = this.correct.sort(); // Сортуємо, щоб порівнювати масиви

        return sortedUser.every((value, index) => value === sortedCorrect[index]);
    }
}

/** 1.3. Питання Drag & Drop */
class DragDropQuestion extends Question {
    constructor(text, draggableItems, correctMapping, points = 3) {
        super(text, draggableItems, correctMapping, points); 
        this.type = 'dragdrop';
    }

    /** userAnswer: { "Елемент A": "Зона 1", "Елемент B": "Зона 2" } */
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
        return correctCount === totalItems;
    }
    // D&D не перемішуємо, але draggableItems все одно використовуються для рендерингу
    shuffleOptions() { } 
}

/** 1.4. Питання з випадаючим списком (Select) */
class SelectQuestion extends Question {
    constructor(text, options, correctValue, points = 1) {
        super(text, options, correctValue, points); 
        this.type = 'select';
    }

    checkAnswer(userAnswerText) {
        return this.correct === userAnswerText;
    }
}

/** 1.5. Завдання з написанням коду/виправленням/пропуском (Text/Textarea) */
class CodeQuestion extends Question {
    // subType: 'text', 'fill-in-blank', 'debugging'
    constructor(text, subType, correctValue, points = 5) {
        super(text, [], correctValue, points); 
        this.type = 'code';
        this.subType = subType;
    }

    checkAnswer(userAnswer) {
        const userAnswerNormalized = userAnswer.trim().toLowerCase();
        
        if (this.subType === 'text' || this.subType === 'fill-in-blank') {
            // Для простих відповідей/пропусків: точне співпадіння
            return userAnswerNormalized === this.correct.trim().toLowerCase();
        } else if (this.subType === 'debugging') {
            // Для виправлення помилок: перевіряємо, чи є в коді ключові виправлені частини
            // Використовуємо Array.every
            const correctParts = Array.isArray(this.correct) ? this.correct : [this.correct];
            return correctParts.every(part => userAnswerNormalized.includes(part.toLowerCase()));
        }
        return false;
    }
}


/** Клас для управління тестом (використовує Array.reduce) */
class Quiz {
    constructor(questions, name, group) {
        this.name = name;
        this.group = group;
        this.questions = questions; 
        this.score = 0;
        // Використовуємо Array.reduce для підрахунку максимального балу
        this.maxScore = this.questions.reduce((sum, q) => sum + q.points, 0);
    }
    
    /** Перемішуємо питання всього тесту та його варіанти (статичний метод) */
    static selectRandomQuestions(bank, count) {
        const shuffled = bank.sort(() => 0.5 - Math.random());
        // Обмеження до count
        const selected = shuffled.slice(0, count);
        // Використовуємо Array.forEach
        selected.forEach(q => {
             // Перемішуємо варіанти лише для питань, які мають їх
             if (q.options && q.options.length > 0) {
                 q.shuffleOptions(); 
             }
        });
        return selected;
    }

    /** Перевірити всі відповіді та підрахувати бали */
    calculateScore() {
        this.score = 0;
        const container = document.getElementById('questions-container');

        this.questions.forEach((question, index) => {
            const questionElement = container.querySelector(`.question[data-index="${index}"]`);
            
            // RADIO
            if (question.type === 'radio') {
                const checkedRadio = questionElement.querySelector(`input[name="q${index}"]:checked`);
                if (checkedRadio) {
                    const userAnswerIndex = parseInt(checkedRadio.value); 
                    if (question.checkAnswer(userAnswerIndex)) {
                        this.score += question.points;
                    }
                }
            
            // CHECKBOX
            } else if (question.type === 'checkbox') {
                const checkedBoxes = questionElement.querySelectorAll(`input[name="q${index}"]:checked`);
                if (checkedBoxes.length > 0) {
                    // Використовуємо Array.from та Array.map
                    const userAnswerIndices = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
                    if (question.checkAnswer(userAnswerIndices)) {
                        this.score += question.points;
                    }
                }

            // SELECT
            } else if (question.type === 'select') {
                const selectElement = questionElement.querySelector(`.select-answer`);
                if (selectElement && selectElement.value) {
                    const userAnswer = selectElement.value;
                    if (question.checkAnswer(userAnswer)) {
                        this.score += question.points;
                    }
                }
            
            // CODE (Text, Fill-in-Blank, Debugging)
            } else if (question.type === 'code') {
                let inputElement;
                if (question.subType === 'fill-in-blank') {
                    inputElement = questionElement.querySelector(`.fill-in-blank-input`);
                } else if (question.subType === 'text') {
                    inputElement = questionElement.querySelector(`.code-input`);
                } else if (question.subType === 'debugging') {
                    inputElement = questionElement.querySelector(`.code-textarea`);
                }

                if (inputElement && inputElement.value.trim().length > 0) {
                    const userAnswer = inputElement.value;
                    if (question.checkAnswer(userAnswer)) {
                        this.score += question.points;
                    }
                }
            
            // DRAG & DROP
            } else if (question.type === 'dragdrop') {
                const userAnswer = {}; 
                const dropAreas = questionElement.querySelectorAll('.droppable-area');
                
                // Збираємо відповіді користувача
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


// 2. БАНК ПИТАНЬ (min 15 на рівень)

const beginnerQuestionsBank = [
    // Radio & Checkbox (Основи, Змінні, Типи)
    new RadioQuestion("Що використовується для оголошення змінної, яка може бути переприсвоєна?", ["const", "var", "let", "global"], "let", 1),
    new RadioQuestion("Який оператор використовується для строгого порівняння (значення та тип)?", ["==", "===", "!=", "!=="], "===", 1),
    new SelectQuestion("Який тип даних поверне `typeof 42`?", ["string", "number", "boolean", "undefined"], "number", 1),
    new CheckboxQuestion("Які типи даних є примітивними в JavaScript? (оберіть дві)", ["Object", "String", "Array", "Boolean", "Symbol"], ["String", "Boolean"], 2),
    new CodeQuestion("Яке ключове слово пропущено для оголошення змінної, яка не може бути переприсвоєна?\n[Пропуск] PI = 3.14;", 'fill-in-blank', 'const', 1),
    new RadioQuestion("Що виведе `console.log(10 + '5')`?", ["15", "105", "Error", "NaN"], "105", 1),
    new SelectQuestion("Як оголошується стрілкова функція без параметрів?", ["function() {}", "() => {}", "arrow function()", "func => {}"], "() => {}", 1),
    new RadioQuestion("Що таке 'Hoisting'?", ["Створення нового об'єкта", "Підйом оголошень до початку області видимості", "Закриття функції", "Деструктуризація"], "Підйом оголошень до початку області видимості", 1),
    new CheckboxQuestion("Які цикли існують у JavaScript? (оберіть дві)", ["for", "while", "until", "loop"], ["for", "while"], 2),
    new RadioQuestion("Що означає оператор `!`?", ["Логічне І", "Логічне АБО", "Логічне НІ (заперечення)", "Оператор присвоєння"], "Логічне НІ (заперечення)", 1),
    new CodeQuestion("Яка умова потрібна для того, щоб код виконав `console.log('OK')`?\nconst x = 5;\nif ([Пропуск]) { console.log('OK'); }", 'fill-in-blank', 'x === 5', 1),
    new RadioQuestion("Як називається область видимості, коли функція має доступ до зовнішніх змінних?", ["Global scope", "Local scope", "Closure", "Block scope"], "Closure", 1),
    new RadioQuestion("Який метод додає елемент в кінець масиву?", ["unshift()", "pop()", "push()", "shift()"], "push()", 1),
    new SelectQuestion("Яку команду слід використовувати для створення незмінного оголошення змінної?", ["let name", "var name", "const name", "def name"], "const name", 1),
    new CheckboxQuestion("Які зарезервовані слова використовуються для роботи з класами? (оберіть дві)", ["function", "class", "constructor", "object"], ["class", "constructor"], 2)
];

const intermediateQuestionsBank = [
    // Checkbox & DragDrop (Масиви, Функції, Callback, Об'єкти)
    new CheckboxQuestion("Які методи масиву JS **не** змінюють вихідний масив? (оберіть дві)", ["map", "splice", "filter", "sort"], ["map", "filter"], 2),
    new DragDropQuestion(
        "З'єднайте методи масиву з їхнім призначенням (Балів: 3)",
        ["map()", "filter()", "reduce()"],
        { 
            "map()": "Створює новий масив", 
            "filter()": "Створює масив з елементів, що пройшли тест", 
            "reduce()": "Зводить масив до одного значення"
        },
        3
    ),
    new CodeQuestion(
        "Який метод масиву дозволяє пройтись по кожному елементу масиву і виконати для нього функцію зворотного виклику?\narr.[Пропуск]((item) => { ... });", 
        'fill-in-blank', 
        'forEach', 
        2
    ),
    new SelectQuestion("Що таке **деструктуризація** об'єкта?", ["Створення нового об'єкта", "Виклик методів об'єкта", "Розпакування властивостей об'єкта в окремі змінні", "Злиття об'єктів"], "Розпакування властивостей об'єкта в окремі змінні", 1),
    new RadioQuestion("Як отримати перший елемент масиву `arr` за допомогою деструктуризації?", ["[first] = arr", "arr[0]", "{first} = arr", "const first = arr"], "[first] = arr", 1),
    new DragDropQuestion(
        "З'єднайте синтаксис з типом функції (Балів: 2)",
        ["function foo() {}", "const foo = () => {}"],
        { 
            "function foo() {}": "Звичайна функція", 
            "const foo = () => {}": "Стрілкова функція"
        },
        2
    ),
    new CheckboxQuestion("Які з цих методів використовуються для ітерації по об'єктах? (оберіть дві)", ["Object.keys()", "Object.values()", "Array.map()", "Array.filter()"], ["Object.keys()", "Object.values()"], 2),
    new RadioQuestion("Що таке **callback** функція?", ["Функція, яка викликає іншу функцію", "Функція, передана в іншу функцію як аргумент, для виклику пізніше", "Функція, оголошена всередині класу", "Функція-генератор"], "Функція, передана в іншу функцію як аргумент, для виклику пізніше", 1),
    new RadioQuestion("Яке ключове слово використовується для створення наслідування класів?", ["extends", "inherits", "implements", "uses"], "extends", 1),
    new CodeQuestion(
        "Використовуючи деструктуризацію, отримайте властивість 'city' з об'єкта 'user':\nconst user = { name: 'Alice', city: 'London' };\n[Пропуск] = user;", 
        'fill-in-blank', 
        '{ city }', 
        3
    ),
    new SelectQuestion("Що робить метод `Array.find()`?", ["Повертає новий масив", "Повертає перший елемент, що відповідає умові", "Повертає індекс елемента", "Повертає `true` або `false`"], "Повертає перший елемент, що відповідає умові", 1),
    new CheckboxQuestion("Які методи DOM використовуються для зміни стилів? (оберіть дві)", ["element.classList.add()", "element.style.color = 'red'", "element.id = 'new-id'", "element.innerHTML = 'text'"], ["element.classList.add()", "element.style.color = 'red'"], 2),
    new RadioQuestion("Який метод викликається, коли функція викликає саму себе?", ["Callback", "Higher-order", "Closure", "Recursion"], "Recursion", 1),
    new RadioQuestion("Який тип функції повинен мати клас ES6+?", ["function", "method", "procedure", "constructor"], "constructor", 1),
    new CodeQuestion(
        "Який правильний синтаксис для використання методу `map` для масиву `[1, 2]`? (Повертає `[2, 4]`)\nconst arr = [1, 2];\nconst newArr = arr.map([Пропуск]);", 
        'fill-in-blank', 
        '(x) => x * 2', 
        3
    ),
];

const advancedQuestionsBank = [
    // Code, DragDrop & Debugging (Класи, DOM, Форми, D&D, Складні оператори)
    new CodeQuestion(
        "Виправте помилку в коді: Клас 'Car' повинен мати статичний метод 'getMaxSpeed'.\nclass Car { constructor(model) { this.model = model; } getMaxSpeed() { return 200; } }", 
        'debugging', 
        ['static', 'getMaxSpeed'], 
        5
    ),
    new DragDropQuestion(
        "З'єднайте події DOM з їхнім призначенням (Балів: 3)",
        ["click", "addEventListener", "Delegation"],
        { 
            "click": "Подія натискання миші", 
            "addEventListener": "Прикріплення обробника події", 
            "Delegation": "Обробка подій на батьківському елементі"
        },
        3
    ),
    new CheckboxQuestion("Які методи використовуються для роботи з DOM? (оберіть дві)", ["document.querySelector()", "Node.appendChild()", "Array.push()", "Math.random()"], ["document.querySelector()", "Node.appendChild()"], 2),
    new SelectQuestion("Який метод класу викликається автоматично при створенні нового об'єкта?", ["init()", "start()", "constructor()", "new()"], "constructor()", 1),
    new RadioQuestion("Яким чином можна отримати значення текстового поля форми з ID 'myInput'?", ["myInput.text", "myInput.value", "myInput.innerHTML", "myInput.content"], "myInput.value", 1),
    new CheckboxQuestion("Які з цих JS-методів використовуються для роботи з класами CSS в DOM-елементі? (оберіть дві)", ["classList.add()", "classList.remove()", "style.color", "setAttribute()"], ["classList.add()", "classList.remove()"], 2),
    new CodeQuestion(
        "Який метод використовується для додавання обробника події до елемента DOM?\nelement.[Пропуск]('click', handler);", 
        'fill-in-blank', 
        'addEventListener', 
        2
    ),
    new RadioQuestion("Що відбувається, коли `event.preventDefault()` викликається у обробнику форми `submit`?", ["Форма надсилає дані асинхронно", "Перевіряється валідація даних", "Скасовується стандартна дія надсилання форми", "Запускається функція `onload`"], "Скасовується стандартна дія надсилання форми", 1),
    new DragDropQuestion(
        "З'єднайте атрибути Drag & Drop API з їхнім призначенням (Балів: 2)",
        ["draggable", "dataTransfer"],
        { 
            "draggable": "Вказує, чи можна перетягувати елемент", 
            "dataTransfer": "Зберігає дані під час перетягування"
        },
        2
    ),
    new RadioQuestion("Як зберегти об'єкт `user` у `localStorage`?", ["localStorage.setItem('user', user)", "localStorage.set('user', user)", "localStorage.setItem('user', JSON.stringify(user))", "localStorage.save(user)"], "localStorage.setItem('user', JSON.stringify(user))", 1),
    new SelectQuestion("Що таке 'Closure' (замикання)?", ["Блокування доступу до змінних", "Функція, що запам'ятовує зовнішнє середовище", "Приватний метод класу", "Подія DOM"], "Функція, що запам'ятовує зовнішнє середовище", 1),
    new CodeQuestion(
        "Виправте помилку: `const arr = [1, 2, 3]; const sum = arr.reduce(x, y => x + y, 0);`\nНапишіть правильний синтаксис функції зворотного виклику:", 
        'debugging', 
        ['(x, y) => x + y'], 
        5
    ),
    new RadioQuestion("Який метод використовується для видалення елемента DOM?", ["element.delete()", "element.remove()", "element.detach()", "element.hide()"], "element.remove()", 1),
    new CheckboxQuestion("Які події є частиною Drag & Drop API? (оберіть дві)", ["dragstart", "dragover", "mousedown", "keydown"], ["dragstart", "dragover"], 2),
    new CodeQuestion(
        "Що поверне вираз: `const result = [1, 2, 3].filter(n => n > 1).length;`? (Напишіть тільки число)", 
        'fill-in-blank', 
        '2', 
        1
    ),
];


// 3. Мапа для вибору банку
const questionBanks = {
    beginner: { bank: beginnerQuestionsBank, count: 10 }, 
    intermediate: { bank: intermediateQuestionsBank, count: 10 },
    advanced: { 
        bank: advancedQuestionsBank, 
        count: 10 
    }, 
};


// 4. РОБОТА З DOM ТА ОБРОБКА ПОДІЙ

let currentQuiz = null; 

/** Функція для відображення питань */
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
                    <label class="option-label">
                        <input type="${inputType}" name="q${index}" value="${optionIndex}">
                        ${option}
                    </label>
                `;
            });
            optionsHtml = `<div class="options-group">${optionsHtml}</div>`;
        
        } else if (question.type === 'select') {
            let selectOptions = question.options.map(option => 
                `<option value="${option}">${option}</option>`
            ).join('');
            
            optionsHtml = `
                <select name="q${index}" class="select-answer">
                    <option value="" disabled selected>Оберіть відповідь</option>
                    ${selectOptions}
                </select>
            `;
            
        } else if (question.type === 'code') {
            if (question.subType === 'fill-in-blank') {
                const parts = question.text.split('[Пропуск]');
                optionsHtml = `
                    <p class="code-display">
                        <code>${parts[0].trim()}</code>
                        <input type="text" name="q${index}" class="fill-in-blank-input" placeholder="Введіть пропуск">
                        <code>${parts[1] ? parts[1].trim() : ''}</code>
                    </p>
                `;
            } else if (question.subType === 'debugging' || question.subType === 'text') {
                optionsHtml = `<div class="code-area">
                    <p class="instruction">${question.subType === 'debugging' ? 'Виправте помилки у коді:' : 'Напишіть код:'}</p>
                    ${question.subType === 'debugging' ? `<pre><code>${question.text}</code></pre>` : ''}
                    <textarea name="q${index}" class="code-textarea" rows="4" placeholder="${question.subType === 'debugging' ? 'Напишіть виправлений код тут' : 'Введіть відповідь'}"></textarea>
                </div>`;
            }

        } else if (question.type === 'dragdrop') {
            let draggableItemsHtml = '';
            // Перемішуємо елементи для перетягування у вихідному контейнері
            const shuffledDraggableItems = [...question.options].sort(() => 0.5 - Math.random());
            
            shuffledDraggableItems.forEach(itemText => {
                draggableItemsHtml += `
                    <div class="draggable-item" draggable="true">${itemText}</div>
                `;
            });
            
            let droppableAreasHtml = '';
            // Використовуємо Set для унікальних зон
            const slotNames = Array.from(new Set(Object.values(question.correct))).sort(); 
            
            slotNames.forEach(slotName => {
                droppableAreasHtml += `
                    <div class="droppable-area" data-slot="${slotName}">
                        <span>${slotName}</span>
                    </div>
                `;
            });
            
            optionsHtml = `
                <h4>Елементи для перетягування (Source):</h4>
                <div class="dnd-container" id="draggable-source-${index}" ondragover="event.preventDefault()">
                    ${draggableItemsHtml}
                </div>
                <h4>Зони для відповіді (Targets):</h4>
                <div class="dnd-container droppable-targets" id="droppable-targets-${index}">
                    ${droppableAreasHtml}
                </div>
            `;
        }

        questionDiv.innerHTML = `
            <h3>${index + 1}. ${question.text.split('\n')[0].replace('[Пропуск]', '...')} (Балів: ${question.points})</h3>
            ${optionsHtml}
        `;
        
        container.appendChild(questionDiv);
    });
    
    // Ініціалізуємо D&D після додавання всіх елементів
    initializeDragAndDrop();
    document.getElementById('submit-quiz').disabled = false;
}

/** Функція для відображення результатів */
function showResults(score) {
    document.getElementById('quiz-screen').classList.add('hidden');
    const resultsScreen = document.getElementById('results-screen');
    resultsScreen.classList.remove('hidden');

    const percentage = ((score / currentQuiz.maxScore) * 100).toFixed(1);
    const resultMessage = `Ваш результат: ${score} з ${currentQuiz.maxScore} балів (${percentage}%).`;
    document.getElementById('final-score').textContent = resultMessage;
    
    // Збереження результатів у localStorage
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


// 5. ЛОГІКА DRAG & DROP API

let draggedItem = null; // Глобальна змінна для елемента, що перетягується

function initializeDragAndDrop() {
    // 1. Обробка перетягуваних елементів (dragstart, dragend)
    document.querySelectorAll('.draggable-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            // Зберігаємо текст, хоча в цьому випадку він не використовується для перевірки
            e.dataTransfer.setData('text/plain', e.target.textContent.trim()); 
            e.target.style.opacity = '0.5';
        });

        item.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
            // Очищуємо draggedItem, якщо він не був скинутий
            if (draggedItem && !draggedItem.parentNode.classList.contains('droppable-area')) {
                 draggedItem = null;
            }
        });
    });

    // 2. Обробка зон скидання (dragover, drop, dragleave)
    document.querySelectorAll('.droppable-area').forEach(zone => {
        // Делегування: dragover - дозволяє скидання
        zone.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            // Дозволяємо перетягування лише якщо зона порожня
            if (!e.currentTarget.querySelector('.draggable-item')) {
                e.currentTarget.classList.add('drag-over');
            }
        });

        zone.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            
            // Запобігаємо скиданню, якщо зона вже зайнята
            if (e.currentTarget.querySelector('.draggable-item')) {
                return;
            }
            
            // Якщо draggedItem був у іншій droppable-area, видаляємо клас 'filled'
            if (draggedItem && draggedItem.parentNode && draggedItem.parentNode.classList.contains('droppable-area')) {
                 draggedItem.parentNode.classList.remove('filled');
            }
            
            // Додаємо елемент в нову зону
            e.currentTarget.appendChild(draggedItem);
            e.currentTarget.classList.add('filled');
            
            draggedItem = null; 
        });
        
    });
    
    // 3. Додатковий drop-обробник для повернення елемента у вихідний контейнер
    document.querySelectorAll('.dnd-container:not(.droppable-targets)').forEach(sourceContainer => {
        sourceContainer.addEventListener('dragover', (e) => {
            e.preventDefault(); // Дозволяємо скидання
        });
        
        sourceContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (draggedItem && draggedItem.closest('.question').dataset.index === sourceContainer.closest('.question').dataset.index) {
                // Видаляємо клас .filled у старої droppable-area, якщо він був у ній
                if (draggedItem.parentNode.classList.contains('droppable-area')) {
                    draggedItem.parentNode.classList.remove('filled');
                }
                e.currentTarget.appendChild(draggedItem);
                draggedItem = null;
            }
        });
    });
}


// 6. ІНІЦІАЛІЗАЦІЯ ТА ОСНОВНІ ПОДІЇ

document.addEventListener('DOMContentLoaded', () => {
    const startForm = document.getElementById('start-form');
    const submitQuizButton = document.getElementById('submit-quiz');
    const restartQuizButton = document.getElementById('restart-quiz');
    
    // Елементи Header
    const headerName = document.getElementById('header-name');
    const headerGroup = document.getElementById('header-group');

    // Налаштування теми та ПІБ/групи за замовчуванням
    const defaultName = document.getElementById('name-input').value.trim() || 'Шум Дмитро';
    const defaultGroup = document.getElementById('group-input').value.trim() || 'ТР-43';
    headerName.textContent = defaultName;
    headerGroup.textContent = defaultGroup;
    
    // 1. Обробка форми початку тесту (з валідацією)
    startForm.addEventListener('submit', function(event) {
        **event.preventDefault();** // 🔥 Ключовий крок: Скасовуємо стандартну поведінку submit форми
        
        // Валідація форми
        if (!startForm.checkValidity()) {
             document.getElementById('error-message').textContent = "Будь ласка, заповніть коректно всі поля.";
             return;
        }

        document.getElementById('error-message').textContent = "";
        
        const userName = document.getElementById('name-input').value.trim();
        const userGroup = document.getElementById('group-input').value.trim();
        const selectedLevel = document.getElementById('level-select').value;
        
        const bankData = questionBanks[selectedLevel];
        
        // Оновлення HEADER та інформації на екрані тесту
        headerName.textContent = userName;
        headerGroup.textContent = userGroup;
        
        document.getElementById('user-info-display').textContent = 
            `Студент: ${userName} | Група: ${userGroup}`;
        document.getElementById('quiz-level-display').textContent = 
            document.getElementById('level-select').options[document.getElementById('level-select').selectedIndex].text.split('(')[0].trim();
        
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
