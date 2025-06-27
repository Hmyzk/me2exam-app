import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const CategoryChart = ({ quizQuestions = [], answers = {} }) => {
  if (!Array.isArray(quizQuestions)) return null;

  const categoryStats = {};

  quizQuestions.forEach((q, index) => {
    if (!q.category) return;

    const userAnswer = answers[index];
    const correctAnswer = q.answer;
    const isCorrect = Array.isArray(correctAnswer)
      ? correctAnswer.includes(userAnswer)
      : userAnswer === correctAnswer;

    if (!categoryStats[q.category]) {
      categoryStats[q.category] = { correct: 0, total: 0 };
    }

    categoryStats[q.category].total += 1;
    if (isCorrect) {
      categoryStats[q.category].correct += 1;
    }
  });

  const chartData = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    correct: stats.correct,
    total: stats.total,
    ratio: ((stats.correct / stats.total) * 100).toFixed(1),
    label: `${stats.correct}/${stats.total}`,
  }));

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <YAxis
            type="category"
            dataKey="category"
            width={100}
            tick={{ fontSize: 14 }}
          />
          <Tooltip formatter={(v, name, props) => [`${props.payload.label}`, "正解数"]} />
          <Bar dataKey="ratio" fill="#4F46E5" radius={[0, 6, 6, 0]}>
            <LabelList dataKey="label" position="right" fill="#000" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;
