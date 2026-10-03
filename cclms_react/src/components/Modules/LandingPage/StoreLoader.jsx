import React, { useState, useEffect, useRef } from "react";

/**
 * Enterprise store loader — pure CSS 3D, no dependencies besides React + Tailwind.
 *
 * Usage:  <StoreLoader isLoading={isLoading} progress={42} />
 *  - isLoading: true while loading. Omit it and the loader auto-closes after MIN_MS.
 *  - progress:  optional 0-100. Omit it and the bar runs as an indeterminate sweep.
 *
 * Theme tokens (edit in CSS block): --red #dc2626, --red-dark #b91c1c, --gray #F3F4F6
 * Size: change --sl-scale (0.6 = compact). Speed: edit the animation durations.
 */

const MESSAGES = [
  "Every credit, accounted for",
  "Balances you can trust",
  "Your ledger, always up to date",
];
const MIN_MS = 2500;
const FADE_MS = 400;

const CSS = `
.sl-root{--red:#dc2626;--red-dark:#b91c1c;--gray:#F3F4F6;--ink:#1f2933;
  --wall:linear-gradient(155deg,#ffffff,#eceef1);--side:linear-gradient(180deg,#dfe2e6,#cdd1d7);
  --edge:inset 0 0 0 1px rgba(31,41,51,.08),inset 2px 2px 6px rgba(255,255,255,.9),inset -3px -5px 10px rgba(31,41,51,.12);
  --sl-scale:.6}
.sl-box{position:relative;width:calc(340px*var(--sl-scale));height:calc(250px*var(--sl-scale))}
.sl-stage{position:absolute;left:0;top:0;width:340px;height:250px;perspective:1000px;
  transform:scale(var(--sl-scale));transform-origin:0 0}
.sl-scene{position:absolute;left:50%;top:66%;width:0;height:0;transform-style:preserve-3d;
  transform:rotateX(-22deg) rotateY(-28deg);animation:sl-rock 6s ease-in-out .8s infinite alternate}
.sl-3d{transform-style:preserve-3d;position:absolute;left:0;top:0}
.sl-face{position:absolute;box-sizing:border-box;transform-style:preserve-3d}

/* ground: flat slab with a hairline edge */
.sl-ground{left:-150px;top:-115px;width:300px;height:230px;border-radius:4px;transform:rotateX(90deg);
  background:linear-gradient(145deg,#f7f8f9,#e6e9ed);box-shadow:inset 0 0 0 1px rgba(31,41,51,.1)}
.sl-shadow{left:-110px;top:-75px;width:220px;height:150px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(31,41,51,.22),transparent);transform:translateY(-1px) rotateX(90deg)}

/* building: 160 wide, 110 deep, 120 tall, crisp corners */
.sl-bld{transform-origin:50% 0;animation:sl-rise .6s cubic-bezier(.25,.8,.35,1) 0s backwards}
.sl-breathe{transform-origin:50% 0;animation:sl-breathe 3s ease-in-out .8s infinite alternate}
.sl-front,.sl-back{left:-80px;top:-120px;width:160px;height:120px;background:var(--wall);box-shadow:var(--edge)}
.sl-front{transform:translateZ(55px)}
.sl-back{transform:rotateY(180deg) translateZ(55px)}
.sl-right,.sl-left{left:-55px;top:-120px;width:110px;height:120px;background:var(--side);box-shadow:var(--edge)}
.sl-right{transform:rotateY(90deg) translateZ(80px)}
.sl-left{transform:rotateY(-90deg) translateZ(80px)}
.sl-roof{left:-90px;top:-65px;width:180px;height:130px;border-radius:3px;transform:translateY(-120px) rotateX(90deg);
  background:linear-gradient(145deg,#3b4452,#262c36);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}

/* awning in brand red */
.sl-awn{left:-10px;top:28px;width:176px;height:32px;transform-origin:50% 0;transform:rotateX(55deg);
  background:repeating-linear-gradient(90deg,var(--red) 0 22px,#f3f4f6 22px 44px);
  border-radius:0 0 3px 3px;z-index:3;border-bottom:3px solid var(--red-dark);
  box-shadow:inset 0 3px 5px rgba(255,255,255,.35),inset 0 -6px 8px rgba(0,0,0,.2);
  animation:sl-awn .5s cubic-bezier(.3,1.1,.5,1) .45s backwards}

/* window + OPEN sign */
.sl-win{left:12px;top:56px;width:58px;height:50px;border-radius:2px;overflow:hidden;
  background:linear-gradient(160deg,#cfdae4,#eef3f8);box-shadow:inset 0 0 0 2px #2b2f36,inset 3px 3px 8px rgba(70,90,110,.3)}
.sl-win:after{content:"";position:absolute;top:-10px;left:16px;width:7px;height:90px;background:rgba(255,255,255,.6);transform:rotate(30deg)}
.sl-sign{position:absolute;top:5px;left:50%;margin-left:-19px;width:38px;height:16px;border-radius:2px;
  background:#fff;box-shadow:0 2px 3px rgba(31,41,51,.25);
  font:700 8px/16px system-ui,sans-serif;letter-spacing:.1em;text-align:center;color:var(--red);
  transform-origin:50% 0;z-index:2;animation:sl-drop .4s ease-out 1.1s backwards,sl-sway 3s ease-in-out 1.5s infinite alternate}

/* door */
.sl-doorframe{left:102px;top:52px;width:42px;height:68px;background:#2b2f36;box-shadow:inset 3px 3px 8px rgba(0,0,0,.5)}
.sl-door{left:102px;top:52px;width:42px;height:68px;border-radius:1px;transform-origin:0 50%;transform:rotateY(-105deg);
  background:linear-gradient(160deg,#ef4444,var(--red));box-shadow:inset 0 0 0 1px rgba(255,255,255,.15),inset -4px -6px 10px rgba(0,0,0,.3);
  animation:sl-door .55s cubic-bezier(.3,1.15,.5,1) .8s backwards}
.sl-door:after{content:"";position:absolute;right:6px;top:34px;width:6px;height:6px;border-radius:50%;background:#fff}

/* progress: 2px hairline */
.sl-bar{position:relative;height:2px;width:160px;background:#dfe2e6;overflow:hidden}
.sl-bar>i{position:absolute;inset:0 auto 0 0;background:var(--red);transition:width .3s ease}
.sl-bar>i.sl-ind{width:35%;animation:sl-sweep 1.4s cubic-bezier(.4,0,.2,1) infinite}

@keyframes sl-rock{from{transform:rotateX(-22deg) rotateY(-33deg)}to{transform:rotateX(-22deg) rotateY(-23deg)}}
@keyframes sl-rise{0%{transform:scale3d(1.06,0,1.06)}60%{transform:scale3d(.98,1.03,.98)}100%{transform:scale3d(1,1,1)}}
@keyframes sl-breathe{from{transform:scale3d(1,1,1)}to{transform:scale3d(1.006,1.008,1.006)}}
@keyframes sl-awn{0%{transform:rotateX(0) scaleY(.15);opacity:0}60%{transform:rotateX(63deg) scaleY(1);opacity:1}100%{transform:rotateX(55deg)}}
@keyframes sl-door{from{transform:rotateY(0)}to{transform:rotateY(-105deg)}}
@keyframes sl-drop{from{transform:translateY(-24px) rotate(40deg);opacity:0}to{transform:none;opacity:1}}
@keyframes sl-sway{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
@keyframes sl-sweep{from{transform:translateX(-100%)}to{transform:translateX(290%)}}
@keyframes sl-msg{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}

@media (prefers-reduced-motion: reduce){
  .sl-root *{animation:none !important}
  .sl-bar>i.sl-ind{width:100%;opacity:.5}
}
`;

