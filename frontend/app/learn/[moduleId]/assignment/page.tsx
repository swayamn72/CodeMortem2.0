"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PremiumGate from "@/components/PremiumGate";
import { useAuthStore } from "@/stores/authStore";
import { useAssignmentStore } from "@/stores/assignmentStore";
import { useProgressStore } from "@/stores/progressStore";
import { getModuleAssignment } from "@/components/learn/moduleAssignments";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function ModuleAssignmentPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId ?? "";
  const router = useRouter();

  const { user, isAuthenticated } = useAuthStore();
  const { isModuleComplete } = useProgressStore();
  const { attempts, recordAttempt } = useAssignmentStore();

  const [mounted, setMounted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  const assignment = getModuleAssignment(moduleId);
  const isComplete = assignment ? isModuleComplete(moduleId, assignment.requiredLessonIds) : false;

  const userAttempts = useMemo(() => {
    if (!user) return [];
    return attempts
      .filter((attempt) => attempt.userId === user.id && attempt.moduleId === moduleId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [attempts, moduleId, user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (!assignment || !isComplete || submitted) return;
    if (secondsLeft <= 0) return;

    const timeout = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [assignment, isComplete, secondsLeft, submitted]);

  useEffect(() => {
    if (!assignment || !isComplete) return;
    setSecondsLeft(assignment.timeLimitMinutes * 60);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setTimedOut(false);
  }, [assignment, isComplete]);

  const handleSubmit = () => {
    if (!assignment || !user) return;
    if (submitted) return;

    let correct = 0;
    assignment.questions.forEach((question) => {
      if (answers[question.id] === question.answerIndex) {
        correct += 1;
      }
    });

    const elapsedSeconds = Math.max(0, assignment.timeLimitMinutes * 60 - secondsLeft);
    const didTimeOut = secondsLeft <= 0;

    setScore(correct);
    setSubmitted(true);
    setTimedOut(didTimeOut);

    recordAttempt({
      userId: user.id,
      moduleId,
      score: correct,
      totalQuestions: assignment.questions.length,
      durationSeconds: elapsedSeconds,
      timedOut: didTimeOut,
      answers,
    });
  };

  const handleRetake = () => {
    if (!assignment) return;
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setTimedOut(false);
    setSecondsLeft(assignment.timeLimitMinutes * 60);
  };

  if (!mounted || !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-primary)" }}>
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  return (
    <PremiumGate featureName="module assignments">
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", padding: "0 18px", height: 60, borderBottom: "1px solid var(--border-primary)", background: "rgba(10,10,15,0.92)", position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(12px)" }}>
          <Link href="/learn" className="btn btn-secondary btn-sm">← Learn</Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ fontWeight: 800 }}>{assignment?.icon ?? "📘"} {assignment?.title ?? "Module Assignment"}</span>
            <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(0,240,255,0.2)", color: "var(--cm-cyan)", background: "rgba(0,240,255,0.06)" }}>
              {assignment?.difficulty ?? "Premium"}
            </span>
            <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,215,0,0.2)", color: "#ffd700", background: "rgba(255,215,0,0.06)" }}>
              {assignment ? `${assignment.questionCount} questions · ${assignment.timeLimitMinutes} min` : ""}
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: secondsLeft <= 300 ? "var(--cm-red)" : "var(--text-primary)" }}>
            {formatTime(secondsLeft)}
          </div>
        </div>

        {!assignment ? (
          <main style={{ maxWidth: 960, margin: "0 auto", padding: "4rem 1.5rem" }}>
            <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
              <h1 style={{ marginBottom: 12 }}>Assignment coming soon</h1>
              <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                We haven&apos;t added a premium assignment for this module yet.
              </p>
              <Link href="/learn" className="btn btn-primary">Back to Learn</Link>
            </div>
          </main>
        ) : !isComplete ? (
          <main style={{ maxWidth: 960, margin: "0 auto", padding: "4rem 1.5rem" }}>
            <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🔒</div>
              <h1 style={{ marginBottom: 12 }}>Complete the module first</h1>
              <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                This 1-hour assignment unlocks after you finish all lessons in {assignment.title}.
              </p>
              <Link href="/learn" className="btn btn-primary">Back to Learn</Link>
            </div>
          </main>
        ) : (
          <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem 3rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 24 }}>
              <section className="card" style={{ padding: "1.5rem", border: "1px solid var(--border-primary)" }}>
                <div style={{ marginBottom: 18 }}>
                  <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>{assignment.title} Assignment</h1>
                  <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    This premium assignment can be attempted anytime after module completion. You get one hour to solve {assignment.questions.length} questions.
                  </p>
                </div>

                {submitted && (
                  <div style={{ marginBottom: 18, padding: "1rem 1.1rem", borderRadius: 14, border: `1px solid ${timedOut ? "rgba(255,45,85,0.25)" : "rgba(0,255,136,0.25)"}`, background: timedOut ? "rgba(255,45,85,0.06)" : "rgba(0,255,136,0.06)" }}>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>
                      {timedOut ? "Time limit reached" : "Assignment submitted"}
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Score: {score} / {assignment.questions.length} · Best attempt is saved locally for this device.
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {assignment.questions.map((question, index) => {
                    const selected = answers[question.id];
                    return (
                      <div key={question.id} className="card" style={{ padding: "1.1rem", border: "1px solid var(--border-primary)", background: "rgba(255,255,255,0.02)" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,240,255,0.08)", color: "var(--cm-cyan)", fontWeight: 800, flexShrink: 0 }}>{index + 1}</div>
                          <div>
                            <div style={{ fontWeight: 700, lineHeight: 1.6 }}>{question.prompt}</div>
                          </div>
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          {question.options.map((option, optionIndex) => {
                            const isSelected = selected === optionIndex;
                            const isCorrect = submitted && optionIndex === question.answerIndex;
                            const isWrongSelected = submitted && isSelected && optionIndex !== question.answerIndex;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => !submitted && setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                                disabled={submitted}
                                style={{
                                  textAlign: "left",
                                  padding: "0.9rem 1rem",
                                  borderRadius: 12,
                                  border: `1px solid ${isCorrect ? "rgba(0,255,136,0.35)" : isWrongSelected ? "rgba(255,45,85,0.35)" : isSelected ? "rgba(0,240,255,0.35)" : "var(--border-primary)"}`,
                                  background: isCorrect ? "rgba(0,255,136,0.08)" : isWrongSelected ? "rgba(255,45,85,0.08)" : isSelected ? "rgba(0,240,255,0.08)" : "rgba(255,255,255,0.02)",
                                  color: "var(--text-primary)",
                                  cursor: submitted ? "default" : "pointer",
                                }}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>

                        {submitted && (
                          <p style={{ marginTop: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={submitted}>
                    {submitted ? "Submitted" : secondsLeft === 0 ? "Submit timed-out attempt" : "Submit Assignment"}
                  </button>
                  <button className="btn btn-secondary" onClick={handleRetake}>
                    Retake Anytime
                  </button>
                </div>
              </section>

              <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="card" style={{ padding: "1.2rem" }}>
                  <h3 style={{ marginBottom: 10 }}>Attempt Summary</h3>
                  <div style={{ display: "grid", gap: 10, color: "var(--text-secondary)", fontSize: 14 }}>
                    <div>Questions: <strong style={{ color: "var(--text-primary)" }}>{assignment.questions.length}</strong></div>
                    <div>Time limit: <strong style={{ color: "var(--text-primary)" }}>{assignment.timeLimitMinutes} minutes</strong></div>
                    <div>Answered: <strong style={{ color: "var(--text-primary)" }}>{Object.keys(answers).length}</strong></div>
                    <div>Attempts saved: <strong style={{ color: "var(--text-primary)" }}>{userAttempts.length}</strong></div>
                    <div>Module status: <strong style={{ color: "var(--cm-green)" }}>Completed</strong></div>
                  </div>
                </div>

                <div className="card" style={{ padding: "1.2rem" }}>
                  <h3 style={{ marginBottom: 10 }}>Past Attempts</h3>
                  {userAttempts.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>No submissions yet. Your first result will appear here.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {userAttempts.slice(0, 5).map((attempt) => (
                        <div key={attempt.id} style={{ padding: "0.85rem", borderRadius: 12, border: "1px solid var(--border-primary)", background: "rgba(255,255,255,0.02)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                            <strong>{attempt.score} / {attempt.totalQuestions}</strong>
                            <span style={{ color: attempt.timedOut ? "var(--cm-red)" : "var(--cm-green)", fontSize: 12, fontWeight: 700 }}>
                              {attempt.timedOut ? "Timed out" : "Submitted"}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {Math.floor(attempt.durationSeconds / 60)}m {attempt.durationSeconds % 60}s · {new Date(attempt.submittedAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </main>
        )}
      </div>
    </PremiumGate>
  );
}
