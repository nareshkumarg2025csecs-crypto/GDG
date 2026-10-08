export interface CodelabItem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  category: string;
  color: string;
  url: string;
  tags: string[];
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  speaker: string;
  event: string;
  duration: string;
  youtubeId?: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  color: string;
  tags: string[];
}

export interface RepoItem {
  id: string;
  title: string;
  description: string;
  repoUrl: string;
  cloneUrl?: string;
  stars: number;
  forks: number;
  language: string;
  color: string;
  isTemplate?: boolean;
  hasGoodFirstIssues?: boolean;
  tags: string[];
}

export interface StudyGuideItem {
  id: string;
  title: string;
  role: string;
  duration: string;
  color: string;
  summary: string;
  milestones: Array<{
    step: string;
    title: string;
    description: string;
    resourceName: string;
    resourceUrl: string;
  }>;
  certBadge?: string;
  officialLearnUrl: string;
}

// =========================================================================

// NOTE: Codelab durations above are copied from the official Google Codelabs pages.
// Study-guide durations are intentionally marked "Self-paced" where the official pathway
// does not publish a fixed completion time. Video durations are intentionally not invented
// because the accessible official YouTube metadata did not expose an exact runtime.

// 1. CODELABS DATA (Curated hands-on coding tutorials)
// =========================================================================
export const CODELABS_DATA: CodelabItem[] = [
  {
    id: 'gemini-multimodal',
    title: 'Build Multimodal AI Apps with the Gemini API',
    description: 'Learn how to integrate Gemini 1.5 Flash into your web application for text, image, audio, and PDF understanding with JSON output mode.',
    difficulty: 'Beginner',
    duration: '35 mins',
    category: 'AI & GenAI',
    color: '#4285F4',
    url: 'https://ai.google.dev/gemini-api/docs/quickstart',
    tags: ['Gemini', 'GenAI', 'Prompting', 'Python', 'JSON Mode'],
  },
  {
    id: 'flutter-first-app',
    title: 'Your First Multiplatform Flutter Application',
    description: 'Build a beautiful, responsive mobile and web app using Flutter widgets, stateful logic, and Google Material Design 3 guidelines.',
    difficulty: 'Beginner',
    duration: '45 mins',
    category: 'Mobile Dev',
    color: '#34A853',
    url: 'https://codelabs.developers.google.com/codelabs/flutter-codelab-first',
    tags: ['Flutter', 'Dart', 'Mobile', 'iOS', 'Android'],
  },
  {
    id: 'android-compose-basics',
    title: 'Jetpack Compose Fundamentals for Modern Android',
    description: 'Master Android UI development using declarative layouts, state management, animations, and Material You styling in Kotlin.',
    difficulty: 'Beginner',
    duration: '50 mins',
    category: 'Android',
    color: '#3DDC84',
    url: 'https://developer.android.com/courses/pathways/compose',
    tags: ['Android', 'Kotlin', 'Jetpack Compose', 'UI/UX'],
  },
  {
    id: 'mediapipe-gestures',
    title: 'On-Device Computer Vision with MediaPipe',
    description: 'Implement real-time hand landmark tracking and gesture recognition inside the browser using WebAssembly and MediaPipe vision pipelines.',
    difficulty: 'Intermediate',
    duration: '40 mins',
    category: 'Computer Vision',
    color: '#FBBC04',
    url: 'https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer',
    tags: ['MediaPipe', 'WebAssembly', 'Hand Tracking', 'Vision ML'],
  },
  {
    id: 'firebase-collaborative',
    title: 'Real-Time Web Apps with Firebase & Firestore',
    description: 'Implement user authentication, real-time NoSQL data synchronization, and security rules in a modern single-page web app.',
    difficulty: 'Beginner',
    duration: '40 mins',
    category: 'Web & Backend',
    color: '#FBBC04',
    url: 'https://firebase.google.com/codelabs/firebase-web',
    tags: ['Firebase', 'Firestore', 'Auth', 'WebSockets', 'NoSQL'],
  },
  {
    id: 'angular-signals',
    title: 'Modern Reactive Web Development with Angular Signals',
    description: 'Learn modern Angular reactivity using Signals, standalone components, dynamic control flow syntax, and server-side rendering.',
    difficulty: 'Intermediate',
    duration: '45 mins',
    category: 'Web Dev',
    color: '#EA4335',
    url: 'https://angular.dev/tutorials/first-app',
    tags: ['Angular', 'Signals', 'TypeScript', 'Frontend', 'Reactivity'],
  },
  {
    id: 'bigquery-ml-analytics',
    title: 'Predictive Analytics with BigQuery ML & SQL',
    description: 'Train and evaluate machine learning models directly inside Google BigQuery using standard SQL queries without writing Python.',
    difficulty: 'Intermediate',
    duration: '35 mins',
    category: 'Data & AI',
    color: '#4285F4',
    url: 'https://cloud.google.com/bigquery/docs/bqml-introduction',
    tags: ['BigQuery', 'SQL', 'Machine Learning', 'Data Science'],
  },

  {
    id: 'ai-agent-google-adk',
    title: 'Build an AI Agent with Google ADK',
    description: 'Build a first AI agent with Google’s Agent Development Kit and Gemini, including a planner-and-writer multi-agent workflow.',
    difficulty: 'Beginner',
    duration: '30 mins',
    category: 'AI & GenAI',
    color: '#4285F4',
    url: 'https://codelabs.developers.google.com/build-ai-agent-google-adk',
    tags: ['Google ADK', 'Gemini', 'AI Agents', 'Python', 'Multi-Agent'],
  },
  {
    id: 'cloud-run-streamlit-python',
    title: 'Deploy a Python App to Cloud Run with Streamlit',
    description: 'Build a responsive Streamlit application in Python and deploy it to Google Cloud Run using source-based deployment.',
    difficulty: 'Beginner',
    duration: '30 mins',
    category: 'Cloud & DevOps',
    color: '#34A853',
    url: 'https://codelabs.developers.google.com/codelabs/cloud-run/deploy-python-cloudrun-streamlit',
    tags: ['Python', 'Streamlit', 'Cloud Run', 'Cloud Build', 'Deployment'],
  },
  {
    id: 'scale-agents-adk',
    title: 'Scale Agents with CrewAI, LangGraph, A2A, and ADK',
    description: 'Explore a multi-agent architecture that uses ADK, A2A, CrewAI, and LangGraph to coordinate specialized agents.',
    difficulty: 'Advanced',
    duration: '35 mins',
    category: 'AI & GenAI',
    color: '#EA4335',
    url: 'https://codelabs.developers.google.com/next26/scale-agents',
    tags: ['ADK', 'CrewAI', 'LangGraph', 'A2A', 'Agents'],
  },
  {
    id: 'enhancing-agents-memory',
    title: 'Enhancing Agents with Persistent Memory',
    description: 'Add persistent conversation state, Memory Bank, and retrieval-augmented workflows to an ADK agent.',
    difficulty: 'Advanced',
    duration: '60 mins',
    category: 'AI & GenAI',
    color: '#4285F4',
    url: 'https://codelabs.developers.google.com/next26/dev-keynote/enhancing-agents-with-memory',
    tags: ['ADK', 'Memory', 'RAG', 'Agents', 'Gemini'],
  },
  {
    id: 'agents-skills-tools',
    title: 'Building ADK Agents with Skills and Tools',
    description: 'Learn how to build ADK agents that use specialized skills and tools in a Google Cloud workflow.',
    difficulty: 'Intermediate',
    duration: '45 mins',
    category: 'AI & GenAI',
    color: '#34A853',
    url: 'https://codelabs.developers.google.com/next26/dev-keynote/building-agents-with-skills',
    tags: ['ADK', 'Agent Skills', 'Tools', 'Gemini', 'Google Cloud'],
  },
  {
    id: 'bigquery-context-caching',
    title: 'Context Caching in BigQuery for Grounded GenAI',
    description: 'Use Gemini context caching with BigQuery generative AI functions to work with large, reusable context efficiently.',
    difficulty: 'Advanced',
    duration: '30 mins',
    category: 'Data & AI',
    color: '#FBBC04',
    url: 'https://codelabs.developers.google.com/bigquery-context-caching',
    tags: ['BigQuery', 'Gemini', 'Context Caching', 'GenAI', 'SQL'],
  },
  {
    id: 'gke-bigquery-knowledge-graph',
    title: 'Build a Knowledge Graph with GKE, Gemini, and BigQuery',
    description: 'Process multimedia assets with Gemini on GKE, extract entities and relationships, and build a BigQuery Property Graph.',
    difficulty: 'Advanced',
    duration: '45 mins',
    category: 'Cloud & AI',
    color: '#4285F4',
    url: 'https://codelabs.developers.google.com/gke/ai-toolkit-lab-3',
    tags: ['GKE', 'Gemini', 'BigQuery', 'Knowledge Graph', 'Multimodal AI'],
  },
];