const StoreLoader = ({ isLoading = null, progress = null }) => {
  const [autoLoading, setAutoLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [msg, setMsg] = useState(0);
  const startedAt = useRef(Date.now());

  const loading = isLoading === null ? autoLoading : isLoading;
  const hasProgress = typeof progress === "number";
  const pct = hasProgress ? Math.min(100, Math.max(0, progress)) : 0;

  // Fallback: no prop given -> close after MIN_MS
  useEffect(() => {
    if (isLoading !== null) return;
    const t = setTimeout(() => setAutoLoading(false), MIN_MS);
    return () => clearTimeout(t);
  }, [isLoading]);

  // Min display time, then fade, then unmount
  useEffect(() => {
    if (loading) {
      startedAt.current = Date.now();
      setVisible(true);
      setFading(false);
      return;
    }
    const wait = Math.max(0, MIN_MS - (Date.now() - startedAt.current));
    let removeTimer;
    const fadeTimer = setTimeout(() => {
      setFading(true);
      removeTimer = setTimeout(() => setVisible(false), FADE_MS);
    }, wait);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [loading]);

  // Cycle loading messages
  useEffect(() => {
    const t = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 1400);
    return () => clearInterval(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="sl-root fixed inset-0 z-50 min-h-screen bg-white flex flex-col items-center justify-center p-4"
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading customer credit ledger"
    >
      <style>{CSS}</style>

      <div className="sl-box">
        <div className="sl-stage">
          <div className="sl-scene">
            <div className="sl-face sl-ground" />
            <div className="sl-3d sl-shadow" />

            <div className="sl-3d sl-bld">
              <div className="sl-3d sl-breathe">
                <div className="sl-face sl-back" />
                <div className="sl-face sl-left" />
                <div className="sl-face sl-right" />
                <div className="sl-face sl-roof" />
                <div className="sl-face sl-front">
                  <div className="sl-face sl-doorframe" />
                  <div className="sl-face sl-door" />
                  <div className="sl-face sl-win">
                    <div className="sl-sign">OPEN</div>
                  </div>
                  <div className="sl-awn" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center">
        <div
          className="sl-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={hasProgress ? pct : undefined}
        >
          <i
            className={hasProgress ? "" : "sl-ind"}
            style={hasProgress ? { width: `${pct}%` } : undefined}
          />
        </div>
        <p
          key={msg}
          className="mt-3 text-xs font-medium tracking-wide text-slate-500"
          style={{ animation: "sl-msg .35s ease-out" }}
        >
          {MESSAGES[msg]}
        </p>
      </div>
    </div>
  );
};

export default StoreLoader;
