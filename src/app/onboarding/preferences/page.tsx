"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import MinimalHeader from "@/components/MinimalHeader";

type Question = {
  id: string;
  text: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: "q1",
    text: "On a scale of 1-5, how important is sustainable living to you right now?",
    options: ["1 - Not very", "2", "3 - Moderately", "4", "5 - Extremely"],
  },
  {
    id: "q2",
    text: "What is a typical meal for you?",
    options: ["🥩 Mostly meat-based", "🍗 A mix of everything", "🌱 Mostly vegetarian", "🥗 Strictly vegetarian/vegan"],
  },
  {
    id: "q3",
    text: "When it comes to lights and electronics, you are...",
    options: ["💡 A 'lights-on' person", "🤔 I try to turn things off", "🔌 An energy-saving expert"],
  },
  {
    id: "q4",
    text: "How do you typically commute to work or school?",
    options: ["🚗 Car", "🚌 Public Transport", "🚲 Bike", "🚶 Walk", "🏠 I work from home"],
  },
  {
    id: "q5",
    text: "What's your approach to shopping?",
    options: ["🛍️ I love fast fashion", "💰 I look for bargains", "🌍 I prefer sustainable/local", "✨ I buy second-hand"],
  },
];

export default function PreferencesPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signup");
    }
  }, [status, router]);

  const handleOptionClick = (questionId: string, option: string) => {
    const newAnswers = { ...answers, [questionId]: option };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handleSubmit = async (finalAnswers: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: finalAnswers }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate tasks. Please try again.");
      }
      
      await update();
      
      router.push("/dashboard");

    } catch (error) {
      console.error(error);
      setError(true);
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-brand-light-green p-4 text-center">
        <h1 className="text-2xl font-bold">Generating your personalized tasks...</h1>
        <p className="max-w-md text-gray-700">
          This may take a moment. We are crafting your sustainable journey!
        </p>
      </div>
    );
  }

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F7F4]">
        <p>Loading...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!hasStarted) {
    return (
      <>
        <MinimalHeader />
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F7F4] px-4 text-center">
          <div className="w-full max-w-xl animate-fade-in">
            <h1 className="text-4xl font-black text-gray-800 sm:text-5xl">
              Welcome, {session.user?.username}!
            </h1>
            <p className="mt-4 text-base text-gray-600 sm:text-lg">
              Let us personalize your journey. Answer 5 quick questions to get sustainability tasks tailored just for you.
            </p>
            <button
              onClick={() => setHasStarted(true)}
              className="mt-8 w-full max-w-xs rounded-xl border-4 border-black bg-green-300 px-8 py-4 text-xl font-bold text-black shadow-[8px_8px_0_0_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none sm:w-auto sm:text-2xl hover:bg-green-400 active:bg-green-500"
            >
              Start
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <MinimalHeader />
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F7F4] px-4 pt-20 text-center">
        <div className="w-full max-w-2xl">
          <div className="mb-8 h-2.5 w-full rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-green-400 transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div key={currentQuestion.id} className="w-full animate-fade-in">
            <p className="mb-2 text-sm font-medium text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl">
              {currentQuestion.text}
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-6">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleOptionClick(currentQuestion.id, option)}
                  className="w-full max-w-sm rounded-xl border-4 border-black bg-white px-6 py-3 text-base font-bold text-black shadow-[8px_8px_0_0_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none disabled:opacity-50 sm:w-auto sm:px-8 sm:py-4 sm:text-lg hover:bg-yellow-100 active:bg-yellow-200"
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-12 text-sm text-foreground/70">
              Your answers will help us tailor your experience.
            </p>
            {error && (
              <p className="mt-2 text-red-500">
                Something went wrong. Please try again.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}