// =========================================================================
// 2. VIDEO LIBRARY DATA (Curated landmark talks & active developer sessions)
// =========================================================================
export const VIDEOS_DATA: VideoItem[] = [
  {
    id: 'gemini-keynote',
    title: 'Google I/O Keynote: Developer Session & Gemini Announcements',
    description: 'Opening developer keynote showcasing Gemini 1.5 Flash, long-context understanding, Gemma open models, and live AI agent demonstrations.',
    speaker: 'Josh Woodward & Google Developer Team',
    event: 'Google I/O Developer Keynote',
    duration: '9:06',
    youtubeId: 'V_-FkyIGUcg',
    youtubeUrl: 'https://www.youtube.com/watch?v=V_-FkyIGUcg',
    thumbnailUrl: 'https://img.youtube.com/vi/V_-FkyIGUcg/maxresdefault.jpg',
    color: '#4285F4',
    tags: ['Gemini', 'Keynote', 'Multimodal', 'Google I/O', 'GenAI'],
  },
  {
    id: 'flutter-forward',
    title: 'Flutter Forward Keynote: Building Adaptive Cross-Platform Apps',
    description: 'Deep dive into adaptive cross-platform UI, Impeller rendering engine, WebAssembly support, and multi-device Flutter architectures.',
    speaker: 'Flutter Developer Relations Team',
    event: 'Flutter Forward Conference',
    duration: '83:31',
    youtubeId: 'goL7tvLQ7Dw',
    youtubeUrl: 'https://www.youtube.com/watch?v=goL7tvLQ7Dw',
    thumbnailUrl: 'https://img.youtube.com/vi/goL7tvLQ7Dw/maxresdefault.jpg',
    color: '#34A853',
    tags: ['Flutter', 'Mobile UI', 'Dart', 'Cross-Platform', 'WebAssembly'],
  },
  {
    id: 'vertex-ai-studio',
    title: 'Introduction to Vertex AI Studio & Cloud Generative AI',
    description: 'Learn how to prototype prompts, manage embeddings, test model parameters, and deploy enterprise GenAI endpoints on Google Cloud.',
    speaker: 'Google Cloud Tech Team',
    event: 'Google Cloud Tech Series',
    duration: '27:50',
    youtubeId: 'KWarqNq195M',
    youtubeUrl: 'https://www.youtube.com/watch?v=KWarqNq195M',
    thumbnailUrl: 'https://img.youtube.com/vi/KWarqNq195M/maxresdefault.jpg',
    color: '#EA4335',
    tags: ['Vertex AI', 'Google Cloud', 'Generative AI', 'Embeddings'],
  },
  {
    id: 'vertex-agent-builder',
    title: 'Building Autonomous AI Agents with Vertex AI Agent Builder',
    description: 'Step-by-step walkthrough of designing conversational agents, connecting custom tools/APIs, and deploying agentic workflows on GCP.',
    speaker: 'Architecture Bytes & Cloud Mentors',
    event: 'GDG Tech Talk Series',
    duration: '14:29',
    youtubeId: 'H6nUoszwcrM',
    youtubeUrl: 'https://www.youtube.com/watch?v=H6nUoszwcrM',
    thumbnailUrl: 'https://img.youtube.com/vi/H6nUoszwcrM/maxresdefault.jpg',
    color: '#FBBC04',
    tags: ['AI Agents', 'Vertex AI', 'Tool Calling', 'Cloud Architecture'],
  },
  {
    id: 'whats-new-android',
    title: "What's New in Modern Android Development & Jetpack Compose",
    description: 'Explore UI breakthroughs in Jetpack Compose, Android toolchain enhancements, performance optimizations, and form-factor adaptability.',
    speaker: 'Android Developer Relations',
    event: 'Google I/O Android Series',
    duration: '42:12',
    youtubeId: '8PxuWdjESfg',
    youtubeUrl: 'https://www.youtube.com/watch?v=8PxuWdjESfg',
    thumbnailUrl: 'https://img.youtube.com/vi/8PxuWdjESfg/maxresdefault.jpg',
    color: '#3DDC84',
    tags: ['Android', 'Jetpack Compose', 'Kotlin', 'Mobile Architecture'],
  },

  {
    id: 'google-io-2026-gemini-antigravity',
    title: 'What’s New in Gemini API, Google AI Studio and Google Antigravity',
    description: 'Google I/O 2026 recap covering Gemini API updates, Google AI Studio, Antigravity, and managed agents.',
    speaker: 'Paige Bailey',
    event: 'Google I/O 2026',
    duration: '0:59',
    youtubeId: '98bQUQUEEJs',
    youtubeUrl: 'https://www.youtube.com/watch?v=98bQUQUEEJs',
    thumbnailUrl: 'https://img.youtube.com/vi/98bQUQUEEJs/maxresdefault.jpg',
    color: '#4285F4',
    tags: ['Gemini API', 'Google AI Studio', 'Antigravity', 'AI Agents', 'Google I/O 2026'],
  },
  {
    id: 'google-io-2026-android',
    title: 'What’s New in Android',
    description: 'Google I/O 2026 recap covering Android development, agentic coding, Android CLI, and new capabilities across device types.',
    speaker: 'Florina Muntenescu',
    event: 'Google I/O 2026',
    duration: '0:59',
    youtubeId: 's7ssP0U7QkQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=s7ssP0U7QkQ',
    thumbnailUrl: 'https://img.youtube.com/vi/s7ssP0U7QkQ/maxresdefault.jpg',
    color: '#34A853',
    tags: ['Android', 'Android CLI', 'Agentic Coding', 'Jetpack Compose', 'Google I/O 2026'],
  },
  {
    id: 'google-io-2026-flutter',
    title: 'What’s New in Flutter',
    description: 'Google I/O 2026 session covering Flutter framework updates, performance improvements, and Flutter GenUI.',
    speaker: 'Khanh Nguyen, Kate Lovett & Li-Te Cheng',
    event: 'Google I/O 2026',
    duration: '54:00',
    youtubeId: '3TfGKugPlpE',
    youtubeUrl: 'https://www.youtube.com/watch?v=3TfGKugPlpE',
    thumbnailUrl: 'https://img.youtube.com/vi/3TfGKugPlpE/maxresdefault.jpg',
    color: '#FBBC04',
    tags: ['Flutter', 'GenUI', 'Dart', 'Multiplatform', 'Google I/O 2026'],
  },
  {
    id: 'android-dev-zone-2026',
    title: 'Android Dev Zone Demos',
    description: 'Google I/O 2026 demos covering Jetpack Compose, multi-screen and multi-device development, Android Studio assistance, and Android skills.',
    speaker: 'Florina Muntenescu',
    event: 'Google I/O 2026',
    duration: '1:31',
    youtubeId: '2ktQlEhuv9A',
    youtubeUrl: 'https://www.youtube.com/watch?v=2ktQlEhuv9A',
    thumbnailUrl: 'https://img.youtube.com/vi/2ktQlEhuv9A/maxresdefault.jpg',
    color: '#EA4335',
    tags: ['Android', 'Jetpack Compose', 'Android Studio', 'AI Agents', 'Google I/O 2026'],
  },
];

