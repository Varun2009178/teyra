# 🤖 Teyra AI Features Documentation

## Overview
Teyra is an AI-powered productivity app that uses Groq API to provide intelligent task management, personalized suggestions, and mood-aware assistance. The AI system creates a comprehensive, adaptive productivity experience that feels personal and genuinely helpful.

## 🚀 AI Features Overview

### 1. AI Quick Wins (Task Breakdown)
- **Location**: Appears after submitting complex tasks (>25 characters)
- **Function**: Breaks down vague tasks into 3 specific, actionable steps
- **Trigger**: Automatic after task submission (Basic/Pro plans)
- **Example**: "Clean my room" → ["Pick up clothes from floor", "Organize desk items", "Vacuum the carpet"]
- **Mood Adaptation**: Adjusts suggestions based on user mood (tired = easier tasks, energized = more ambitious)

### 2. AI Task Clarification
- **Function**: Makes vague tasks more specific and energizing
- **Example**: "Study" → "Review chapter 5 notes for 30 minutes with a coffee break"
- **Usage**: Part of the AI suggestions bundle

### 3. AI Effort Estimation
- **Function**: Provides time estimates and effort levels for tasks
- **Output**: "Easy - 15 minutes" or "Challenging - 2 hours"
- **Display**: Shows in AI suggestions cards

### 4. AI Task Clarity Check
- **Function**: Detects if tasks need clarification
- **Output**: Boolean + reason why task might be unclear
- **Example**: "Too vague - needs specific steps"

### 5. AI Motivational Messages (Pro Feature)
- **Function**: Generates personalized motivational messages
- **Context**: Based on cactus mood, completed tasks, streak
- **Display**: Shows in cactus message area
- **Example**: "You're on fire! 5 tasks completed today! 🔥"

### 6. AI Quick Win Suggestions (Pro Feature)
- **Function**: Suggests the easiest task to complete for momentum
- **Context**: Analyzes incomplete tasks and user mood
- **Display**: Appears in cactus area
- **Example**: "Reply to that email from yesterday"

### 7. AI Task Prioritization
- **Function**: Reorders tasks based on urgency, effort, and user mood
- **Context**: Considers energy levels and completed tasks today
- **Usage**: Available in AI Daily Planner

### 8. AI Daily Planning
- **Function**: Suggests optimal daily task load
- **Context**: User capacity, mood, and available tasks
- **Output**: 3-5 suggested tasks + encouragement message

### 9. AI Cactus Suggestions (Smart Task Ideas)
- **Function**: Provides gentle task suggestions when list is empty/short
- **Context**: Time of day, user mood, previous patterns
- **Examples**:
  - Morning: "Refill your water bottle", "Open the curtains"
  - Afternoon: "Stand up and walk around", "Tidy your workspace"
  - Evening: "Reflect on one good thing", "Plan something nice for tomorrow"
- **Mood Adaptation**: 
    - Tired/Stressed: Gentle, low-energy tasks
    - Energized: More active, organizing tasks
    - Neutral: Balanced mix

### 10. AI Progress Reflection
- **Function**: Reflects on completed tasks and progress
- **Context**: Completed tasks, total tasks, streak
- **Usage**: Part of the feedback system

### 11. AI Mood-Aware Adaptation
- **Cross-Feature**: All AI features adapt based on user mood
- **Moods**: Energized, Focused, Neutral, Tired, Stressed
- **Adaptation**: Task difficulty, suggestion types, motivational tone

## 💳 Subscription Tiers & AI Access

### Free Plan
- ❌ No AI features
- ✅ Basic task management

### Basic Plan
- ✅ AI Quick Wins (task breakdown)
- ✅ AI Task Clarification
- ✅ AI Effort Estimation
- ✅ AI Task Clarity Check
- ✅ AI Cactus Suggestions
- ✅ AI Mood-Aware Adaptation

### Pro Plan
- ✅ All Basic features
- ✅ AI Motivational Messages
- ✅ AI Quick Win Suggestions
- ✅ AI Task Prioritization
- ✅ AI Daily Planning
- ✅ AI Progress Reflection

## 🔧 Technical Implementation

### AI Provider: Groq API
- **Model**: llama3-8b-8192
- **Features**: Fast, reliable, cost-effective
- **Integration**: Serverless API calls
- **Location**: `src/lib/groq.ts`

### Smart Triggers
- **Task Length**: Only analyzes tasks >25 characters
- **Frequency**: Every task (removed the "every 3rd task" limit)
- **Context**: User mood, time of day, completion patterns

### User Experience
- **Loading States**: Smooth animations during AI processing
- **Error Handling**: Graceful fallbacks if AI fails
- **Caching**: Efficient API usage
- **Responsive**: Works on all devices

## 📁 File Structure

```
src/
├── lib/
│   └── groq.ts                    # AI API functions
├── components/
│   ├── AISuggestions.tsx          # AI Quick Wins component
│   ├── CactusSuggestions.tsx      # Smart task suggestions
│   ├── AIDailyPlanner.tsx         # Daily planning AI
│   └── OnboardingModal.tsx        # New user AI feature showcase
└── app/
    └── dashboard/
        └── page.tsx               # Main dashboard with AI integration
```

## 🎯 AI Function Details

### Core AI Functions (`src/lib/groq.ts`)

#### `breakDownTask(taskDescription, userMood)`
- **Purpose**: Converts complex tasks into 3 actionable steps
- **Input**: Task text + user mood
- **Output**: Array of 3 specific tasks
- **Mood Adaptation**: Adjusts difficulty based on energy level

