const quizzes = {
    supervised: [
        {
            q: "What does the 'K' in KNN stand for?",
            options: ["Kernel size", "Number of nearest neighbors", "K-Means", "Knowledge nodes"],
            correct: 1
        },
        {
            q: "How does KNN classify a new drawing?",
            options: ["Using backpropagation", "Random guessing", "Measuring distance to known examples", "Applying a convolution matrix"],
            correct: 2
        },
        {
            q: "KNN is considered what type of learning?",
            options: ["Supervised (because data is labeled)", "Unsupervised", "Reinforcement", "Deep Learning"],
            correct: 0
        },
        {
            q: "Does KNN have an explicit training phase?",
            options: ["Yes, it trains for hours", "No, it just memorizes the training data", "Yes, it trains neural weights", "Yes, but it is instant"],
            correct: 1
        },
        {
            q: "What distance formula does our 8x8 grid classifier primarily use mathematically?",
            options: ["Manhattan Distance", "Cosign Similarity", "Euclidean (Pythagorean) Distance", "Pearson Correlation"],
            correct: 2
        }
    ],
    clustering: [
        {
            q: "What is the primary goal of Unsupervised algorithms like K-Means?",
            options: ["To beat high scores", "To predict labeled answers", "To discover hidden groupings inside raw unlabelled data", "To extract text from images"],
            correct: 2
        },
        {
            q: "What does the centroid represent in K-Means?",
            options: ["The geometric center (average) of a cluster of points", "A random data point that doesn't move", "The fastest point", "The outlier"],
            correct: 0
        },
        {
            q: "How are individual stars assigned to a cluster?",
            options: ["They are assigned absolutely randomly", "They belong to the centroid they are geometrically closest to", "They vote for a cluster", "Based on their color only"],
            correct: 1
        },
        {
            q: "When does the K-Means algorithm stop calculating (Converge)?",
            options: ["When time runs out", "When it reaches 100 clusters", "When the centroids stop shifting position", "After exactly 5 iterations"],
            correct: 2
        },
        {
            q: "What does 'K' represent in this specific lab?",
            options: ["Total number of stars", "Number of centroids/groups requested", "Maximum width of the screen", "Knowledge variance"],
            correct: 1
        }
    ],
    rl: [
        {
            q: "How do the cars act inside the Reinforcement Arena?",
            options: ["They learn from historical datasets", "They operate using raw trial, error, and natural selection", "They follow a predefined path exactly", "They learn from human driving commands"],
            correct: 1
        },
        {
            q: "What serves as the 'Brain' computing steering values for each car?",
            options: ["A Feed-Forward Neural Network", "A Support Vector Machine", "An IF/ELSE ruleset", "A Database query"],
            correct: 0
        },
        {
            q: "What does 'Fitness' measure in this specific simulation?",
            options: ["Number of crashes", "Track progress completed before crashing", "Top speed reached", "Fuel efficiency"],
            correct: 1
        },
        {
            q: "How are cars generated for the NEXT Generation?",
            options: ["They are created entirely randomly again", "Deep learning updates their weights via loss function", "The best performers survive and breed offspring with slight random mutations", "Older cars are manually deleted"],
            correct: 2
        },
        {
            q: "Why do we apply a 5% 'Mutation Rate' to weights?",
            options: ["To break the neural network on purpose", "To randomly explore new driving behaviors that might be better", "To make cars slower", "To prevent the physics engine from crashing"],
            correct: 1
        }
    ]
};

// Logic to render and manage state
function initQuiz(containerId, quizData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let currentQ = 0;
    let score = 0;

    function renderQuestion() {
        if(currentQ >= quizData.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem 0;">
                    <h5 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary);">Quiz Complete! 🎉</h5>
                    <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 1.5rem;">You scored ${score} out of ${quizData.length}!</p>
                    <button class="secondary-btn" id="restart-${containerId}">Restart Quiz</button>
                </div>
            `;
            document.getElementById(`restart-${containerId}`).addEventListener('click', () => {
                currentQ = 0; score = 0; renderQuestion();
            });
            return;
        }

        const q = quizData[currentQ];
        let optionsHtml = '';
        q.options.forEach((opt, idx) => {
            optionsHtml += `<button class="quiz-option" data-idx="${idx}">${opt}</button>`;
        });

        container.innerHTML = `
            <h5>Knowledge Check (${currentQ + 1}/${quizData.length})</h5>
            <div class="quiz-question-text">${q.q}</div>
            <div class="quiz-options">${optionsHtml}</div>
            <div class="quiz-footer">
                <span class="quiz-score">Current Score: ${score}</span>
            </div>
        `;

        const buttons = container.querySelectorAll('.quiz-option');
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Prevent multiple clicks
                if(container.querySelector('.correct')) return;
                
                let selectedIdx = parseInt(this.getAttribute('data-idx'));
                if(selectedIdx === q.correct) {
                    this.classList.add('correct');
                    score++;
                } else {
                    this.classList.add('wrong');
                    buttons[q.correct].classList.add('correct');
                }
                
                setTimeout(() => {
                    currentQ++;
                    renderQuestion();
                }, 1500);
            });
        });
    }

    renderQuestion();
}

window.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure DOM is fully ready if script is loaded synchronously
    setTimeout(() => {
        initQuiz('quiz-supervised', quizzes.supervised);
        initQuiz('quiz-clustering', quizzes.clustering);
        initQuiz('quiz-rl', quizzes.rl);
    }, 100);
});