// =========================================================================
// 3. GITHUB REPOSITORIES DATA (Campus & community starter boilerplates)
// =========================================================================
export const REPOS_DATA: RepoItem[] = [
  {
    id: 'gemini-hackathon-kit',
    title: 'google-gemini / cookbook',
    description: 'Official Google Gemini examples, notebooks, multimodal guides, and ready-to-deploy Python/TypeScript code recipes.',
    repoUrl: 'https://github.com/google-gemini/cookbook',
    cloneUrl: 'https://github.com/google-gemini/cookbook.git',
    stars: 17817,
    forks: 2794,
    language: 'Python',
    color: '#34A853',
    isTemplate: true,
    hasGoodFirstIssues: true,
    tags: ['Python', 'Gemini API', 'Jupyter', 'LLM Recipes', 'Streaming'],
  },
  {
    id: 'genkit-firebase-template',
    title: 'firebase / genkit',
    description: 'Open-source framework from Google for building, testing, and deploying AI-powered applications with Node.js and Go.',
    repoUrl: 'https://github.com/firebase/genkit',
    cloneUrl: 'https://github.com/firebase/genkit.git',
    stars: 6475,
    forks: 858,
    language: 'TypeScript',
    color: '#FBBC04',
    isTemplate: true,
    hasGoodFirstIssues: true,
    tags: ['Firebase Genkit', 'TypeScript', 'Node.js', 'Go', 'AI Flows'],
  },
  {
    id: 'flutter-campus-shell',
    title: 'flutter / samples',
    description: 'A curated collection of official Flutter sample apps showcasing Material Design 3, animations, state management, and platform integration.',
    repoUrl: 'https://github.com/flutter/samples',
    cloneUrl: 'https://github.com/flutter/samples.git',
    stars: 19273,
    forks: 7865,
    language: 'Dart',
    color: '#4285F4',
    isTemplate: true,
    tags: ['Flutter', 'Dart', 'Material 3', 'Mobile & Desktop', 'Samples'],
  },
  {
    id: 'android-architecture-sample',
    title: 'android / nowinandroid',
    description: 'Official Android reference project following modern app architecture guidelines using Kotlin, Jetpack Compose, Coroutines, and Hilt.',
    repoUrl: 'https://github.com/android/nowinandroid',
    cloneUrl: 'https://github.com/android/nowinandroid.git',
    stars: 21889,
    forks: 4658,
    language: 'Kotlin',
    color: '#3DDC84',
    hasGoodFirstIssues: true,
    tags: ['Android', 'Kotlin', 'Jetpack Compose', 'Hilt', 'Clean Architecture'],
  },
  {
    id: 'cloud-run-express-kit',
    title: 'GoogleCloudPlatform / cloud-run-samples',
    description: 'Production-ready containerized microservice samples and starters across Node.js, Python, Go, and Java for Google Cloud Run.',
    repoUrl: 'https://github.com/GoogleCloudPlatform/cloud-run-samples',
    cloneUrl: 'https://github.com/GoogleCloudPlatform/cloud-run-samples.git',
    stars: 310,
    forks: 118,
    language: 'JavaScript',
    color: '#EA4335',
    isTemplate: true,
    tags: ['Cloud Run', 'Docker', 'Containers', 'Microservices', 'GCP'],
  },
  {
    id: 'dsa-competitive-vault',
    title: 'google / coding-competitions-archive',
    description: 'Official archive of problems, algorithmic test cases, and solutions from Google Code Jam, Hash Code, and Kick Start.',
    repoUrl: 'https://github.com/google/coding-competitions-archive',
    cloneUrl: 'https://github.com/google/coding-competitions-archive.git',
    stars: 1394,
    forks: 364,
    language: 'C++',
    color: '#FBBC04',
    hasGoodFirstIssues: true,
    tags: ['DSA', 'Algorithms', 'Code Jam', 'Kick Start', 'C++'],
  },

  {
    id: 'google-adk-samples',
    title: 'google / adk-samples',
    description: 'Official ADK recipes with runnable agent examples for common AI-agent patterns and real-world use cases.',
    repoUrl: 'https://github.com/google/adk-samples',
    cloneUrl: 'https://github.com/google/adk-samples.git',
    stars: 10000,
    forks: 2900,
    language: 'Python',
    color: '#4285F4',
    isTemplate: true,
    hasGoodFirstIssues: false,
    tags: ['Google ADK', 'AI Agents', 'Python', 'Agent Recipes'],
  },
  {
    id: 'google-tunix',
    title: 'google / tunix',
    description: 'JAX-based library for post-training large language models with supervised fine-tuning, reinforcement learning, and agentic RL.',
    repoUrl: 'https://github.com/google/tunix',
    cloneUrl: 'https://github.com/google/tunix.git',
    stars: 2500,
    forks: 357,
    language: 'Python',
    color: '#34A853',
    isTemplate: false,
    hasGoodFirstIssues: false,
    tags: ['LLM', 'JAX', 'Fine-Tuning', 'Reinforcement Learning', 'Agentic RL'],
  },
  {
    id: 'gemini-api-examples',
    title: 'google-gemini / api-examples',
    description: 'Runnable Gemini API examples organized by programming language and embedded into Google’s API documentation.',
    repoUrl: 'https://github.com/google-gemini/api-examples',
    cloneUrl: 'https://github.com/google-gemini/api-examples.git',
    stars: 140,
    forks: 63,
    language: 'Python',
    color: '#FBBC04',
    isTemplate: true,
    hasGoodFirstIssues: false,
    tags: ['Gemini API', 'Python', 'JavaScript', 'Go', 'Java'],
  },
  {
    id: 'google-ai-studio-starter-applets',
    title: 'google-gemini / starter-applets',
    description: 'Google AI Studio starter applications demonstrating spatial understanding, video analysis, and Maps integrations with Gemini.',
    repoUrl: 'https://github.com/google-gemini/starter-applets',
    cloneUrl: 'https://github.com/google-gemini/starter-applets.git',
    stars: 1400,
    forks: 454,
    language: 'TypeScript',
    color: '#4285F4',
    isTemplate: true,
    hasGoodFirstIssues: false,
    tags: ['Gemini', 'AI Studio', 'React', 'Video Analysis', 'Google Maps'],
  },
  {
    id: 'firebase-quickstart-js',
    title: 'firebase / quickstart-js',
    description: 'Official Firebase web quickstarts covering authentication, Firestore, Storage, Functions, Messaging, and more.',
    repoUrl: 'https://github.com/firebase/quickstart-js',
    cloneUrl: 'https://github.com/firebase/quickstart-js.git',
    stars: 5400,
    forks: 3700,
    language: 'TypeScript',
    color: '#EA4335',
    isTemplate: true,
    hasGoodFirstIssues: false,
    tags: ['Firebase', 'JavaScript', 'Authentication', 'Firestore', 'Web'],
  },
  {
    id: 'firebase-quickstart-nodejs',
    title: 'firebase / quickstart-nodejs',
    description: 'Official Firebase Node.js quickstarts demonstrating the Admin SDK, Auth sessions, Remote Config, Messaging, and ML management.',
    repoUrl: 'https://github.com/firebase/quickstart-nodejs',
    cloneUrl: 'https://github.com/firebase/quickstart-nodejs.git',
    stars: 933,
    forks: 426,
    language: 'JavaScript',
    color: '#FBBC04',
    isTemplate: true,
    hasGoodFirstIssues: false,
    tags: ['Firebase', 'Node.js', 'Admin SDK', 'Authentication', 'Messaging'],
  },
  {
    id: 'mediapipe-core',
    title: 'google-ai-edge / mediapipe',
    description: 'Google’s cross-platform MediaPipe framework for customizable machine-learning solutions across live and streaming media.',
    repoUrl: 'https://github.com/google-ai-edge/mediapipe',
    cloneUrl: 'https://github.com/google-ai-edge/mediapipe.git',
    stars: 37200,
    forks: 6200,
    language: 'C++',
    color: '#34A853',
    isTemplate: false,
    hasGoodFirstIssues: false,
    tags: ['MediaPipe', 'Computer Vision', 'ML', 'Android', 'Web'],
  },
  {
    id: 'mediapipe-samples',
    title: 'google-ai-edge / mediapipe-samples',
    description: 'Official MediaPipe samples, tutorials, and codelabs for building practical computer-vision and perception applications.',
    repoUrl: 'https://github.com/google-ai-edge/mediapipe-samples',
    cloneUrl: 'https://github.com/google-ai-edge/mediapipe-samples.git',
    stars: 2800,
    forks: 776,
    language: 'Python',
    color: '#4285F4',
    isTemplate: true,
    hasGoodFirstIssues: false,
    tags: ['MediaPipe', 'Computer Vision', 'Samples', 'Vision AI'],
  },
];