#### `suggestTaskClarification(taskDescription)`
- **Purpose**: Makes vague tasks more specific
- **Input**: Original task text
- **Output**: More detailed, actionable version

#### `estimateTaskEffort(taskDescription)`
- **Purpose**: Provides effort and time estimates
- **Input**: Task description
- **Output**: `{effort: string, timeEstimate: string}`

#### `checkTaskClarity(taskDescription)`
- **Purpose**: Determines if task needs clarification
- **Input**: Task description
- **Output**: `{needsClarification: boolean, reason: string}`

#### `getMotivationalMessage(userMood, completedTasks, totalTasks, streak)`
- **Purpose**: Generates personalized encouragement
- **Input**: User context and progress
- **Output**: Motivational message (<80 characters)

#### `suggestQuickWin(availableTasks, userMood)`
- **Purpose**: Finds the easiest task to complete
- **Input**: Available tasks + mood
- **Output**: Single task recommendation

#### `prioritizeTasks(tasks, userMood, completedToday)`
- **Purpose**: Reorders tasks by priority
- **Input**: Task list + context
- **Output**: Prioritized task array

#### `suggestDailyPlanning(tasks, userMood, completedToday)`
- **Purpose**: Creates optimal daily plan
- **Input**: Available tasks + context
- **Output**: `{suggestedTasks: string[], message: string}`

## 🎨 UI Components

### AISuggestions Component
- **Location**: `src/components/AISuggestions.tsx`
- **Features**: 
  - Task breakdown display
  - Effort estimation
  - Quick wins action button
  - Smooth animations
  - Dismissible interface

### CactusSuggestions Component
- **Location**: `src/components/CactusSuggestions.tsx`
- **Features**:
  - Time-based suggestions
  - Mood-aware filtering
  - New user highlighting
  - Gentle, non-pressuring design

### OnboardingModal Component
- **Location**: `src/components/OnboardingModal.tsx`
- **Features**:
  - AI feature showcase
  - Animated introductions
  - Clear value proposition
  - Welcome experience

## 🔄 State Management

### AI-Related State Variables
```typescript
// Dashboard state
const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
const [submittedTask, setSubmittedTask] = useState<string | null>(null);
const [userMood, setUserMood] = useState<'energized' | 'focused' | 'neutral' | 'tired' | 'stressed'>('neutral');
const [isNewUser, setIsNewUser] = useState(false);
const [showOnboarding, setShowOnboarding] = useState(false);
```

### Local Storage Keys
```typescript
// AI preferences
localStorage.setItem('aiSuggestionsEnabled', 'true');
localStorage.setItem('userMood', 'neutral');
localStorage.setItem('hasUsedApp', 'true'); // New user detection
```

## 🚦 Trigger Logic

### AI Quick Wins Trigger
```typescript
// Conditions for AI analysis
if (!isEnabled || subscriptionLevel === 'free' || !submittedTask || dismissed) {
  return;
}

// Only analyze longer tasks
if (submittedTask.trim().length > 25) {
  // Trigger AI analysis
}
```

### Cactus Suggestions Trigger
```typescript
// Show suggestions when appropriate
const shouldShow = (
  subscriptionLevel !== 'free' && 
  !dismissed && 
  (taskCount === 0 || (taskCount <= 2 && completedCount >= taskCount * 0.5))
);
```

## 🎯 User Experience Flow

### New User Journey
1. **Sign Up** → Auto-redirect to dashboard
2. **Onboarding Modal** → AI features showcase
3. **First Task** → AI Quick Wins appear quickly
4. **Empty List** → Cactus suggestions with welcome message
5. **Mood Check-in** → Personalized AI adaptation

### Regular User Flow
1. **Dashboard Access** → Direct entry
2. **Task Input** → AI analysis for complex tasks
3. **Completion** → Progress tracking and motivation
4. **Empty States** → Gentle AI suggestions
5. **Mood Changes** → Adaptive AI responses

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
```

### API Configuration
```typescript
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-8b-8192";
const MAX_TOKENS = 1000;
const TEMPERATURE = 0.7;
```

## 📊 Analytics & Tracking

### Task Completion Tracking
- **Daily**: Tasks completed per day
- **Weekly**: Weekly completion totals
- **All-time**: Lifetime completion count
- **Streaks**: Consecutive days with completions

### AI Usage Metrics
- **Feature Usage**: Which AI features are used most
- **User Engagement**: How users interact with AI suggestions
- **Success Rate**: Task completion after AI suggestions
- **Mood Patterns**: How mood affects AI usage

## 🛠️ Development Notes

### Adding New AI Features
1. Create function in `src/lib/groq.ts`
2. Add to appropriate subscription tier
3. Create UI component if needed
4. Update documentation
5. Test with different moods and contexts

### Performance Considerations
- **API Rate Limiting**: Efficient API usage
- **Caching**: Store common responses
- **Error Handling**: Graceful fallbacks
- **Loading States**: Smooth user experience

### Future Enhancements
- **Machine Learning**: User behavior patterns
- **Voice Integration**: Voice task input
- **Calendar Integration**: Smart scheduling
- **Team Features**: Collaborative AI suggestions
- **Advanced Analytics**: Deep productivity insights

---

*This documentation covers all AI features implemented in Teyra as of the current version. For technical implementation details, refer to the source code files mentioned above.* 