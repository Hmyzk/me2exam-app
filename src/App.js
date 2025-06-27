// 臨床工学技士 ME2種試験対策アプリ（Math 表記対応、モダンUI構成）

import React, { useState, useEffect } from "react";
import classNames from "classnames";
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import CategoryChart from "./components/CategoryChart";


function App() {
  const [availableYears, setAvailableYears] = useState([]);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const selectedYear = endYear; // もしくは startYear

  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [numQuestions, setNumQuestions] = useState(10);
  const [shuffleOrder, setShuffleOrder] = useState(false); // true: シャッフル, false: 順番通り

  const [questions, setQuestions] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [retryQuestions, setRetryQuestions] = useState([]);


   useEffect(() => {
     // Webpack の require.context を使って data フォルダのファイル一覧を取得
     const context = require.context('./data', false, /questions_\d{4}\.json$/);
     const years = context.keys()
       .map(filename => filename.match(/questions_(\d{4})\.json$/)?.[1])
       .filter(Boolean)
       .sort(); // 昇順にソート

     setAvailableYears(years);
     if (years.length > 0) {
       //setStartYear(years[0]);
       setStartYear(years[years.length - 1]);
       setEndYear(years[years.length - 1]);
     }
   }, []);


   useEffect(() => {
     const start = Number(startYear);
     const end = Number(endYear);
     const years = [];
     for (let y = start; y <= end; y++) {
       years.push(y.toString());
     }

     Promise.all(
       years.map((y) =>
         import(`./data/questions_${y}.json`)
           .then((module) => module.default)
           .catch(() => [])
       )
     )
       .then((arrays) => {
         const merged = arrays.flat();
         setQuestions(merged);
       })
       .catch((error) => {
         console.error(error);
         setQuestions([]);
       });
   }, [startYear, endYear]);

  useEffect(() => {
      if (questions.length > 0) {
      // 年度範囲でフィルタリング
      let filtered = questions.filter(q => {
        const y = Number(q.year);
        return y >= Number(startYear) && y <= Number(endYear);
      });

      // 分野フィルター
      // キーワード検索がある場合は分野を無視（＝すべてとみなす）
      if (searchTerm.trim() !== "") {
        const keyword = searchTerm.toLowerCase();
        filtered = filtered.filter(q =>
          q.question.toLowerCase().includes(keyword) ||
          q.options.some(opt => opt.toLowerCase().includes(keyword))
        );
      } else if (selectedCategory !== "すべて") {
        filtered = filtered.filter(q => q.category === selectedCategory);
      }
 
      if (shuffleOrder) {
        filtered = filtered.sort(() => 0.5 - Math.random());
      } else {
        const partOrder = { "午前": 0, "午後": 1 };
        filtered = filtered.slice().sort((a, b) => {
          if (a.year !== b.year) return a.year.localeCompare(b.year);
          if (a.part !== b.part) return partOrder[a.part] - partOrder[b.part];
          return a.index - b.index;
        });
      }

      setQuizQuestions(filtered.slice(0, numQuestions));
    }
  }, [questions, startYear, endYear, selectedCategory, numQuestions, shuffleOrder, searchTerm]);

  const handleAnswer = (qIndex, answer) => {
    if (answers[qIndex] !== undefined) return;
    setAnswers((prev) => {
      const updated = { ...prev, [qIndex]: answer };
      if (Object.keys(updated).length === quizQuestions.length) {
        setShowResults(true);
      }
      return updated;
    });
  };

  const handleRetryIncorrect = () => {
  const incorrectQuestions = quizQuestions.filter((q, index) => {
    const userAnswer = answers[index];
    const correctAnswer = q.answer;
    if (Array.isArray(correctAnswer)) {
      return !correctAnswer.includes(userAnswer);
    }
    return userAnswer !== correctAnswer;
  });

  setQuizQuestions(incorrectQuestions);
  setAnswers({});
  setShowResults(false);
  setStarted(true);
　};


const renderTextOrMath = (text) => {
  const parts = text.split(/(\${1,2}[^$]+?\${1,2})/g); // $$...$$ または $...$ を分離
  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      return <BlockMath key={i} math={part.slice(2, -2)} />;
    } else if (part.startsWith("$") && part.endsWith("$")) {
      return <InlineMath key={i} math={part.slice(1, -1)} />;
    } else {
      return <span key={i}>{part}</span>;
    }
  });
};

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-50 to-blue-100 text-center">
        <h1 className="text-4xl font-bold mb-6">臨床工学技士 ME2種試験対策アプリ</h1>
        <p className="mb-8 text-lg">分野・年度・出題数を選んで学習を始めましょう</p>

        <div className="w-full max-w-md space-y-4">
          {/* 年度範囲選択 */}
          <div className="mb-4 flex space-x-4 items-center">
           <div>
              <label className="mr-2 font-semibold">開始年度:</label>
              <select value={startYear} onChange={(e) => setStartYear(e.target.value)} className="border rounded p-1">
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mr-2 font-semibold">終了年度:</label>
              <select value={endYear} onChange={(e) => setEndYear(e.target.value)} className="border rounded p-1">
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1">分野:</label>
            <select
              className="border p-2 rounded w-full"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="すべて">すべて</option>
              {[...new Set(questions.map((q) => q.category))].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">出題数:</label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              min={1}
              max={120}
            />
          </div>

          <div>
            <label className="block mb-1">出題順:</label>
            <select
              className="border p-2 rounded w-full"
              value={shuffleOrder ? "true" : "false"}
              onChange={(e) => setShuffleOrder(e.target.value === "true")}
            >
              <option value="false">順番通り</option>
              <option value="true">シャッフル</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">キーワード検索:</label>
            <input
              type="text"
              className="border p-2 rounded w-full"
              placeholder="例: 心電図, 血液, 回路"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setStarted(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
          >
            学習を開始
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{selectedYear}年｜{selectedCategory}から{numQuestions}問</h1>

      <div className="mb-4">
        {quizQuestions.map((q, index) => (
          <div key={index} className="mb-4 p-4 border rounded bg-white shadow">
            <p className="font-medium">
              {/* 年・午前午後・問題番号・分野を1行で表示し、改行して問題文 */}
              <span className="text-gray-600">
                【{q.year}年／{q.part}／問題{q.index}／{q.category}】
              </span>
              <br />
              {index + 1}. {renderTextOrMath(q.question)}
              {q.questionImage && (
                <img
                  src={`/${q.questionImage}`}
                  alt="問題画像"
                  className="mt-2 max-w-full"
                />
              )}
            </p>
            <ul>
              {q.options.map((opt, i) => (
                <li key={i} className="mt-2">
                  <button
                    className={classNames("border p-2 rounded w-full text-left", {
                      'bg-blue-100': answers[index] === opt,
                      'hover:bg-gray-100': answers[index] === undefined
                    })}
                    onClick={() => handleAnswer(index, opt)}
                    disabled={answers[index] !== undefined}
                  >
                    {renderTextOrMath(opt)}
                    {q.optionImages?.[i] && (
                      <img
                        src={`/${q.optionImages[i]}`}
                        alt={`選択肢画像 ${i + 1}`}
                        className="mt-2 max-w-full"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {answers[index] !== undefined && (
              <p className={classNames("mt-2 text-sm", {
                'text-green-600': Array.isArray(q.answer) ? q.answer.includes(answers[index]) : answers[index] === q.answer,
                'text-red-500': !(Array.isArray(q.answer) ? q.answer.includes(answers[index]) : answers[index] === q.answer)
              })}>
                {Array.isArray(q.answer)
                  ? (q.answer.includes(answers[index]) ? '正解！' : `不正解（正解: ${q.answer.join(' または ')})`)
                  : (answers[index] === q.answer ? '正解！' : `不正解（正解: ${q.answer}）`)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 成績表示：すべて解き終わったときに表示 */}
      {showResults && (
        <div className="p-6 mt-8 border-t border-gray-200">
          <h2 className="text-xl font-bold mb-4">結果</h2>
          <p className="mb-4 text-lg">
            正解数: {Object.entries(answers).filter(([i, a]) => {
              const correctAnswer = quizQuestions[i].answer;
              return Array.isArray(correctAnswer)
                ? correctAnswer.includes(a)
                : a === correctAnswer;
            }).length} / {quizQuestions.length}
          </p>

          {/* グラフの表示 */}
          {selectedCategory === "すべて" && quizQuestions.length > 0 && (
            <div className="mt-6 mb-6">
              <CategoryChart quizQuestions={quizQuestions} answers={answers} />
            </div>
          )}
        </div>
        
      )}

      {/* 常に表示されるフッターボタンエリア */}
      <div className="flex flex-wrap gap-4 mt-8 justify-center">
        {/* TOPに戻る：常に表示 */}
        <button
          onClick={() => {
            setAnswers({});
            setShowResults(false);
            setStarted(false);
          }}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
        >
          トップに戻る
        </button>

        {/* 間違えた問題だけやり直す：showResults が true のときだけ表示 */}
        {showResults && (
          <button
            onClick={handleRetryIncorrect}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            間違えた問題だけやり直す
          </button>
        )}
      </div>

    </div>
  );
}

export default App;
