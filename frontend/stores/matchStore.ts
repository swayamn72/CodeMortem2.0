import { create } from "zustand";

export interface Question {
  id: string;
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: { input: string; output: string; explanation?: string }[];
  difficulty: number;
  tags: string[];
}

export interface MatchQuestion {
  questionIndex: number;
  pointsValue: number;
  solvedBy: string | null;
  solvedAt: string | null;
  question: Question;
}

export interface SubmissionResult {
  questionIndex: number;
  verdict: string;
  points: number;
  isFirstSolve: boolean;
  executionTime?: string;
  memory?: number;
  compileOutput?: string;
  stderr?: string;
}

export interface RunResult {
  output?: string;
  stderr?: string;
  compileOutput?: string;
  executionTime?: string;
  memory?: number;
  status: string;
}

export interface MatchPlayer {
  userId: string;
  username: string;
  score: number;
  ratingBefore: number;
  ratingAfter?: number;
  delta?: number;
}

export interface MatchEndData {
  matchId: string;
  reason: string;
  winnerId: string | null;
  player1: MatchPlayer;
  player2: MatchPlayer;
}

type MatchStatus = "loading" | "countdown" | "active" | "ended";

interface CodeState {
  code: string;
  language: string;
}

interface MatchState {
  matchId: string | null;
  status: MatchStatus;
  questions: MatchQuestion[];
  activeQuestionIndex: number;
  
  // Players
  myId: string | null;
  myScore: number;
  opponentScore: number;
  opponentUsername: string;
  
  // Timer
  remainingSeconds: number;
  
  // Code per question (indexed by questionIndex 1-7)
  codeStates: Record<number, CodeState>;
  
  // Submission state
  isSubmitting: boolean;
  isRunning: boolean;
  lastSubmissionResult: SubmissionResult | null;
  lastRunResult: RunResult | null;
  
  // Match end
  matchEndData: MatchEndData | null;
  
  // Console output
  consoleOutput: string;
  consoleType: "info" | "success" | "error";

  // Solved tracking
  mySolved: Set<number>;
  opponentSolved: Set<number>;

  // WebSocket
  ws: WebSocket | null;

  // Actions
  setMatchId: (id: string) => void;
  setStatus: (status: MatchStatus) => void;
  setQuestions: (questions: MatchQuestion[]) => void;
  setActiveQuestion: (index: number) => void;
  setMyId: (id: string) => void;
  updateCode: (questionIndex: number, code: string) => void;
  updateLanguage: (questionIndex: number, language: string) => void;
  setRemainingSeconds: (secs: number) => void;
  setSubmitting: (v: boolean) => void;
  setRunning: (v: boolean) => void;
  setSubmissionResult: (result: SubmissionResult) => void;
  setRunResult: (result: RunResult) => void;
  recordMySolve: (questionIndex: number, points: number) => void;
  recordOpponentSolve: (questionIndex: number, opponentScore: number) => void;
  setMatchEnd: (data: MatchEndData) => void;
  setConsole: (output: string, type: "info" | "success" | "error") => void;
  setOpponent: (username: string) => void;
  setWs: (ws: WebSocket | null) => void;
  reset: () => void;
}

const DEFAULT_CODE: Record<string, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    
    return 0;
}`,
  python: `import sys
input = sys.stdin.readline

`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        
    }
}`,
  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    reader := bufio.NewReader(os.Stdin)
    _ = reader
    fmt.Println()
}`,
  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    
});`,
  rust: `use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    for line in stdin.lock().lines() {
        let line = line.unwrap();
    }
}`,
};

function buildInitialCodeStates(): Record<number, CodeState> {
  const states: Record<number, CodeState> = {};
  for (let i = 1; i <= 7; i++) {
    states[i] = { code: DEFAULT_CODE.cpp, language: "cpp" };
  }
  return states;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matchId: null,
  status: "loading",
  questions: [],
  activeQuestionIndex: 1,
  myId: null,
  myScore: 0,
  opponentScore: 0,
  opponentUsername: "",
  remainingSeconds: 1800,
  codeStates: buildInitialCodeStates(),
  isSubmitting: false,
  isRunning: false,
  lastSubmissionResult: null,
  lastRunResult: null,
  matchEndData: null,
  consoleOutput: "Ready. Write your solution and click Run or Submit.",
  consoleType: "info",
  mySolved: new Set(),
  opponentSolved: new Set(),
  ws: null,

  setMatchId: (matchId) => set({ matchId }),
  setStatus: (status) => set({ status }),
  setQuestions: (questions) => set({ questions }),
  setActiveQuestion: (activeQuestionIndex) => set({ activeQuestionIndex, lastSubmissionResult: null, lastRunResult: null }),
  setMyId: (myId) => set({ myId }),

  updateCode: (questionIndex, code) =>
    set((state) => ({
      codeStates: {
        ...state.codeStates,
        [questionIndex]: { ...state.codeStates[questionIndex], code },
      },
    })),

  updateLanguage: (questionIndex, language) =>
    set((state) => ({
      codeStates: {
        ...state.codeStates,
        [questionIndex]: {
          code: DEFAULT_CODE[language] || "",
          language,
        },
      },
    })),

  setRemainingSeconds: (remainingSeconds) => set({ remainingSeconds }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setRunning: (isRunning) => set({ isRunning }),
  
  setSubmissionResult: (result) => set({ 
    lastSubmissionResult: result, 
    isSubmitting: false,
    consoleOutput: result.verdict === "accepted" 
      ? `✅ Accepted! ${result.isFirstSolve ? `+${result.points} points!` : "(already solved)"}` 
      : `❌ ${result.verdict.replace(/_/g, " ").toUpperCase()}${result.stderr ? "\n" + result.stderr : ""}${result.compileOutput ? "\n" + result.compileOutput : ""}`,
    consoleType: result.verdict === "accepted" ? "success" : "error",
  }),

  setRunResult: (result) => set({
    lastRunResult: result,
    isRunning: false,
    consoleOutput: result.output || result.stderr || result.compileOutput || "(no output)",
    consoleType: result.stderr || result.compileOutput ? "error" : "info",
  }),

  recordMySolve: (questionIndex, points) =>
    set((state) => {
      const newSolved = new Set(state.mySolved);
      newSolved.add(questionIndex);
      return { mySolved: newSolved, myScore: state.myScore + points };
    }),

  recordOpponentSolve: (questionIndex, opponentScore) =>
    set((state) => {
      const newSolved = new Set(state.opponentSolved);
      newSolved.add(questionIndex);
      return { opponentSolved: newSolved, opponentScore };
    }),

  setMatchEnd: (matchEndData) => set({ matchEndData, status: "ended" }),
  setConsole: (consoleOutput, consoleType) => set({ consoleOutput, consoleType }),
  setOpponent: (opponentUsername) => set({ opponentUsername }),
  setWs: (ws) => set({ ws }),

  reset: () => set({
    matchId: null,
    status: "loading",
    questions: [],
    activeQuestionIndex: 1,
    myId: null,
    myScore: 0,
    opponentScore: 0,
    opponentUsername: "",
    remainingSeconds: 1800,
    codeStates: buildInitialCodeStates(),
    isSubmitting: false,
    isRunning: false,
    lastSubmissionResult: null,
    lastRunResult: null,
    matchEndData: null,
    consoleOutput: "Ready. Write your solution and click Run or Submit.",
    consoleType: "info",
    mySolved: new Set(),
    opponentSolved: new Set(),
    ws: null,
  }),
}));