// =========================================================================
// 4. STUDY GUIDES & ROADMAPS DATA (Step-by-step career tracks & badges)
// =========================================================================
export const STUDY_GUIDES_DATA: StudyGuideItem[] = [
  {
    id: 'guide-ai-engineer',
    title: 'Generative AI & Machine Learning Track',
    role: 'AI Engineer / ML Researcher',
    duration: '6 Weeks (Self-Paced)',
    color: '#4285F4',
    summary: 'Master foundational neural networks, prompt engineering with Gemini, multimodal workflows, and deploying GenAI applications.',
    certBadge: 'Google Cloud Generative AI Skill Badge',
    officialLearnUrl: 'https://www.cloudskillsboost.google/paths/118',
    milestones: [
      {
        step: '01',
        title: 'Prompt Engineering & Multimodality',
        description: 'Learn zero-shot, few-shot, and system instructions using Google AI Studio and Gemini 1.5.',
        resourceName: 'Prompting Guidelines Codelab',
        resourceUrl: 'https://ai.google.dev/docs/prompt_best_practices',
      },
      {
        step: '02',
        title: 'Function Calling & Structured Outputs',
        description: 'Equip models with custom tools to query databases and execute code automatically.',
        resourceName: 'Gemini Function Calling Guide',
        resourceUrl: 'https://ai.google.dev/gemini-api/docs/function-calling',
      },
      {
        step: '03',
        title: 'Retrieval Augmented Generation (RAG)',
        description: 'Connect models to private document knowledge bases using vector embeddings and search.',
        resourceName: 'Vertex AI Search & Conversation',
        resourceUrl: 'https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings',
      },
      {
        step: '04',
        title: 'Fine-Tuning Open Weights Models',
        description: 'Fine-tune Gemma 2 models locally on specialized datasets with LoRA and PyTorch.',
        resourceName: 'Gemma Fine-Tuning Tutorial',
        resourceUrl: 'https://ai.google.dev/gemma/docs/lora_tuning',
      },
    ],
  },
  {
    id: 'guide-mobile-flutter',
    title: 'Cross-Platform Mobile App Architect',
    role: 'Mobile & Flutter Engineer',
    duration: '5 Weeks (Self-Paced)',
    color: '#34A853',
    summary: 'Build production iOS and Android applications from a single codebase with native performance, offline persistence, and Firebase.',
    certBadge: 'Flutter Certified Developer Pathway',
    officialLearnUrl: 'https://flutter.dev/learn',
    milestones: [
      {
        step: '01',
        title: 'Dart Foundations & Sound Null Safety',
        description: 'Master asynchronous Dart streams, futures, functional collections, and OOP patterns.',
        resourceName: 'Dart Language Tour',
        resourceUrl: 'https://dart.dev/guides/language/language-tour',
      },
      {
        step: '02',
        title: 'Widget Trees & Responsive Layouts',
        description: 'Build flexible user interfaces implementing Material Design 3 and Cupertino styles.',
        resourceName: 'Flutter Widget Catalog',
        resourceUrl: 'https://docs.flutter.dev/ui/widgets',
      },
      {
        step: '03',
        title: 'State Management & Architecture',
        description: 'Organize apps with clean architecture, dependency injection, and state management.',
        resourceName: 'Flutter State Architecture Guide',
        resourceUrl: 'https://docs.flutter.dev/data-and-backend/state-mgmt/intro',
      },
      {
        step: '04',
        title: 'Firebase Integration & App Deployment',
        description: 'Add Google Authentication, cloud push notifications, and publish to Google Play Store.',
        resourceName: 'Flutter Firebase Integration',
        resourceUrl: 'https://firebase.google.com/docs/flutter/setup',
      },
    ],
  },
  {
    id: 'guide-android-engineer',
    title: 'Modern Android Developer Track',
    role: 'Android Engineer',
    duration: '6 Weeks (Self-Paced)',
    color: '#3DDC84',
    summary: 'Master modern Android application architecture using Kotlin, Jetpack Compose, Coroutines, Flow, and Room local persistence.',
    certBadge: 'Associate Android Developer Certification',
    officialLearnUrl: 'https://developer.android.com/courses/android-basics-compose/course',
    milestones: [
      {
        step: '01',
        title: 'Kotlin Fundamentals & Coroutines',
        description: 'Master asynchronous programming, state flows, and functional Kotlin syntax.',
        resourceName: 'Kotlin for Android Developers',
        resourceUrl: 'https://developer.android.com/kotlin/campaign/learn',
      },
      {
        step: '02',
        title: 'Declarative UI with Jetpack Compose',
        description: 'Design dynamic layouts, manage compose state, dynamic themes, and UI animations.',
        resourceName: 'Jetpack Compose Tutorial',
        resourceUrl: 'https://developer.android.com/jetpack/compose/tutorial',
      },
      {
        step: '03',
        title: 'Data Layer, Room & Retrofit',
        description: 'Implement offline-first data caching with Room DB and consume RESTful web APIs.',
        resourceName: 'Android Architecture Data Layer',
        resourceUrl: 'https://developer.android.com/topic/architecture/data-layer',
      },
      {
        step: '04',
        title: 'Dependency Injection & Testing',
        description: 'Architect scalable apps with Hilt dependency injection, unit testing, and UI testing.',
        resourceName: 'Dependency Injection with Hilt',
        resourceUrl: 'https://developer.android.com/training/dependency-injection/hilt-android',
      },
    ],
  },
  {
    id: 'guide-cloud-associate',
    title: 'Google Cloud & DevOps Specialist',
    role: 'Cloud Architect / DevOps Engineer',
    duration: '8 Weeks (Self-Paced)',
    color: '#EA4335',
    summary: 'Prepare for official Google Cloud certifications with hands-on labs covering IAM, Cloud Run, GKE, and automated CI/CD pipelines.',
    certBadge: 'Associate Cloud Engineer (ACE)',
    officialLearnUrl: 'https://cloud.google.com/learn/certification/cloud-engineer',
    milestones: [
      {
        step: '01',
        title: 'GCP Hierarchy, Projects & IAM',
        description: 'Configure organizations, projects, service accounts, and least-privilege security roles.',
        resourceName: 'GCP IAM Documentation',
        resourceUrl: 'https://cloud.google.com/iam/docs',
      },
      {
        step: '02',
        title: 'Serverless Containers with Cloud Run',
        description: 'Package applications into Docker containers and deploy autoscaling web services.',
        resourceName: 'Cloud Run Quickstart',
        resourceUrl: 'https://cloud.google.com/run/docs/quickstarts',
      },
      {
        step: '03',
        title: 'Managed Kubernetes (GKE Clusters)',
        description: 'Deploy, scale, and manage container workloads across Google Kubernetes Engine.',
        resourceName: 'GKE Kubernetes Basics',
        resourceUrl: 'https://cloud.google.com/kubernetes-engine/docs/quickstarts',
      },
      {
        step: '04',
        title: 'Monitoring, Logging & Cloud Build',
        description: 'Set up Cloud Operations monitoring dashboards, automated alerts, and CI/CD pipelines.',
        resourceName: 'Cloud Build & Operations',
        resourceUrl: 'https://cloud.google.com/build/docs',
      },
    ],
  },
  {
    id: 'guide-data-engineer',
    title: 'Cloud Data Engineering & BigQuery Track',
    role: 'Data Engineer / Analytics Engineer',
    duration: '7 Weeks (Self-Paced)',
    color: '#4285F4',
    summary: 'Design data pipelines, execute real-time streaming analytics, and build enterprise data warehouses on Google Cloud Platform.',
    certBadge: 'Professional Data Engineer Certification',
    officialLearnUrl: 'https://cloud.google.com/learn/certification/data-engineer',
    milestones: [
      {
        step: '01',
        title: 'Data Warehousing with BigQuery',
        description: 'Optimize SQL queries, partitioned tables, clustered indexes, and data security.',
        resourceName: 'BigQuery Documentation',
        resourceUrl: 'https://cloud.google.com/bigquery/docs',
      },
      {
        step: '02',
        title: 'Streaming & Batch Processing (Dataflow)',
        description: 'Build Apache Beam pipelines for ETL processing with Google Cloud Dataflow.',
        resourceName: 'Cloud Dataflow Overview',
        resourceUrl: 'https://cloud.google.com/dataflow/docs',
      },
      {
        step: '03',
        title: 'Event-Driven Architectures (Pub/Sub)',
        description: 'Decouple microservices and ingest high-throughput real-time streaming data.',
        resourceName: 'Pub/Sub Publisher/Subscriber',
        resourceUrl: 'https://cloud.google.com/pubsub/docs',
      },
      {
        step: '04',
        title: 'Data Governance & Orchestration',
        description: 'Orchestrate workflows using Cloud Composer (Airflow) and govern metadata with Dataplex.',
        resourceName: 'Cloud Composer Quickstart',
        resourceUrl: 'https://cloud.google.com/composer/docs',
      },
    ],
  },
  {
    id: 'guide-modern-web',
    title: 'Full-Stack Web & Performance Track',
    role: 'Modern Web Engineer',
    duration: '4 Weeks (Self-Paced)',
    color: '#FBBC04',
    summary: 'Build high-performance, accessible web applications with Core Web Vitals optimization, TypeScript, and modern frameworks.',
    certBadge: 'web.dev Certified Assessment',
    officialLearnUrl: 'https://web.dev/learn',
    milestones: [
      {
        step: '01',
        title: 'TypeScript & Semantic Accessibility',
        description: 'Strict TypeScript patterns, ARIA attributes, semantic HTML5, and WCAG 2.2 guidelines.',
        resourceName: 'web.dev Learn Accessibility',
        resourceUrl: 'https://web.dev/learn/accessibility',
      },
      {
        step: '02',
        title: 'Core Web Vitals & Performance',
        description: 'Optimize Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and INP.',
        resourceName: 'Optimize Core Web Vitals',
        resourceUrl: 'https://web.dev/explore/fast',
      },
      {
        step: '03',
        title: 'Progressive Web Apps & Offline Sync',
        description: 'Implement Service Workers, Web App Manifests, and background synchronization.',
        resourceName: 'PWA Development Guide',
        resourceUrl: 'https://web.dev/learn/pwa',
      },
      {
        step: '04',
        title: 'Serverless Edge & API Security',
        description: 'Deploy on global edge CDNs with security headers (CSP, CORS) and rate limiting.',
        resourceName: 'Web Security Guidelines',
        resourceUrl: 'https://web.dev/explore/security',
      },
    ],
  },
  {
    id: 'guide-flutter-apps',
    title: 'Build Apps with Flutter',
    role: 'Flutter Developer',
    duration: 'Self-paced',
    color: '#34A853',
    summary: 'Learn to build natively compiled desktop, mobile, and web applications from a single Flutter codebase.',
    officialLearnUrl: 'https://developers.google.com/learn/pathways/intro-to-flutter',
    milestones: [
      {
        step: '01',
        title: 'Flutter Foundations',
        description: 'Understand how Flutter approaches cross-platform application development.',
        resourceName: 'Build apps with Flutter',
        resourceUrl: 'https://developers.google.com/learn/pathways/intro-to-flutter',
      },
      {
        step: '02',
        title: 'Your First Flutter App',
        description: 'Build a responsive Flutter application through the official introductory codelab.',
        resourceName: 'Flutter Codelabs',
        resourceUrl: 'https://docs.flutter.dev/codelabs',
      },
    ],
  },
  {
    id: 'guide-web-accessibility',
    title: 'Web Accessibility',
    role: 'Frontend Developer / UI Engineer',
    duration: 'Self-paced',
    color: '#EA4335',
    summary: 'Learn practical accessibility principles for building web interfaces that work well for a broader range of users.',
    officialLearnUrl: 'https://web.dev/learn/accessibility',
    milestones: [
      {
        step: '01',
        title: 'Accessibility Fundamentals',
        description: 'Learn semantic HTML, accessible names, keyboard interaction, and other accessibility foundations.',
        resourceName: 'Learn Accessibility',
        resourceUrl: 'https://web.dev/learn/accessibility',
      },
      {
        step: '02',
        title: 'Accessible Components',
        description: 'Apply accessibility practices to common interactive UI patterns.',
        resourceName: 'Web Accessibility Guidance',
        resourceUrl: 'https://www.w3.org/WAI/fundamentals/accessibility-intro/',
      },
    ],
  },
  {
    id: 'guide-web-performance',
    title: 'Web Performance',
    role: 'Frontend / Performance Engineer',
    duration: 'Self-paced',
    color: '#FBBC04',
    summary: 'Learn the fundamentals of web performance and techniques for improving the loading and responsiveness of web experiences.',
    officialLearnUrl: 'https://web.dev/learn/performance',
    milestones: [
      {
        step: '01',
        title: 'Performance Fundamentals',
        description: 'Learn the core concepts behind fast and responsive web experiences.',
        resourceName: 'Learn Performance',
        resourceUrl: 'https://web.dev/learn/performance',
      },
      {
        step: '02',
        title: 'Core Web Vitals',
        description: 'Study the metrics used to evaluate loading, responsiveness, and visual stability.',
        resourceName: 'Core Web Vitals',
        resourceUrl: 'https://web.dev/articles/vitals',
      },
    ],
  },
];