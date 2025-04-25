import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const TOTAL = 6;
const OUTER_R = 280;
const INNER_R_SEG = 180;
const INNER_R_FILL = 90;
const MAX_TOTAL = 150;
const GAP = 4;
const CYCLE_TIME_BASE = 5000; // 5 sec
const MAX_CYCLES = 3;

// Kolory
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

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

  // Generuje segmenty + wartości (±)
  const setupGame = () => {
    setFailed(false);
    setCorrect(false);
    setProgress(0);
    setSum(0);
    setIsBad(false);

    // segmenty
    const offset = Math.random() * 360;
    const slice = 360 / TOTAL;
    const segments = Array.from({ length: TOTAL }, (_, i) => ({
      start: offset + i * slice + GAP/2,
      end: offset + (i+1)*slice - GAP/2
    }));
    setSegs(segments);

    // wartości: 100% i + extras + losowe ujemne
    let baseVals = [];
    let cuts = [0];
    for (let i=0;i<TOTAL-1;i++) cuts.push(Math.random()*200-100);
    cuts.push(100);
    cuts.sort((a,b)=>a-b);
    for (let i=1;i<cuts.length;i++) {
      baseVals.push(Math.floor(cuts[i]-cuts[i-1]));
    }
    setValues(shuffleArray(baseVals));
    setSel(Array(TOTAL).fill(false));
  };

  // start rundy
  useEffect(() => {
    if (cycle < MAX_CYCLES && !success) setupGame();
  }, [cycle]);

  // timer, zmienia się co cykl i gdy poprawne
  useEffect(() => {
    if (progressRef.current) cancelAnimationFrame(progressRef.current);
    const duration = Math.max(5000, CYCLE_TIME_BASE - cycle*3000);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(elapsed/duration,1));
      if (elapsed < duration) {
        progressRef.current = requestAnimationFrame(tick);
      } else if (!correct) {
        setFailed(true);
      }
    };
    progressRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progressRef.current);
  }, [cycle, correct]);

  // liczymy sumę
  useEffect(() => {
    const s = sel.reduce((acc,v,i)=>acc + (v?values[i]:0),0);
    setSum(s);
    setIsBad(s>100);
    if (s===100 && !correct) {
      setCorrect(true);
      setTimeout(() => {
        setCompletedCycles(prev=>{
          const u=[...prev,cycle];
          if(u.length===MAX_CYCLES) setSuccess(true);
          return u;
        });
        setCycle(c=>c+1);
      },1000);
    }
  }, [sel]);

  const toggle = i => {
    if (!correct && !failed) {
      setSel(s=>s.map((v,j)=>j===i?!v:v));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[600px] w-[600px] bg-[#111] rounded-2xl shadow-2xl overflow-hidden">
      <h1 className="text-5xl font-extrabold mb-4 text-white drop-shadow-lg">
        CIRCLE <span className="text-pink-500">SUM</span>
      </h1>
      <p className="text-xl text-white/70 mb-8">Dopasuj do 100% z ± wartości!</p>

      <div className="relative w-[560px] h-[560px]">
        <motion.svg
          viewBox="0 0 600 600"
          className="absolute inset-0"
        >
          {segs.map((s,i)=>{
            const mid=(s.start+s.end)/2;
            const rad=(mid-90)*(Math.PI/180);
            const move = sel[i]?OFFSET_BASE*1.2:0;
            const dx=Math.cos(rad)*move, dy=Math.sin(rad)*move;
            return (
              <motion.path
                key={i}
                d={describeDonutSlice(300,300,OUTER_R,INNER_R_SEG,s.start,s.end)}
                fill={sel[i]?(correct?COLOR_OK:COLOR_ACTIVE):COLOR_IDLE}
                onClick={()=>toggle(i)}
                className="cursor-pointer hover:opacity-80 transition-transform drop-shadow-md"
                style={{transform:`translate(${dx}px,${dy}px)`}}
                animate={{rotate:[0,360]}}
                transition={{repeat:Infinity, duration:6+i, ease:'linear'}}
              />
            );
          })}
          <circle cx={300} cy={300} r={INNER_R_FILL} fill="#444" className="drop-shadow-inner"/>
          <motion.circle
            cx={300} cy={300}
            r={(Math.min(sum,MAX_TOTAL)/100)*INNER_R_FILL}
            fill={correct?COLOR_OK:(isBad?COLOR_BAD:COLOR_ACTIVE)}
            className="transition-all duration-500 drop-shadow-inner"
          />
        </motion.svg>
      </div>

      <div className="mt-6 w-full h-6 bg-white/10 rounded-full overflow-hidden flex">
        {Array(MAX_CYCLES).fill(0).map((_,i)=>{
          const bg = failed?COLOR_BAD:(completedCycles.includes(i)?COLOR_OK:COLOR_ACTIVE);
          return (
            <div key={i} className="flex-1 h-full border-l border-white/20 last:border-r relative">
              <motion.div
                key={`${cycle}-${i}`}
                initial={{backgroundColor:bg}}
                animate={{
                  width: cycle===i?`${progress*100}%`:(completedCycles.includes(i)?'100%':'0%'),
                  backgroundColor:bg
                }}
                transition={{duration:0.3}}
                className="absolute left-0 top-0 h-full"
              />
            </div>
          );
        })}
      </div>

      {failed && <p className="mt-4 text-2xl text-red-500 font-bold animate-pulse drop-shadow-lg">HACK NIEZALICZONY</p>}
      {success && <p className="mt-4 text-2xl text-green-500 font-bold animate-pulse drop-shadow-lg">HACK ZALICZONY!</p>}
    </div>
  );
}
