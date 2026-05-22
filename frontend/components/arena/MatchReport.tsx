"use client";

import type { MatchReport as MatchReportType } from "@/stores/matchStore";
import styles from "./MatchReport.module.css";

interface MatchReportProps {
  report: MatchReportType;
}

const GRADE_COLORS: Record<string, string> = {
  A: "#00ff88",
  B: "#00c8ff",
  C: "#ffd700",
  D: "#ff8c00",
  F: "#ff2d55",
};

export default function MatchReportView({ report }: MatchReportProps) {
  return (
    <div className={styles.report}>
      <div className={styles.reportHeader}>
        <span className={styles.reportIcon}>📊</span>
        <h3 className={styles.reportTitle}>AI Performance Report</h3>
      </div>

      {/* Overall Grade */}
      <div className={styles.gradeSection}>
        <div
          className={styles.gradeBig}
          style={{ color: GRADE_COLORS[report.overallGrade] || "#fff" }}
        >
          {report.overallGrade}
        </div>
        <p className={styles.gradeSummary}>{report.summary}</p>
      </div>

      {/* Problem Grades */}
      <div className={styles.problemGrades}>
        <h4 className={styles.subTitle}>Per-Problem Grades</h4>
        <div className={styles.gradeGrid}>
          {report.problemGrades.map((pg) => (
            <div key={pg.questionIndex} className={styles.gradeCard}>
              <div className={styles.gradeCardHeader}>
                <span className={styles.qLabel}>Q{pg.questionIndex}</span>
                <span
                  className={styles.qGrade}
                  style={{ color: GRADE_COLORS[pg.grade] || "#fff" }}
                >
                  {pg.grade}
                </span>
                <span className={pg.solved ? styles.solved : styles.unsolved}>
                  {pg.solved ? "✓" : "✗"}
                </span>
              </div>
              <p className={styles.gradeCommentary}>{pg.commentary}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className={styles.swGrid}>
        <div className={styles.swCard}>
          <h4 className={styles.swTitle}>
            <span>💪</span> Strengths
          </h4>
          <ul className={styles.swList}>
            {report.strengths.map((s, i) => (
              <li key={i} className={styles.strength}>{s}</li>
            ))}
          </ul>
        </div>
        <div className={styles.swCard}>
          <h4 className={styles.swTitle}>
            <span>🎯</span> Areas to Improve
          </h4>
          <ul className={styles.swList}>
            {report.weaknesses.map((w, i) => (
              <li key={i} className={styles.weakness}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className={styles.recsSection}>
          <h4 className={styles.subTitle}>📚 Study Recommendations</h4>
          <div className={styles.recsGrid}>
            {report.recommendations.map((rec, i) => (
              <div key={i} className={styles.recCard}>
                <div className={styles.recHeader}>
                  <span className={styles.recTopic}>{rec.topic}</span>
                  <span className={`${styles.recPriority} ${styles[`priority${rec.priority}`]}`}>
                    {rec.priority}
                  </span>
                </div>
                <p className={styles.recDesc}>{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
