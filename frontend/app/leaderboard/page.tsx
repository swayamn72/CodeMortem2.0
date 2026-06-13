"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import styles from "./page.module.css";

interface LeaderboardUser {
  id: string;
  username: string;
  rating: number;
  matchesPlayed: number;
  matchesWon: number;
  totalProblemsSolved: number;
  rankTitle: string;
}

function getRankColor(rating: number): string {
  if (rating < 1200) return "#808080";
  if (rating < 1400) return "#00c853";
  if (rating < 1600) return "#03a89e";
  if (rating < 1900) return "#2979ff";
  if (rating < 2100) return "#aa00e6";
  if (rating < 2400) return "#ff8c00";
  return "#ff1744";
}

function getMedal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default function LeaderboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const data = await api.get("/users/leaderboard?limit=50");
        setUsers(data.users || []);
      } catch {
        // Demo data if API is not running
        setUsers([
          { id: "1", username: "tourist", rating: 2847, matchesPlayed: 342, matchesWon: 298, totalProblemsSolved: 2100, rankTitle: "Legendary Grandmaster" },
          { id: "2", username: "rng_58", rating: 2695, matchesPlayed: 256, matchesWon: 210, totalProblemsSolved: 1820, rankTitle: "International Grandmaster" },
          { id: "3", username: "Petr", rating: 2621, matchesPlayed: 198, matchesWon: 162, totalProblemsSolved: 1545, rankTitle: "International Grandmaster" },
          { id: "4", username: "ecnerwala", rating: 2584, matchesPlayed: 175, matchesWon: 140, totalProblemsSolved: 1340, rankTitle: "Grandmaster" },
          { id: "5", username: "Um_nik", rating: 2520, matchesPlayed: 210, matchesWon: 165, totalProblemsSolved: 1580, rankTitle: "Grandmaster" },
          { id: "6", username: "Benq", rating: 2478, matchesPlayed: 188, matchesWon: 148, totalProblemsSolved: 1410, rankTitle: "Grandmaster" },
          { id: "7", username: "jiangly", rating: 2445, matchesPlayed: 162, matchesWon: 125, totalProblemsSolved: 1220, rankTitle: "International Master" },
          { id: "8", username: "ksun48", rating: 2390, matchesPlayed: 145, matchesWon: 110, totalProblemsSolved: 1080, rankTitle: "International Master" },
          { id: "9", username: "neal", rating: 2312, matchesPlayed: 130, matchesWon: 95, totalProblemsSolved: 960, rankTitle: "Master" },
          { id: "10", username: "tmw", rating: 2280, matchesPlayed: 118, matchesWon: 85, totalProblemsSolved: 890, rankTitle: "Master" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <>
      <Navbar activeTab="leaderboard" showFindMatch={true} />

      <main className={styles.leaderboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>🏆 Global Leaderboard</h1>
          <p className={styles.subtitle}>Top players ranked by Glicko-2 rating</p>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading rankings...</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Rank</th>
                  <th>Player</th>
                  <th>Rating</th>
                  <th>Title</th>
                  <th>Matches</th>
                  <th>Win Rate</th>
                  <th>Problems</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  const winRate = user.matchesPlayed > 0
                    ? ((user.matchesWon / user.matchesPlayed) * 100).toFixed(1)
                    : "0.0";
                  const rank = i + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr key={user.id} className={isTop3 ? styles.top3Row : ""}>
                      <td className={styles.rankCell}>
                        <span className={isTop3 ? styles.medal : styles.rankNum}>
                          {getMedal(rank)}
                        </span>
                      </td>
                      <td>
                        <Link href={`/profile/${user.username}`} className={styles.playerLink}>
                          <span
                            className={styles.playerName}
                            style={{ color: getRankColor(user.rating) }}
                          >
                            {user.username}
                          </span>
                        </Link>
                      </td>
                      <td>
                        <span
                          className={styles.rating}
                          style={{ color: getRankColor(user.rating) }}
                        >
                          {user.rating}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.rankTitle}
                          style={{ color: getRankColor(user.rating) }}
                        >
                          {user.rankTitle}
                        </span>
                      </td>
                      <td className={styles.statCell}>{user.matchesPlayed}</td>
                      <td className={styles.statCell}>
                        <span className={styles.winRate}>{winRate}%</span>
                      </td>
                      <td className={styles.statCell}>{user.totalProblemsSolved}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
