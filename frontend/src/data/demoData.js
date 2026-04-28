export const DEMO_TYPING_TEXT = `Machine learning is a transformative subset of artificial intelligence that enables computers to learn from experience without being explicitly programmed. At its core, ML uses algorithms and statistical models to identify patterns in data, allowing systems to make intelligent decisions. The three main paradigms are supervised learning, unsupervised learning, and reinforcement learning. Key concepts include neural networks, gradient descent, overfitting, and model evaluation metrics such as precision, recall, and F1 score.`;

export const DEMO_RESULT = {
  meta: {
    title: "Machine Learning Fundamentals",
    difficulty: "intermediate",
    readingTime: 2,
    wordCount: 89,
    language: "English",
  },
  summary: `Machine learning (ML) is a branch of artificial intelligence where systems learn from data to improve their performance on tasks without explicit programming. Unlike traditional software that follows fixed rules, ML models identify patterns and make data-driven decisions autonomously.\n\nThe field encompasses three primary learning paradigms: supervised learning (training on labeled data), unsupervised learning (finding hidden patterns), and reinforcement learning (learning through rewards and penalties). Each paradigm suits different problem types and real-world applications.\n\nCore technical concepts include neural networks — brain-inspired computational architectures — gradient descent (the optimization algorithm that trains models), and critical evaluation metrics like precision, recall, and F1 score. Understanding overfitting, where a model memorizes training data instead of generalizing, is essential for building robust and reliable ML systems.`,
  keyPoints: [
    "ML enables computers to learn from experience without explicit programming rules",
    "Three main paradigms: supervised, unsupervised, and reinforcement learning",
    "Neural networks are brain-inspired computational architectures with layered neurons",
    "Gradient descent is the primary optimization algorithm used during model training",
    "Model evaluation relies on precision, recall, and F1 score metrics",
    "Overfitting occurs when a model memorizes training data instead of generalizing",
  ],
  learningObjectives: [
    "Understand the difference between AI, ML, and deep learning",
    "Identify the three main ML paradigms and their use cases",
    "Explain neural networks and gradient descent at a conceptual level",
    "Apply precision, recall, and F1 score to evaluate model performance",
    "Recognize overfitting and describe strategies to prevent it",
  ],
  concepts: [
    "Machine Learning",
    "Neural Networks",
    "Gradient Descent",
    "Supervised Learning",
    "Unsupervised Learning",
    "Reinforcement Learning",
    "Overfitting",
    "Precision & Recall",
    "F1 Score",
  ],
  keyQuote: "Machine learning is the field of study that gives computers the ability to learn without being explicitly programmed. — Arthur Samuel, 1959",
  questions: [
    {
      question: "What distinguishes machine learning from traditional software?",
      answer: "ML systems learn patterns from data automatically, while traditional software follows explicitly programmed rules.",
    },
    {
      question: "When would you use unsupervised learning?",
      answer: "When you have unlabeled data and want to discover hidden patterns or groupings, such as customer segmentation.",
    },
    {
      question: "What is overfitting and why is it a problem?",
      answer: "Overfitting is when a model learns training data too precisely and cannot generalize to new, unseen data.",
    },
  ],
  flashcards: [
    {
      front: "What is machine learning?",
      back: "A subset of AI that enables systems to learn from data and improve their performance without explicit programming.",
    },
    {
      front: "What are the three ML paradigms?",
      back: "Supervised learning, unsupervised learning, and reinforcement learning — each suited to different problem types.",
    },
    {
      front: "What is gradient descent?",
      back: "An optimization algorithm that minimizes a loss function by iteratively adjusting model parameters in the direction of steepest descent.",
    },
    {
      front: "What is overfitting?",
      back: "When a model performs well on training data but poorly on new data — it memorized examples instead of learning patterns.",
    },
    {
      front: "What is the F1 score?",
      back: "A metric that balances precision and recall, calculated as their harmonic mean. Useful when class imbalance exists.",
    },
    {
      front: "What is a neural network?",
      back: "A computational model inspired by the human brain, consisting of layers of interconnected nodes (neurons) that process and transform data.",
    },
  ],
  quiz: [
    {
      question: "What is the primary goal of machine learning?",
      options: [
        "To follow explicitly programmed rules",
        "To enable computers to learn from data automatically",
        "To replace human intelligence entirely",
        "To store and retrieve large amounts of data",
      ],
      correctAnswer: 1,
      explanation: "ML enables systems to learn patterns from data without needing explicit programming for each task — the model improves through experience.",
    },
    {
      question: "Which learning paradigm uses labeled training data?",
      options: [
        "Unsupervised learning",
        "Reinforcement learning",
        "Supervised learning",
        "Transfer learning",
      ],
      correctAnswer: 2,
      explanation: "Supervised learning trains models on input-output pairs (labeled data) to learn a mapping function from inputs to correct outputs.",
    },
    {
      question: "What does gradient descent minimize?",
      options: [
        "The number of parameters",
        "The training dataset size",
        "The model's accuracy",
        "The loss function",
      ],
      correctAnswer: 3,
      explanation: "Gradient descent iteratively adjusts model parameters to minimize the loss function — the measure of prediction error on training data.",
    },
    {
      question: "What is overfitting?",
      options: [
        "Training a model on too little data",
        "A model that generalizes too well to new data",
        "A model that memorizes training data and fails to generalize",
        "When model accuracy exceeds 100%",
      ],
      correctAnswer: 2,
      explanation: "Overfitting occurs when a model learns training data too precisely, capturing noise rather than true patterns, and fails on unseen examples.",
    },
    {
      question: "Which metric combines precision and recall?",
      options: [
        "Accuracy",
        "F1 Score",
        "AUC-ROC",
        "Mean Squared Error",
      ],
      correctAnswer: 1,
      explanation: "The F1 score is the harmonic mean of precision and recall, providing a balanced performance measure especially useful for imbalanced datasets.",
    },
  ],
  studyTips: [
    "Start with supervised learning before moving to more complex paradigms",
    "Implement a simple model (e.g., linear regression) from scratch to build intuition",
    "Practice evaluating models using precision, recall, and F1 score on real datasets",
  ],
};
