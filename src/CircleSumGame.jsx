import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const TOTAL = 4;              
const OUTER_R = 220;        
const INNER_R_SEG = 150;      
const INNER_R_FILL = 75;      
const OFFSET_BASE = 20;
const GAP = 4;
const CYCLE_TIME = 5000;
const MAX_CYCLES = 3;


const COLOR_IDLE = '#2a002a';
const COLOR_ACTIVE = '#c21065';
const COLOR_OK = '#00C853';
const COLOR_BAD = '#D32F2F';

function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutSlice(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const o1 = polarToCartesian(cx, cy, rOuter, startDeg);
  const o2 = polarToCartesian(cx, cy, rOuter, endDeg);
  const i2 = polarToCartesian(cx, cy, rInner, endDeg);
  const i1 = polarToCartesian(cx, cy, rInner, startDeg);
  const largeArc = (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0;
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
    `L ${i2.x} ${i2.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${i1.x} ${i1.y}`,
    'Z',
  ].join(' ');
}

function randomPartition(count, total) {
  const cuts = Array.from({ length: count - 1 }, () => Math.random());
  cuts.push(0, 1);
  cuts.sort();
  const parts = [];
  for (let i = 1; i < cuts.length; i++) {
    parts.push((cuts[i] - cuts[i - 1]) * total);
  }
  return parts;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default function CircleSumGame() {
  const [segs, setSegs] = useState([]);
  const [values, setValues] = useState([]);
  const [sel, setSel] = useState(Array(TOTAL).fill(false));
  const [cycle, setCycle] = useState(0);
  const [sum, setSum] = useState(0);
  const [isBad, setIsBad] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedCycles, setCompletedCycles] = useState([]);
  const [failed, setFailed] = useState(false);
  const [success, setSuccess] = useState(false);
  const progressRef = useRef(null);

  const setupGame = () => {
    setFailed(false);
    setCorrect(false);
    setProgress(0);

    const offset = Math.random() * 360;
    const slice = 360 / TOTAL;
    const segments = Array.from({ length: TOTAL }, (_, i) => ({
      start: offset + i * slice + GAP / 2,
      end: offset + (i + 1) * slice - GAP / 2,
    }));
    setSegs(segments);

    const positivesCount = Math.floor(Math.random() * TOTAL) + 1;
    const positives = randomPartition(positivesCount, 100).map(v => Math.round(v));

    const negativesCount = TOTAL - positivesCount;
    const negatives = Array.from({ length: negativesCount }, () =>
      -Math.round( Math.random() * 50 )
    );

    setValues(shuffleArray([...positives, ...negatives]));
    setSel(Array(TOTAL).fill(false));
    setSum(0);
    setIsBad(false);
  };

  useEffect(() => {
    if (cycle < MAX_CYCLES && !success) setupGame();
  }, [cycle]);

  useEffect(() => {
    if (progressRef.current) cancelAnimationFrame(progressRef.current);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(elapsed / CYCLE_TIME, 1));
      if (elapsed < CYCLE_TIME) {
        progressRef.current = requestAnimationFrame(tick);
      } else if (!correct) {
        setFailed(true);
      }
    };
    progressRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progressRef.current);
  }, [cycle, correct]);

  useEffect(() => {
    const currentSum = sel.reduce((acc, v, i) => acc + (v ? values[i] : 0), 0);
    setSum(currentSum);
    setIsBad(currentSum > 100 || currentSum < 0);

    if (currentSum === 100 && !correct) {
      setCorrect(true);
      setTimeout(() => {
        setCompletedCycles(prev => {
          const updated = [...prev, cycle];
          if (updated.length === MAX_CYCLES) setSuccess(true);
          return updated;
        });
        setCycle(prev => prev + 1);
      }, 1000);
    }
  }, [sel]);

  const toggle = i => {
    if (!correct && !failed) {
      setSel(prev => prev.map((v, idx) => (idx === i ? !v : v)));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#111] text-white">
      <h1 className="text-5xl font-bold mb-4">CIRCLE <span className="text-pink-500">SUM</span></h1>
      <p className="text-xl text-white/70 mb-8">Dopasuj kombinację dającą dokładnie 100%</p>

      <div className="relative w-[450px] h-[450px]">
        <motion.svg
          viewBox="0 0 450 450"
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          style={{ originX: '50%', originY: '50%' }}
        >
          {segs.map((s, i) => {
            const mid = (s.start + s.end) / 2;
            const rad = (mid - 90) * (Math.PI / 180);
            const move = sel[i] ? OFFSET_BASE * (isBad ? 1.5 : 1) : 0;
            const dx = Math.cos(rad) * move;
            const dy = Math.sin(rad) * move;
            return (
              <path
                key={i}
                d={describeDonutSlice(225, 225, OUTER_R, INNER_R_SEG, s.start % 360, s.end % 360)}
                fill={sel[i] ? (correct ? COLOR_OK : COLOR_ACTIVE) : COLOR_IDLE}
                stroke="#111"
                strokeWidth="2"
                strokeLinecap="round"
                onClick={() => toggle(i)}
                className="cursor-pointer hover:opacity-80 transition-transform"
                style={{ transform: `translate(${dx}px,${dy}px)` }}
              />
            );
          })}

          <circle cx={225} cy={225} r={INNER_R_FILL} fill="#444" />
          <circle
            cx={225}
            cy={225}
            r={(Math.min(Math.max(sum, 0), 100) / 100) * INNER_R_FILL}
            fill={correct ? COLOR_OK : isBad ? COLOR_BAD : COLOR_ACTIVE}
            className="transition-all duration-300"
          />
        </motion.svg>
      </div>

      <div className="mt-8 w-[450px] h-6 bg-white/10 rounded-full overflow-hidden flex">
        {Array(MAX_CYCLES).fill().map((_, i) => {
          const bgColor = failed
            ? COLOR_BAD
            : completedCycles.includes(i)
            ? COLOR_OK
            : COLOR_ACTIVE;
          return (
            <div key={i} className="relative flex-1 h-full border-l border-white/20 last:border-r">
              <motion.div
                key={`${cycle}-${i}`}
                initial={{ backgroundColor: bgColor }}
                animate={{
                  width: cycle === i ? `${progress * 100}%` : completedCycles.includes(i) ? '100%' : '0%',
                  backgroundColor: bgColor,
                }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-0 h-full"
              />
            </div>
          );
        })}
      </div>

      {failed && <p className="mt-6 text-2xl text-red-500 font-bold animate-pulse">HACK NIEZALICZONY</p>}
      {success && <p className="mt-6 text-2xl text-green-500 font-bold animate-pulse">HACK ZALICZONY</p>}
    </div>
  );
}
